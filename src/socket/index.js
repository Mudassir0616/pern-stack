// src/socket/index.js
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import prisma from "../configs/prisma.js";

let io; // module-level ref so other files can reuse the SAME instance

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            // Socket.IO has its OWN cors config, separate from Express's cors().
            // This must be your Next.js origin.
            origin: process.env.CLIENT_URL || "http://localhost:3000",
            credentials: true,
        },
    });

    // ---- AUTH MIDDLEWARE ----
    // Runs ONCE per connection, before "connection" fires. It's the socket
    // equivalent of your REST `protect` middleware. Calling next(error)
    // rejects the connection.
    io.use(async (socket, next) => {
        try {
            // The client puts its JWT in the handshake auth payload (see frontend).
            const token = socket.handshake.auth?.token;
            if (!token) return next(new Error("No token provided"));

            // ⚠️ Match this to whatever your REST `protect` middleware does —
            // same secret, same payload shape. If your protect uses decoded.userId
            // instead of decoded.id, change it below.
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const user = await prisma.user.findUnique({
                where: { id: decoded.id },
                select: { id: true, username: true, avatar: true },
            });
            if (!user) return next(new Error("User not found"));

            // Attach the user to the socket — this is your `req.user` equivalent,
            // available in every event handler for this connection.
            socket.user = user;
            next();
        } catch (err) {
            next(new Error("Authentication failed"));
        }
    });

    // ---- CONNECTION HANDLER ----
    io.on("connection", (socket) => {
        const userId = socket.user.id;
        console.log(`User ${userId} connected: ${socket}`);

        // Every user joins a private room named after their own id. Emitting to
        // `user:<id>` reaches every device/tab that user has open at once.
        socket.join(`user:${userId}`);

        // When the client opens a conversation, it joins that chat's room.
        // Handy for scoping typing indicators / read receipts to one chat.
        socket.on("join-chat", (chatId) => socket.join(`chat:${chatId}`));
        socket.on("leave-chat", (chatId) => socket.leave(`chat:${chatId}`));

        // Typing indicator: relay to OTHERS in the chat room (socket.to excludes
        // the sender). Nothing is persisted — it's ephemeral.
        socket.on("typing", ({ chatId }) => {
            socket.to(`chat:${chatId}`).emit("typing", {
                chatId,
                user: socket.user,
            });
        });
        socket.on("stop-typing", ({ chatId }) => {
            socket.to(`chat:${chatId}`).emit("stop-typing", { chatId, userId });
        });

        socket.on("disconnect", () => {
            console.log(`User ${userId} disconnected: ${socket.id}`);
        });
    });

    return io;
};

// Optional: use this in places with no `req` object (e.g. cron jobs, workers).
export const getIO = () => {
    if (!io) throw new Error("Socket.IO not initialized");
    return io;
};