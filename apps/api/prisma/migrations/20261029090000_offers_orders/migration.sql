-- AlterTable
ALTER TABLE `banner` ADD COLUMN `placement` ENUM('home', 'offers') NOT NULL DEFAULT 'home';

-- AlterTable
ALTER TABLE `coupon` ADD COLUMN `category` ENUM('general', 'bank', 'wallet', 'combo') NOT NULL DEFAULT 'general',
    ADD COLUMN `image` VARCHAR(191) NOT NULL,
    ADD COLUMN `sortOrder` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `subtitle` VARCHAR(60) NOT NULL,
    ADD COLUMN `title` VARCHAR(40) NOT NULL,
    MODIFY `type` ENUM('flat', 'percent', 'free_delivery') NOT NULL;

-- AlterTable
ALTER TABLE `order` ADD COLUMN `code` VARCHAR(12) NOT NULL,
    ADD COLUMN `deliveredAt` DATETIME(3) NULL,
    ADD COLUMN `etaAt` DATETIME(3) NULL,
    ADD COLUMN `outForDeliveryAt` DATETIME(3) NULL,
    ADD COLUMN `preparingAt` DATETIME(3) NULL,
    ADD COLUMN `riderName` VARCHAR(60) NULL,
    ADD COLUMN `riderPhone` VARCHAR(10) NULL,
    MODIFY `status` ENUM('pending_payment', 'placed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled') NOT NULL DEFAULT 'placed';

-- AlterTable
ALTER TABLE `user` ADD COLUMN `walletPaise` INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX `Order_code_key` ON `Order`(`code`);

