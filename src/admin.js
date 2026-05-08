import AdminJS from "adminjs";
import AdminJSExpress from "@adminjs/express";
import * as AdminJSPrisma from "@adminjs/prisma";

import bcrypt from "bcryptjs";

import { PrismaClient } from "@prisma/client";
import { getModelByName } from "@adminjs/prisma";

const prisma = new PrismaClient();

AdminJS.registerAdapter({
    Resource: AdminJSPrisma.Resource,
    Database: AdminJSPrisma.Database,
});

const admin = new AdminJS({
    rootPath: "/admin",

    resources: [

        // =========================
        // USER
        // =========================
        {
            resource: {
                model: getModelByName("User"),
                client: prisma,
            },

            options: {

                listProperties: [
                    "id",
                    "name",
                    "email",
                    "organization_id",
                    "role_id",
                    "createdAt",
                ],

                editProperties: [
                    "name",
                    "email",
                    "password",
                    "organization_id",
                    "role_id",
                ],

                filterProperties: [
                    "email",
                    "organization_id",
                    "role_id",
                ],

                showProperties: [
                    "id",
                    "name",
                    "email",
                    "organization_id",
                    "role_id",
                    "createdAt",
                ],

                properties: {

                    password: {
                        isVisible: {
                            list: false,
                            filter: false,
                            show: false,
                            edit: true,
                        },
                    },

                    refresh_token: {
                        isVisible: false,
                    },

                    google_id: {
                        isVisible: false,
                    },

                },
            },
        },

        // =========================
        // ORGANIZATION
        // =========================
        {
            resource: {
                model: getModelByName("Organization"),
                client: prisma,
            },
        },

        // =========================
        // ROLE
        // =========================
        {
            resource: {
                model: getModelByName("Role"),
                client: prisma,
            },
        },
    ],
});


// ======================================
// AUTHENTICATION
// ======================================

const router = AdminJSExpress.buildAuthenticatedRouter(
    admin,

    {
        authenticate: async (email, password) => {

            const user = await prisma.user.findUnique({
                where: {
                    email,
                },

                include: {
                    role: true,
                },
            });

            if (!user) {
                return null;
            }

            // Only super_admin can login
            if (user.role?.name !== "super_admin") {
                return null;
            }

            if (!user.password) {
                return null;
            }

            const isMatch = await bcrypt.compare(
                password,
                user.password
            );

            if (!isMatch) {
                return null;
            }

            return {
                email: user.email,
                role: user.role.name,
            };
        },

        cookiePassword: process.env.ADMIN_COOKIE_SECRET,
    },

    null,

    {
        secret: process.env.ADMIN_COOKIE_SECRET,

        resave: false,

        saveUninitialized: false,
    }
);

export { admin, router };