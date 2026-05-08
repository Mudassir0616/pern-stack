import express from "express";

import {
    register,
    login,
    googleLogin,
    refreshToken,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);
router.post("/refresh-token", refreshToken);


export default router;