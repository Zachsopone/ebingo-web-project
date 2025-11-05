import express from "express";
import { getBranches, updateBranch, addBranch, deleteBranch } from "../controllers/branches.controller.js";

const router = express.Router();


router.get("/", getBranches);           // GET /branches → list all
router.post("/add", addBranch);         // POST /branches/add → add new
router.put("/:id", updateBranch);       // PUT /branches/:id → update
router.delete("/:id", deleteBranch);    // DELETE /branches/:id → delete

export default router;
