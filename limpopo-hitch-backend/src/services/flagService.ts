import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function addFlagAndCheckBan(
  flaggedUserId: string,
  reporterId: string,
  reporterRole: string,
  reason: string,
  detail: string
) {
  const flag = await prisma.flag.create({
    data: {
      flaggedUserId,
      reporterId,
      reporterRole: reporterRole === "driver" ? "driver" : "hiker",
      reason,
      detail,
      createdAt: BigInt(Date.now()),
    },
  });

  // Check flag count for user
  const count = await prisma.flag.count({
    where: { flaggedUserId },
  });

  if (count >= 3) {
    // Auto ban user and close open posts
    await prisma.user.update({
      where: { id: flaggedUserId },
      data: { banned: true },
    });

    await prisma.post.updateMany({
      where: { authorId: flaggedUserId, open: true },
      data: { open: false, closedReason: "User banned due to multiple safety flags" },
    });
  }

  return flag;
}

export async function unbanAndClearFlags(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { banned: false },
  });

  await prisma.flag.deleteMany({
    where: { flaggedUserId: userId },
  });
}
