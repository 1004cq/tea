import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(normalizeEmail(email));
}

export async function registerUser(input: {
  email: string;
  password: string;
  name?: string;
}) {
  const email = normalizeEmail(input.email);
  if (!isValidEmail(email)) {
    throw new Error("INVALID_EMAIL");
  }
  if (input.password.length < 8) {
    throw new Error("WEAK_PASSWORD");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing?.passwordHash) {
    throw new Error("EMAIL_TAKEN");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const name = (input.name || "").trim() || email.split("@")[0];

  if (existing) {
    // Google-only user adding a password
    return prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash, name: existing.name || name },
    });
  }

  return prisma.user.create({
    data: { email, passwordHash, name },
  });
}

export async function verifyUserPassword(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
  });
  if (!user?.passwordHash) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  return user;
}

export async function upsertGoogleUser(input: {
  email: string;
  name?: string | null;
  image?: string | null;
}) {
  const email = normalizeEmail(input.email);
  return prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: input.name || email.split("@")[0],
      image: input.image || null,
    },
    update: {
      name: input.name || undefined,
      image: input.image || undefined,
    },
  });
}
