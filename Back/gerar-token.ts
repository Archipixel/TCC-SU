import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const secret = process.env.JWT_SECRET || "fallback_secret";

const payload = {
  id: "teste-admin-id",
  googleId: "google-teste-123",
  email: "admin@teste.com",
  name: "Admin Teste",
  avatar: null,
  role: "USER",
};

const token = jwt.sign(payload, secret, { expiresIn: "1d" });

console.log("Token gerado:\n");
console.log(token);
