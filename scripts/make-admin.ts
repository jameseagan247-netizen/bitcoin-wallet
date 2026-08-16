import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const username = "James";

  const user = await prisma.user.findUnique({
    where: {
      username,
    },
    select: {
      id: true,
      username: true,
      role: true,
    },
  });

  if (!user) {
    throw new Error('User "James" was not found.');
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      role: "ADMIN",
    },
    select: {
      id: true,
      username: true,
      role: true,
    },
  });

  console.log("Admin account updated:");
  console.log(updatedUser);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });