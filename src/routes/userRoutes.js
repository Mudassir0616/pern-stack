import express from "express";
import { createPost, createUser, deleteUser, getPosts, getUsers } from "../controllers/userController.js";

const router = express.Router();

router.post("/", createUser);
router.get("/", getUsers);
router.delete("/:id", deleteUser);


router.get('/posts', getPosts)
router.post('/posts', createPost)

export default router;