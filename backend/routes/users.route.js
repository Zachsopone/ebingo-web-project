import express from "express";
import { 
  getUsers, 
  updateUserPassword, 
  addUser, 
  updateUser, 
  deleteUser 
} from "../controllers/users.controller.js";

const router = express.Router();

router.get("/", getUsers);
router.post("/add", addUser);
router.put("/:ID", updateUser);
router.put("/:userId/password", updateUserPassword);
router.delete("/:ID", deleteUser);

export default router;