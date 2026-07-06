import express from "express";
import {
    createPost,
    deletePost,
    getFeed,
    getUserPosts,
    likePost,
    unlikePost,
} from "../controllers/postController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.get("/", protect, getFeed);
router.post("/", protect, upload.single("image"), createPost);
router.get("/me", protect, getUserPosts);
router.get("/user/:userId", protect, getUserPosts);
router.post("/:id/like", protect, likePost);
router.delete("/:id/like", protect, unlikePost);
router.delete("/:id", protect, deletePost);

export default router;
