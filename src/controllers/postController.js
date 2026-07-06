import prisma from "../configs/prisma.js";

const postInclude = (userId) => ({
    author: {
        select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
        },
    },
    likes: {
        where: {
            userId,
        },
        select: {
            id: true,
        },
    },
    _count: {
        select: {
            likes: true,
        },
    },
});

const formatPost = (post) => {
    const {
        likes,
        _count,
        ...rest
    } = post;

    return {
        ...rest,
        likesCount: _count.likes,
        likedByMe: likes.length > 0,
    };
};

export const createPost = async (req, res) => {
    try {
        const { caption } = req.body;

        if (!req.file) {
            return res.status(400).json({
                message: "Post image required",
            });
        }

        const imageUrl =
            `${req.protocol}://${req.get("host")}/assets/${req.file.filename}`;

        // Create an image post owned by the logged-in user.
        const post = await prisma.post.create({
            data: {
                caption,
                imageUrl,
                authorId: req.user.id,
            },
            include: postInclude(req.user.id),
        });

        res.status(201).json({
            message: "Post created",
            post: formatPost(post),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to create post",
        });
    }
};

export const getFeed = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);

        const friends = await prisma.friendship.findMany({
            where: {
                userId: req.user.id,
            },
            select: {
                friendId: true,
            },
        });

        const authorIds = [
            req.user.id,
            ...friends.map((friend) => friend.friendId),
        ];

        const [posts, total] = await Promise.all([
            prisma.post.findMany({
                where: {
                    authorId: {
                        in: authorIds,
                    },
                },
                include: postInclude(req.user.id),
                orderBy: {
                    createdAt: "desc",
                },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.post.count({
                where: {
                    authorId: {
                        in: authorIds,
                    },
                },
            }),
        ]);

        res.json({
            data: posts.map(formatPost),
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
            message: "Failed to fetch feed",
        });
    }
};

export const getUserPosts = async (req, res) => {
    try {
        const userId = Number(req.params.userId || req.user.id);

        const posts = await prisma.post.findMany({
            where: {
                authorId: userId,
            },
            include: postInclude(req.user.id),
            orderBy: {
                createdAt: "desc",
            },
        });

        res.json({
            data: posts.map(formatPost),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to fetch posts",
        });
    }
};

export const likePost = async (req, res) => {
    try {
        const postId = Number(req.params.id);

        const post = await prisma.post.findUnique({
            where: {
                id: postId,
            },
        });

        if (!post) {
            return res.status(404).json({
                message: "Post not found",
            });
        }

        // One user can like a post only once.
        await prisma.like.upsert({
            where: {
                userId_postId: {
                    userId: req.user.id,
                    postId,
                },
            },
            update: {},
            create: {
                userId: req.user.id,
                postId,
            },
        });

        res.json({
            message: "Post liked",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to like post",
        });
    }
};

export const unlikePost = async (req, res) => {
    console.log('req.user.id:', req);
    try {
        const postId = Number(req.params.id);

        await prisma.like.deleteMany({
            where: {
                userId: req.user.id,
                postId,
            },
        });

        res.json({
            message: "Post unliked",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to unlike post",
        });
    }
};

export const deletePost = async (req, res) => {
    try {
        const postId = Number(req.params.id);

        const deleted = await prisma.post.deleteMany({
            where: {
                id: postId,
                authorId: req.user.id,
            },
        });

        if (!deleted.count) {
            return res.status(404).json({
                message: "Post not found",
            });
        }

        res.json({
            message: "Post deleted",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to delete post",
        });
    }
};
