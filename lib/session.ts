import crypto from "crypto";
import type { NextRequest } from "next/server";

const SECRET = process.env.JWT_SECRET;

export interface SessionPayload {
  user_id: string;
  username: string;
  iat: number;
  exp: number;
}

// ── Encoding helpers ───────────────────────────────────────────────────────────

function base64url(input: Buffer): string {
  return input.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function hmacSign(data: string, secret: string): string {
  return base64url(crypto.createHmac("sha256", secret).update(data).digest());
}

// ── Token sign / verify ────────────────────────────────────────────────────────

export function signToken(payload: Omit<SessionPayload, "iat" | "exp">): string {
  if (!SECRET) throw new Error("JWT_SECRET is not set.");
  const now = Math.floor(Date.now() / 1000);
  const full: SessionPayload = { ...payload, iat: now, exp: now + 60 * 60 * 24 * 7 }; // 7 days
  const header = base64url(Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body   = base64url(Buffer.from(JSON.stringify(full)));
  const sig    = hmacSign(`${header}.${body}`, SECRET);
  return `${header}.${body}.${sig}`;
}

export function verifyToken(token: string): SessionPayload | null {
  if (!SECRET) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  const expected = hmacSign(`${header}.${body}`, SECRET);
  // Constant-time comparison to prevent timing attacks
  if (sig.length !== expected.length) return null;
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url" as BufferEncoding).toString()) as SessionPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

// ── Cookie helper ──────────────────────────────────────────────────────────────

export const COOKIE_NAME = "onpeak_session";

export function getSession(req: NextRequest): SessionPayload | null {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}
