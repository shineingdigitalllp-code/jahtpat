/*
  Warnings:

  - You are about to drop the column `type` on the `banner` table. All the data in the column will be lost.
  - You are about to drop the column `tint` on the `category` table. All the data in the column will be lost.
  - Added the required column `subtitle` to the `Banner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Banner` table without a default value. This is not possible if the table is not empty.
  - Made the column `link` on table `banner` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `subtitle` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `banner` DROP COLUMN `type`,
    ADD COLUMN `categoryId` INTEGER NULL,
    ADD COLUMN `ctaLabel` VARCHAR(20) NOT NULL DEFAULT 'Shop Now',
    ADD COLUMN `subtitle` VARCHAR(120) NOT NULL,
    ADD COLUMN `title` VARCHAR(60) NOT NULL,
    MODIFY `link` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `category` DROP COLUMN `tint`,
    ADD COLUMN `featured` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `parentId` INTEGER NULL;

-- AlterTable
ALTER TABLE `product` ADD COLUMN `subtitle` VARCHAR(80) NOT NULL;

-- CreateIndex
CREATE INDEX `Banner_categoryId_isActive_idx` ON `Banner`(`categoryId`, `isActive`);

-- CreateIndex
CREATE INDEX `Category_parentId_isActive_idx` ON `Category`(`parentId`, `isActive`);

-- AddForeignKey
ALTER TABLE `Category` ADD CONSTRAINT `Category_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Banner` ADD CONSTRAINT `Banner_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
