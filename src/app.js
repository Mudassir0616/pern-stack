import express from "express";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { admin, router } from "./admin.js";

const app = express();

app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);

app.use(admin.options.rootPath, router);

export default app;