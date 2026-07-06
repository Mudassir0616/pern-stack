import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import prisma from "../configs/prisma.js";
import { generateToken } from "../utils/jwt.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const publicUser = {
    id: true,
    name: true,
    username: true,
    email: true,
    avatar: true,
    bio: true,
    createdAt: true,
};

export const register = async (req, res) => {
    try {
        const {
            name,
            username,
            email,
            password,
        } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password required",
            });
        }

        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    username ? { username } : undefined,
                ].filter(Boolean),
            },
        });

        if (existingUser) {
            return res.status(400).json({
                message: "Email or username already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the local account with a hashed password.
        const user = await prisma.user.create({
            data: {
                name,
                username,
                email,
                password: hashedPassword,
            },
            select: publicUser,
        });

        res.status(201).json({
            message: "User created",
            token: generateToken(user),
            user,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to register user",
            error: error.message,
        });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password required",
            });
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user || !user.password) {
            return res.status(400).json({
                message: "Invalid credentials",
            });
        }

        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid credentials",
            });
        }

        const {
            password: _,
            ...safeUser
        } = user;

        res.json({
            token: generateToken(user),
            user: safeUser,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to login",
        });
    }
};

export const googleLogin = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                message: "Token missing",
            });
        }

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        // Create the user on first Google login.
        const user = await prisma.user.upsert({
            where: {
                email: payload.email,
            },
            update: {
                googleId: payload.sub,
                avatar: payload.picture,
                name: payload.name,
            },
            create: {
                email: payload.email,
                name: payload.name,
                googleId: payload.sub,
                avatar: payload.picture,
            },
            select: publicUser,
        });

        res.json({
            token: generateToken(user),
            user,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Google login failed",
        });
    }
};
