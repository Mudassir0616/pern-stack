import prisma from "../configs/prisma.js";

const publicUser = {
    id: true,
    name: true,
    username: true,
    avatar: true,
    bio: true,
};

export const sendFriendRequest = async (req, res) => {
    try {
        const receiverId = Number(req.params.userId);

        if (!receiverId || receiverId === req.user.id) {
            return res.status(400).json({
                message: "Invalid friend request",
            });
        }

        const receiver = await prisma.user.findUnique({
            where: {
                id: receiverId,
            },
        });

        if (!receiver) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        const existingFriendship = await prisma.friendship.findUnique({
            where: {
                userId_friendId: {
                    userId: req.user.id,
                    friendId: receiverId,
                },
            },
        });

        if (existingFriendship) {
            return res.status(400).json({
                message: "You are already friends",
            });
        }

        const reversePending = await prisma.friendRequest.findFirst({
            where: {
                senderId: receiverId,
                receiverId: req.user.id,
                status: "PENDING",
            },
        });

        if (reversePending) {
            return res.status(400).json({
                message: "This user already sent you a request",
            });
        }

        // Keep one active request per sender and receiver.
        const request = await prisma.friendRequest.upsert({
            where: {
                senderId_receiverId: {
                    senderId: req.user.id,
                    receiverId,
                },
            },
            update: {
                status: "PENDING",
            },
            create: {
                senderId: req.user.id,
                receiverId,
            },
            include: {
                receiver: {
                    select: publicUser,
                },
            },
        });

        res.status(201).json({
            message: "Friend request sent",
            request,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to send friend request",
        });
    }
};

export const respondFriendRequest = async (req, res) => {
    try {
        const requestId = Number(req.params.id);
        const { action } = req.body;

        if (!["accept", "reject"].includes(action)) {
            return res.status(400).json({
                message: "Action must be accept or reject",
            });
        }

        const request = await prisma.friendRequest.findFirst({
            where: {
                id: requestId,
                receiverId: req.user.id,
                status: "PENDING",
            },
        });

        if (!request) {
            return res.status(404).json({
                message: "Friend request not found",
            });
        }

        if (action === "reject") {
            const rejectedRequest = await prisma.friendRequest.update({
                where: {
                    id: request.id,
                },
                data: {
                    status: "REJECTED",
                },
            });

            return res.json({
                message: "Friend request rejected",
                request: rejectedRequest,
            });
        }

        // Accepting creates both friendship directions.
        const acceptedRequest = await prisma.$transaction(async (tx) => {
            const updatedRequest = await tx.friendRequest.update({
                where: {
                    id: request.id,
                },
                data: {
                    status: "ACCEPTED",
                },
            });

            await tx.friendship.createMany({
                data: [
                    {
                        userId: request.senderId,
                        friendId: request.receiverId,
                    },
                    {
                        userId: request.receiverId,
                        friendId: request.senderId,
                    },
                ],
                skipDuplicates: true,
            });

            return updatedRequest;
        });

        res.json({
            message: "Friend request accepted",
            request: acceptedRequest,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to respond to friend request",
        });
    }
};

export const getFriendRequests = async (req, res) => {
    try {
        const [received, sent] = await Promise.all([
            prisma.friendRequest.findMany({
                where: {
                    receiverId: req.user.id,
                    status: "PENDING",
                },
                include: {
                    sender: {
                        select: publicUser,
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
            }),
            prisma.friendRequest.findMany({
                where: {
                    senderId: req.user.id,
                    status: "PENDING",
                },
                include: {
                    receiver: {
                        select: publicUser,
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
            }),
        ]);

        res.json({
            received,
            sent,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to fetch friend requests",
        });
    }
};

export const getFriends = async (req, res) => {
    try {
        const friends = await prisma.friendship.findMany({
            where: {
                userId: req.user.id,
            },
            include: {
                friend: {
                    select: publicUser,
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        res.json({
            data: friends.map((friendship) => friendship.friend),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to fetch friends",
        });
    }
};

export const removeFriend = async (req, res) => {
    try {
        const friendId = Number(req.params.userId);

        await prisma.friendship.deleteMany({
            where: {
                OR: [
                    {
                        userId: req.user.id,
                        friendId,
                    },
                    {
                        userId: friendId,
                        friendId: req.user.id,
                    },
                ],
            },
        });

        res.json({
            message: "Friend removed",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to remove friend",
        });
    }
};
