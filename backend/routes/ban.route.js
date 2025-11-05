import express from "express";
import {
  ban,
  unban,
  banned,
} from "../controllers/ban.controller.js";

const router = express.Router();

router.post("/ban/:id", ban);
router.post("/unban/:id", unban);
router.post("/banned", banned);

export default router;
