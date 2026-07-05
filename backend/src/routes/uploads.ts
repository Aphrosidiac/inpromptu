import { Hono } from "hono";
import { requireAuth } from "../middleware/requireAuth";
import { checkRateLimit } from "../lib/rateLimit";
import type { Env } from "../env";

const app = new Hono<{ Bindings: Env; Variables: { userId: string } }>();

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const MAX_BYTES = 5 * 1024 * 1024;

// The client-supplied Content-Type is trivially spoofable (it's just a form-part header) --
// checking the actual leading bytes confirms the upload really is the image format it claims
// to be before it's stored and served back with that same declared content-type.
const MAGIC_BYTES: Record<string, (b: Uint8Array) => boolean> = {
  "image/png": (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/gif": (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46,
  "image/webp": (b) =>
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
};

app.post("/", requireAuth, async (c) => {
  const userId = c.get("userId");

  // No prior limit on how many uploads a user could make -- an authenticated user could loop
  // POST /uploads indefinitely, each write costing real R2 storage forever.
  if (!(await checkRateLimit(c, `upload:${userId}`))) {
    return c.json({ success: false, message: "Too many uploads, try again shortly" }, 429);
  }

  const body = await c.req.parseBody();
  const file = body.file;

  if (!(file instanceof File)) {
    return c.json({ success: false, message: "No file provided" }, 400);
  }
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return c.json({ success: false, message: "Unsupported image type" }, 400);
  }
  if (file.size > MAX_BYTES) {
    return c.json({ success: false, message: "Image too large (max 5MB)" }, 400);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const matchesMagicBytes = MAGIC_BYTES[file.type];
  if (!matchesMagicBytes || !matchesMagicBytes(bytes)) {
    return c.json({ success: false, message: "File does not match its declared image type" }, 400);
  }

  const key = `${userId}/${crypto.randomUUID()}.${ext}`;
  await c.env.UPLOADS.put(key, bytes, {
    httpMetadata: { contentType: file.type },
  });

  return c.json({ success: true, data: { url: `/api/images/${key}` } }, 201);
});

export default app;
