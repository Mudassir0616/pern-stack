import prisma from "../configs/prisma.js";
import { queryBuilder } from "../utils/queryBuilder.js";


export const getMessages = async (req, res) => {
    try {
        const chatId = Number(req.params.chatId);

        if (!chatId) {
            return res.status(400).json({
                message: "Invalid chat id",
            });
        }

        const chat = await prisma.chats.findFirst({
            where: {
                id: chatId,
                OR: [
                    {
                        senderId: req.user.id,
                    },
                    {
                        receiverId: req.user.id,
                    },
                ],
            },
            select: {
                id: true,
            },
        });

        if (!chat) {
            return res.status(404).json({
                message: "Chat not found",
            });
        }

        const result = await queryBuilder({
            model: prisma.message,
            query: req.query,

            where: {
                chatId,
            },

            include: {
                sender: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                    },
                },
            },

            sortableFields: ["createdAt"],
            defaultSort: {
                createdAt: "asc",
            },
        });

        res.json(result);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to fetch messages",
        });

    }
};

export const getChats = async (req, res) => {

    try {

        const result = await queryBuilder({

            model: prisma.chats,
            query: req.query,
            where: {
                OR: [
                    {
                        senderId: req.user.id,
                    },
                    {
                        receiverId: req.user.id,
                    },
                ],
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                    },
                },
                receiver: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                    },
                },
                messages: {
                    take: 1,
                    orderBy: {
                        createdAt: "desc",
                    },
                },
            },

            sortableFields: ["updatedAt"],
            defaultSort: {
                updatedAt: "desc",
            },
        });

        res.json(result);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to fetch chats",
        });

    }
};

export const sendMessage = async (req, res) => {
    try {
        const { receiverId, content } = req.body;
        const receiver = Number(receiverId);

        if (!receiver || !content?.trim()) {
            return res.status(400).json({
                message: "Receiver and message are required",
            });
        }

        if (receiver === req.user.id) {
            return res.status(400).json({
                message: "You cannot message yourself",
            });
        }

        const receiverExists = await prisma.user.findUnique({
            where: {
                id: receiver,
            },
            select: {
                id: true,
            },
        });

        if (!receiverExists) {
            return res.status(404).json({
                message: "Receiver not found",
            });
        }

        let chat = await prisma.chats.findFirst({
            where: {
                OR: [
                    {
                        senderId: req.user.id,
                        receiverId: receiver,
                    },
                    {
                        senderId: receiver,
                        receiverId: req.user.id,
                    },
                ],
            },
        });

        if (!chat) {
            chat = await prisma.chats.create({
                data: {
                    senderId: req.user.id,
                    receiverId: receiver,
                },
            });
        }

        const [message] = await prisma.$transaction([
            prisma.message.create({
                data: {
                    chatId: chat.id,
                    senderId: req.user.id,
                    message: content.trim(),
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            username: true,
                            avatar: true,
                        },
                    },
                },
            }),
            prisma.chats.update({
                where: {
                    id: chat.id,
                },
                data: {
                    updatedAt: new Date(),
                },
            }),
        ]);

        res.status(201).json({
            message,
            chatId: chat.id,
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to send message",
        });
    }
};
