import { Router, type IRouter } from "express";
import { AdminLoginBody } from "@workspace/api-zod";
import { generateToken } from "../../middleware/auth.js";

const router: IRouter = Router();

const ADMINS: Record<string, string> = {
  admin: process.env.ADMIN_PASSWORD || "admin123",
  superadmin: process.env.SUPERADMIN_PASSWORD || "super456",
};

router.post("/admin/login", (req, res) => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Bad Request", message: "Username and password are required" });
    return;
  }

  const { username, password } = parsed.data;
  const expectedPassword = ADMINS[username];

  if (!expectedPassword || expectedPassword !== password) {
    res.status(401).json({ error: "Unauthorized", message: "Invalid username or password" });
    return;
  }

  const token = generateToken(username);
  res.json({ token, username });
});

export default router;
