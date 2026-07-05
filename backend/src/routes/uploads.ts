import { Hono } from "hono";
import { requireAuth } from "../middleware/requireAuth";
import type { Env } from "../env";

const app = new Hono<{ Bindings: Env; Variables: { userId: string } }>();

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const MAX_BYTES = 5 * 1024 * 1024;

app.post("/", requireAuth, async (c) => {
  const userId = c.get("userId");
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

  const key = `${userId}/${crypto.randomUUID()}.${ext}`;
  await c.env.UPLOADS.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });

  return c.json({ success: true, data: { url: `/api/images/${key}` } }, 201);
});

export default app;
