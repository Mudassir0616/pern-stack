import bcrypt from "bcryptjs";
import prisma from "../configs/prisma.js";
import { generateRefreshToken, generateToken } from "../utils/jwt.js";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID
);

export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });

        res.status(201).json({
            message: "User created",
            user,
        });
    } catch (error) {
        res.status(500).json({
            error: error.message,
        });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
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
                message: "Incorrect Password!",
            });
        }

        const token = generateToken(user);
        const refreshToken = generateRefreshToken(user);

        res.json({
            token,
            refreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        res.status(500).json({
            error: error.message,
        });
    }
};

export const refreshToken = async (req, res) => {
    try {

        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({
                message: "Refresh token missing",
            });
        }

        // Verify token
        const decoded = jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        // Find user
        const user = await prisma.user.findUnique({
            where: {
                id: decoded.id,
            },
        });

        if (!user || user.refresh_token !== refreshToken) {
            return res.status(403).json({
                message: "Invalid refresh token",
            });
        }

        // Generate new access token
        const newAccessToken = generateToken(user);

        res.json({
            accessToken: newAccessToken,
        });

    } catch (error) {

        return res.status(403).json({
            message: "Token expired or invalid",
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

        const {
            sub,
            email,
            name,
            picture,
        } = payload;

        let user = await prisma.user.findUnique({
            where: { email },
        });

        // Create user if not exists
        if (!user) {
            user = await prisma.user.create({
                data: {
                    email,
                    name,
                    google_id: sub,
                    avatar: picture,
                },
            });
        }

        // Generate YOUR JWT
        const jwtToken = generateToken(user);

        res.json({
            token: jwtToken,
            user,
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Google login failed",
        });
    }
};