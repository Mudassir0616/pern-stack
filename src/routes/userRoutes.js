import express from "express";
import { createUser, deleteUser, getUsers } from "../controllers/userController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", createUser);
router.get("/", protect, getUsers);
router.delete("/:id", deleteUser);

export default router;