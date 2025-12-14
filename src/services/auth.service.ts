import bcrypt from "bcryptjs";
import { prisma } from "../prisma/client";

export async function registerUser(email: string, password: string) {
  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user in database
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role: "User",
    },
  });

  // Return user without password
  return {
    id: user.id,
    email: user.email,
    role: user.role,
  };
}
