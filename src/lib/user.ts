import { prisma } from "@/lib/prisma";
import { readSessionUserId } from "@/lib/auth";

export async function getSessionUser() {
  const userId = await readSessionUserId();
  if (!userId) return null;
  return prisma.user.findUnique({
    where: { id: userId },
    include: { coach: true },
  });
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}
