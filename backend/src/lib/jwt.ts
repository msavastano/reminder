import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";

export const AUTH_COOKIE_NAME = "reminder_token";
const JWT_EXPIRES_IN = "7d";

export interface AuthTokenPayload {
  userId: string;
  role: Role;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return secret;
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: JWT_EXPIRES_IN });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  return jwt.verify(token, getSecret()) as AuthTokenPayload;
}
