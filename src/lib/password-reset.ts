import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export async function createResetToken(userId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = sha256(token);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 saat

  await prisma.passwordResetToken.create({
    data: { userId, tokenHash, expiresAt },
  });

  return token;
}

export async function consumeResetTokenAndSetPassword(token: string, newPassword: string) {
  const tokenHash = sha256(token);
  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
  if (!row) return { ok: false as const, reason: "invalid" };
  if (row.usedAt) return { ok: false as const, reason: "used" };
  if (row.expiresAt.getTime() < Date.now()) return { ok: false as const, reason: "expired" };

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return { ok: true as const, userId: row.userId };
}
