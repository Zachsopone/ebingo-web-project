import express from "express";
import multer from "multer";
import path from 'path';
import fs from 'fs';
import uploadImages from "../controllers/images.controller.js";

const router = express.Router();

const STORAGE_ROOT = process.env.STORAGE_PATH || path.join(process.cwd(), "storage");

const UPLOAD_DIR = path.join(STORAGE_ROOT, "upload");
const VALID_DIR  = path.join(STORAGE_ROOT, "valid");

// Ensure directories exist
[UPLOAD_DIR, VALID_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  console.log(`Created directory: ${dir}`);
});

// Custom storage 
const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    if (file.fieldname === "profile") return cb(null, UPLOAD_DIR);
    if (file.fieldname === "valid") return cb(null, VALID_DIR);
    cb(new Error("Invalid field name"));
  },
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, GIF and WebP images allowed"), false);
    }
  }
});

// Route for uploading images
router.post(
  '/upload',
  upload.fields([
    { name: 'profile', maxCount: 1 },
    { name: 'valid',   maxCount: 1 }
  ]),
  (err, _req, res, next) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: err.message });
    }
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  },
  uploadImages
);

export default router;