import prisma from "../configs/prisma.js";

const publicUser = {
    id: true,
    name: true,
    username: true,
    email: true,
    avatar: true,
    bio: true,
    createdAt: true,
    _count: {
        select: {
            posts: true,
            friends: true,
        },
    },
};

export const getMe = async (req, res) => {
    const user = await prisma.user.findUnique({
        where: {
            id: req.user.id,
        },
        select: publicUser,
    });

    res.json({ user });
};

export const getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const search = req.query.search?.trim();

        const where = search
            ? {
                OR: [
                    {
                        name: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                    {
                        username: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                ],
            }
            : {};

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: publicUser,
                orderBy: {
                    createdAt: "desc",
                },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.user.count({ where }),
        ]);

        res.json({
            data: users,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to fetch users",
        });
    }
};

export const getUserById = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!id) {
            return res.status(400).json({
                message: "Invalid user id",
            });
        }

        const user = await prisma.user.findUnique({
            where: { id },
            select: publicUser,
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        res.json({ user });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to fetch user",
        });
    }
};

export const updateMe = async (req, res) => {
    try {
        const {
            name,
            username,
            bio,
        } = req.body;

        const avatar = req.file
            ? `${req.protocol}://${req.get("host")}/assets/${req.file.filename}`
            : undefined;

        // Only profile fields can be changed here.
        const user = await prisma.user.update({
            where: {
                id: req.user.id,
            },
            data: {
                name,
                username,
                bio,
                avatar,
            },
            select: publicUser,
        });

        res.json({
            message: "Profile updated",
            user,
        });
    } catch (error) {
        if (error.code === "P2002") {
            return res.status(400).json({
                message: "Username already exists",
            });
        }

        console.error(error);
        res.status(500).json({
            message: "Failed to update profile",
        });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!id) {
            return res.status(400).json({
                message: "Invalid user id",
            });
        }

        await prisma.user.delete({
            where: { id },
        });

        res.json({
            message: "User deleted",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to delete user",
        });
    }
}
