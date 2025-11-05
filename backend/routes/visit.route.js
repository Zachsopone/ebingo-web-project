import express from "express";
import { downloadVisitsExcel } from "../controllers/visit.controller.js";

const router = express.Router();

// download visits by Member ID and Card_No
router.get("/download/:id/:cardNo", downloadVisitsExcel);

export default router;