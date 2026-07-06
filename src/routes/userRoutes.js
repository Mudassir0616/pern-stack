import express from "express";
import {
    getMe,
    getUserById,
    getUsers,
    updateMe,
} from "../controllers/userController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.get("/me", protect, getMe);
router.patch("/me", protect, upload.single("avatar"), updateMe);
router.get("/", protect, getUsers);
router.get("/:id", protect, getUserById);

export default router;
