import express from "express";
import { generateMemberDocx } from "../controllers/docs.controller.js";

const router = express.Router();
router.get("/:id/docx", generateMemberDocx);

export default router;