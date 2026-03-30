import { type Request, type Response } from "express";
import { AuthLoginBody } from "@workspace/api-zod";
import {
  AuthServiceError,
  getCurrentUser,
  loginVerifiedUser,
  toUserProfile,
} from "../services/auth-service.js";
import { generateToken, type AuthRequest } from "../middleware/auth.js";

function handleAuthError(res: Response, error: unknown) {
  if (error instanceof AuthServiceError) {
    res.status(error.status).json({ error: error.error, message: error.message });
    return;
  }

  res.status(500).json({ error: "Internal Server Error", message: "Something went wrong." });
}

export async function signupController(req: Request, res: Response) {
  void req;
  res.status(403).json({
    error: "Forbidden",
    message: "Public signup is disabled. Use the configured client account.",
  });
}

export async function userLoginController(req: Request, res: Response) {
  const parsed = AuthLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation Error", message: "Valid email and password required" });
    return;
  }

  try {
    const user = await loginVerifiedUser(parsed.data);
    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    res.json({
      token,
      user: toUserProfile(user),
    });
  } catch (error) {
    handleAuthError(res, error);
  }
}

export async function authMeController(req: AuthRequest, res: Response) {
  try {
    const user = await getCurrentUser(req.user!.id);
    res.json(toUserProfile(user));
  } catch (error) {
    handleAuthError(res, error);
  }
}
