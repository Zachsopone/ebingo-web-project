import express from "express";
import { getBranches, updateBranch, updateBranchTime, addBranch, deleteBranch, getBranchById, getBranchesFiltered, } from "../controllers/branches.controller.js";
import verifyUser from "../middlewares/auth.middleware.js";


const router = express.Router();

router.get("/", getBranches);     // GET /branches → list all
router.post("/", verifyUser(["superadmin","kaizen","cashier","guard"]), getBranchesFiltered);
router.post("/add", addBranch);         // POST /branches/add → add new
router.put("/:id", updateBranch);       // PUT /branches/:id → update
router.put("/:id/time", updateBranchTime);  // updates opening_time & closing_time only
router.delete("/:id", deleteBranch);    // DELETE /branches/:id → delete
router.get("/:id", getBranchById);

export default router;