import { RequestHandler } from "express";
import { RegisterRequest, RegisterResponse, LoginRequest, LoginResponse, User, UserRole } from "@shared/api";
import crypto from "crypto";

// Simple in-memory storage for demo purposes
// In a real application, you would use a proper database
interface StoredUser {
  id: string;
  name: string;
  email: string;
  password: string; // In production, this should be hashed
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

// Initialize with some default users for testing
const users: StoredUser[] = [
  {
    id: 'admin1',
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'donor1',
    name: 'Donor User',
    email: 'donor@example.com',
    password: 'donor123',
    role: 'donor',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'receiver1',
    name: 'Receiver User',
    email: 'receiver@example.com',
    password: 'receiver123',
    role: 'receiver',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Simple JWT-like token generation for demo
const generateToken = (userId: string, role: UserRole): string => {
  const payload = { userId, role, exp: Date.now() + (24 * 60 * 60 * 1000) }; // 24 hours
  return Buffer.from(JSON.stringify(payload)).toString('base64');
};

const validateToken = (token: string): { userId: string; role: UserRole } | null => {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    if (payload.exp < Date.now()) {
      return null; // Token expired
    }
    return { userId: payload.userId, role: payload.role };
  } catch {
    return null;
  }
};

// Helper function to find user by email
const findUserByEmail = (email: string): StoredUser | undefined => {
  return users.find(user => user.email.toLowerCase() === email.toLowerCase());
};

// Helper function to find user by id
const findUserById = (id: string): StoredUser | undefined => {
  return users.find(user => user.id === id);
};

// Register endpoint
export const handleRegister: RequestHandler = (req, res) => {
  try {
    const { name, email, password, role }: RegisterRequest = req.body;

    // Validation
    if (!name || !email || !password || !role) {
      const response: RegisterResponse = {
        success: false,
        message: "All fields are required."
      };
      return res.status(400).json(response);
    }

    if (!['donor', 'receiver', 'admin'].includes(role)) {
      const response: RegisterResponse = {
        success: false,
        message: "Invalid role specified."
      };
      return res.status(400).json(response);
    }

    // Check if user already exists
    if (findUserByEmail(email)) {
      const response: RegisterResponse = {
        success: false,
        message: "User with this email already exists."
      };
      return res.status(409).json(response);
    }

    // Create new user
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const newUser: StoredUser = {
      id: userId,
      name,
      email: email.toLowerCase(),
      password, // In production, hash this password
      role,
      createdAt: now,
      updatedAt: now
    };

    users.push(newUser);

    // Generate token
    const token = generateToken(userId, role);

    // Return user data without password
    const userResponse: Omit<User, 'createdAt' | 'updatedAt'> = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    };

    const response: RegisterResponse = {
      success: true,
      message: "Registration successful!",
      user: userResponse,
      token
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Registration error:", error);
    const response: RegisterResponse = {
      success: false,
      message: "Internal server error."
    };
    res.status(500).json(response);
  }
};

// Login endpoint
export const handleLogin: RequestHandler = (req, res) => {
  try {
    const { email, password }: LoginRequest = req.body;

    // Validation
    if (!email || !password) {
      const response: LoginResponse = {
        success: false,
        message: "Email and password are required."
      };
      return res.status(400).json(response);
    }

    // Find user
    const user = findUserByEmail(email);
    if (!user) {
      const response: LoginResponse = {
        success: false,
        message: "Invalid email or password."
      };
      return res.status(401).json(response);
    }

    // Check password (in production, use proper password hashing)
    if (user.password !== password) {
      const response: LoginResponse = {
        success: false,
        message: "Invalid email or password."
      };
      return res.status(401).json(response);
    }

    // Generate token
    const token = generateToken(user.id, user.role);

    // Return user data without password
    const userResponse: Omit<User, 'createdAt' | 'updatedAt'> = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    const response: LoginResponse = {
      success: true,
      message: "Login successful!",
      user: userResponse,
      token
    };

    res.json(response);
  } catch (error) {
    console.error("Login error:", error);
    const response: LoginResponse = {
      success: false,
      message: "Internal server error."
    };
    res.status(500).json(response);
  }
};

// Middleware for authentication
export const authenticateToken: RequestHandler = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ success: false, message: "Access token required." });
  }

  const decoded = validateToken(token);
  if (!decoded) {
    return res.status(403).json({ success: false, message: "Invalid or expired token." });
  }

  // Add user info to request object
  (req as any).user = { id: decoded.userId, role: decoded.role };
  next();
};

// Middleware for role-based access control
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Insufficient permissions." });
    }

    next();
  };
};

// Export utilities for other routes
export { validateToken, findUserById, users };
