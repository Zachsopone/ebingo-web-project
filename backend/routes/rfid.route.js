import express from "express";
import rfid from "../controllers/rfid.controller.js";

const router = express.Router();

router.post("/", rfid);

export default router;