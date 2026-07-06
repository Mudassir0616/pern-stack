import express from "express";
import {
    getFriendRequests,
    getFriends,
    removeFriend,
    respondFriendRequest,
    sendFriendRequest,
} from "../controllers/friendController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getFriends);
router.get("/requests", protect, getFriendRequests);
router.post("/requests/:userId", protect, sendFriendRequest);
router.patch("/requests/:id", protect, respondFriendRequest);
router.delete("/:userId", protect, removeFriend);

export default router;
