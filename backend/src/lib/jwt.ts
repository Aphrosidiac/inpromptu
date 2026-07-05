import { SignJWT, jwtVerify } from "jose";

const encoder = new TextEncoder();

export async function signAccessToken(userId: string, secret: string) {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("20m")
    .sign(encoder.encode(secret));
}

export async function verifyAccessToken(token: string, secret: string): Promise<string> {
  const { payload } = await jwtVerify(token, encoder.encode(secret));
  if (typeof payload.sub !== "string") throw new Error("Invalid token subject");
  return payload.sub;
}

export async function sha256Hex(input: string): Promise<string> {
  const data = encoder.encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function generateOpaqueToken(): string {
  return crypto.randomUUID() + crypto.randomUUID();
}
