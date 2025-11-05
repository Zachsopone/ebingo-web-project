import express from "express";
import { downloadPlayersByDateRange } from "../controllers/players.controller.js";
import verifyUser from "../middlewares/auth.middleware.js";

const router = express.Router();

// download players by date range (any logged-in user)
router.get("/download", verifyUser(), downloadPlayersByDateRange);

export default router;