import { type Request, type Response } from "express";
import { AuthLoginBody } from "@workspace/api-zod";
import { generateToken } from "../middleware/auth.js";
import {
  AuthServiceError,
  loginAdmin,
  toUserProfile,
} from "../services/auth-service.js";

function handleAuthError(res: Response, error: unknown) {
  if (error instanceof AuthServiceError) {
    res.status(error.status).json({ error: error.error, message: error.message });
    return;
  }

  res.status(500).json({ error: "Internal Server Error", message: "Something went wrong." });
}

export async function adminLoginController(req: Request, res: Response) {
  const parsed = AuthLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation Error", message: "Valid email and password required" });
    return;
  }

  try {
    const user = await loginAdmin(parsed.data);
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

