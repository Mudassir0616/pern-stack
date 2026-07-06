import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {

    // =========================
    // CREATE ROLES
    // =========================

    const roles = [
        {
            name: "super_admin",
        },
        {
            name: "org_admin",
        },
        {
            name: "inventory_manager",
        },
        {
            name: "technician",
        },
        {
            name: "sales_executive",
        },
    ];

    for (const role of roles) {

        await prisma.role.upsert({
            where: {
                name: role.name,
            },

            update: {},

            create: role,
        });
    }

    console.log("Roles Seeded");


    // =========================
    // GET SUPER ADMIN ROLE
    // =========================

    const superAdminRole = await prisma.role.findUnique({
        where: {
            name: "super_admin",
        },
    });


    // =========================
    // HASH PASSWORD
    // =========================

    const hashedPassword = await bcrypt.hash(
        "admin123",
        10
    );


    // =========================
    // CREATE SUPER ADMIN
    // =========================

    await prisma.user.upsert({

        where: {
            email: "admin@example.com",
        },

        update: {},

        create: {
            name: "Super Admin",
            email: "admin@example.com",
            password: hashedPassword,
            roleId: superAdminRole.id,
        },
    });

    console.log("Super Admin Created");
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {

        console.error(e);

        await prisma.$disconnect();

        process.exit(1);
    });