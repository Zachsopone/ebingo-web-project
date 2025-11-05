import express from "express";
import {
  addMember,
  editMember,
  readMember,
  deleteMember,
  getMemberById,
} from "../controllers/members.controller.js";

const router = express.Router();

router.post("/view", readMember);
router.post("/add", addMember);
router.put("/:id", editMember);
router.delete("/:id", deleteMember);

// 🔹 New route for profile
router.get("/:id", getMemberById);

export default router;