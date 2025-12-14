import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secret";
const BEARER_PREFIX = "Bearer ";

/**
 * Extracts JWT token from Authorization header
 * @param authHeader Authorization header value
 * @returns Token string or null if format is invalid
 */
function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  if (!authHeader.startsWith(BEARER_PREFIX)) {
    return null;
  }

  return authHeader.substring(BEARER_PREFIX.length);
}

/**
 * Verifies JWT token and returns decoded payload
 * @param token JWT token string
 * @returns Decoded user data
 * @throws Error if token is invalid or expired
 */
function verifyToken(
  token: string
): { id: number; email: string; role: string } {
  return jwt.verify(token, JWT_SECRET) as {
    id: number;
    email: string;
    role: string;
  };
}

/**
 * Authentication middleware: validates JWT token and attaches user to request
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    // Validate header presence
    if (!authHeader) {
      res.status(401).json({ error: "Missing authorization header" });
      return;
    }

    // Extract and validate token format
    const token = extractToken(authHeader);
    if (!token) {
      res.status(401).json({ error: "Invalid authorization format" });
      return;
    }

    // Verify token signature and expiry
    const decoded = verifyToken(token);

    // Attach user to request context
    req.user = decoded;

    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      res.status(401).json({ error: "Token expired" });
      return;
    }

    if (error.name === "JsonWebTokenError") {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    res.status(401).json({ error: "Authentication failed" });
  }
}

/**
 * Authorization middleware: verifies user has Admin role
 * IMPORTANT: authMiddleware must run before this middleware
 */
export function adminMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Validate user is authenticated (authMiddleware should run first)
  if (!req.user) {
    res.status(401).json({ error: "User not authenticated" });
    return;
  }

  // Verify user has Admin role
  if (req.user.role !== "Admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  next();
}
