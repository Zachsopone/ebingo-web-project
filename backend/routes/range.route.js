import express from "express";
import { downloadVisitsByDateRange } from "../controllers/range.controller.js";
import verifyUser from "../middlewares/auth.middleware.js";

const router = express.Router();

// download visits by date range (any logged-in user)
router.get("/download", verifyUser(), downloadVisitsByDateRange);

export default router;