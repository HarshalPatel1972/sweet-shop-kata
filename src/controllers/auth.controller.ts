import { Request, Response } from "express";
import { registerUser, loginUser } from "../services/auth.service";

export async function register(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await registerUser(email, password);
    res.status(201).json(user);
  } catch (error: any) {
    // Handle unique constraint error (duplicate email)
    if (error.code === "P2002") {
      return res.status(409).json({ error: "Email already exists" });
    }
    res.status(400).json({ error: "Registration failed" });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await loginUser(email, password);
    res.status(200).json(user);
  } catch (error: any) {
    // Invalid credentials
    if (error.message === "Invalid credentials") {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    res.status(400).json({ error: "Login failed" });
  }
}
