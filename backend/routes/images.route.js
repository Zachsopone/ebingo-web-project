import express from "express";
import multer from "multer";
import uploadImages from "../controllers/images.controller.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    const folder = file.fieldname === "profile" ? "upload" : "valid";
    const uploadDir = path.join(__dirname, "../../Ebingo/public", folder);
    if (!fs.existsSync(uploadDir)) {
      try {
        fs.mkdirSync(uploadDir, { recursive: true });
      } catch (error) {
        console.error("Failed to create directory:", error);
        return cb(error);
      }
    }
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.mimetype)) {
      const error = new Error("Invalid file type. Only JPEG, PNG, and GIF are allowed.");
      error.status = 400;
      return cb(error);
    }
    cb(null, true);
  },
});

// Route for uploading images
router.post(
  "/upload",
  upload.fields([
    { name: "profile", maxCount: 1 },
    { name: "valid", maxCount: 1 },
  ]),
  (err, _req, res, next) => {
    if (err instanceof multer.MulterError) {
      console.error("Multer error:", err.message);
      return res.status(400).json({ error: err.message });
    } else if (err) {
      console.error("Error uploading file:", err.message);
      return res.status(400).json({ error: err.message });
    }
    next();
  },
  uploadImages
);

export default router;