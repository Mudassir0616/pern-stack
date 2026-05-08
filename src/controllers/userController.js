import prisma from "../configs/prisma.js";
import { queryBuilder } from "../utils/queryBuilder.js";

export const createUser = async (req, res) => {
    try {
        const { name, email } = req.body;

        const user = await prisma.user.create({
            data: { name, email },
        });

        res.status(201).json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create user" });
    }
};

export const getUsers = async (req, res) => {
    try {
        const result = await queryBuilder({
            model: prisma.user,
            query: req.query,

            searchableFields: ["name", "email"],

            filterableFields: ["gender", "id"],

            numberFields: ["id"],

            sortableFields: ["created_at", "age", "name"],

            defaultSort: {
                created_at: "desc",
            },
        });

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch users" });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        // Validate ID
        if (isNaN(id)) {
            return res.status(400).json({
                error: "Invalid user id",
            });
        }

        // Check existence
        const existingUser = await prisma.user.findUnique({
            where: { id },
        });

        if (!existingUser) {
            return res.status(404).json({
                error: "User not found",
            });
        }

        // Delete
        await prisma.user.delete({
            where: { id },
        });

        return res.status(200).json({
            message: "User deleted successfully",
        });
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            error: "Failed to delete user",
        });
    }
};


// const getPosts = async (req, res) => {
//     try {
//         const result = await queryBuilder({
//             model: prisma.post,
//             query: req.query,

//             searchableFields: ["title", "content"],

//             filterableFields: ["author_id", "published", "id"],

//             numberFields: ["author_id", "id"],

//             booleanFields: ["published"],

//             sortableFields: ["created_at", "title"],

//             defaultSort: {
//                 created_at: "desc",
//             },
//         });

//         res.json(result);
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: "Failed to fetch users" });
//     }
// };