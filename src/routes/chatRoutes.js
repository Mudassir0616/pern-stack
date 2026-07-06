import express from "express";

import { protect } from "../middlewares/authMiddleware.js";
import { getChats, getMessages, sendMessage } from "../controllers/chatsController.js";

const router = express.Router();

router.get("/messages/:chatId", protect, getMessages);
router.get("/", protect, getChats);
router.post("/send-message", protect, sendMessage);

export default router;