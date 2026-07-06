import { z } from "zod";

/**
 * Validation schemas for the auth endpoints. These live server-side today; the
 * same shapes are duplicated into the mobile app (see mobile/src/lib/schemas)
 * so client and server agree on the request contract.
 */

export const ROLES = ["PATIENT", "CAREGIVER"] as const;

export const registerSchema = z.object({
  email: z.string().trim().email("A valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().trim().min(1, "Name is required"),
  role: z.enum(ROLES),
});

export const loginSchema = z.object({
  email: z.string().trim().email("A valid email is required"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
