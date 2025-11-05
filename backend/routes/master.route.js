import express from "express";
import { getMasterList } from "../controllers/master.controller.js";

const router = express.Router();

router.get("/", getMasterList);

export default router;