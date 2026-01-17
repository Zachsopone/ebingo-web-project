import express from "express";
import { downloadVisitsExcel } from "../controllers/visit.controller.js";

const router = express.Router();

// download visits by Member ID and IDNum
router.get("/download/:id/:IDNum", downloadVisitsExcel);

export default router;