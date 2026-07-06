/*
  Warnings:

  - You are about to drop the column `company_logo` on the `Organization` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Organization" DROP COLUMN "company_logo",
ADD COLUMN     "companyLogo" TEXT;
