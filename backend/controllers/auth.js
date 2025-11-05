import { db } from "../connect.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET;

export const login = async (req, res) => {

  try {
    const { Username, Password } = req.body;

    const [rows] = await db.execute(
      `SELECT 
         ID,
         Username,
         Password AS password_hash,
         Role,
         Branch_ID
       FROM users
       WHERE username = ?`,
      [Username]
    );

    if (!rows.length) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const user = rows[0];

    const ok = await bcrypt.compare(Password, user.password_hash);

    if (!ok) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const token = jwt.sign(
      { 
        id: user.ID, 
        role: user.Role, 
        branch_id: user.Branch_ID 
      },
      SECRET_KEY,
      { expiresIn: "1d" }
    );

    return res.status(200).json({ token });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const logout = (_req, res) => {
  res
    .clearCookie("accessToken", { 
      secure: true, 
      sameSite: "none" 
    })
    .status(200)
    .json({ Status: "Success User has been logged out" });
};