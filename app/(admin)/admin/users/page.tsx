import prisma from "@/lib/prisma";
import UsersListClient from "./UsersListClient";

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      role: true,
      xp: true,
      level: true,
      createdAt: true,
      _count: {
        select: {
          submissions: true,
          problemStats: {
            where: {
              solved: true,
            },
          },
        },
      },
    },
  });

  return <UsersListClient users={users} />;
}
