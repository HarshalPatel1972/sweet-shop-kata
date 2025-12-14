import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "secret";
const JWT_EXPIRY = "7d";

/**
 * Hash a password using bcryptjs
 */
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Compare a plaintext password with a hashed password
 */
async function comparePasswords(
  plaintext: string,
  hashed: string
): Promise<boolean> {
  return bcrypt.compare(plaintext, hashed);
}

/**
 * Generate a JWT token for a user
 */
function generateToken(userId: number, email: string, role: string): string {
  return jwt.sign({ id: userId, email, role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRY,
  });
}

export async function registerUser(email: string, password: string) {
  // Hash the password
  const hashedPassword = await hashPassword(password);

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

export async function loginUser(email: string, password: string) {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  // User not found
  if (!user) {
    throw new Error("Invalid credentials");
  }

  // Compare password
  const isPasswordValid = await comparePasswords(password, user.password);

  // Password incorrect
  if (!isPasswordValid) {
    throw new Error("Invalid credentials");
  }

  // Generate JWT token
  const token = generateToken(user.id, user.email, user.role);

  // Return user without password + token
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    token,
  };
}
