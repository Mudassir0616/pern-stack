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

            filterableFields: ["gender"],

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