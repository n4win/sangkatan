-- AlterTable
ALTER TABLE `orders` ADD COLUMN `shippingCarrier` VARCHAR(191) NULL,
    ADD COLUMN `trackingNumber` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `order_proof_images` (
    `id` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `caption` VARCHAR(191) NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `order_proof_images_orderId_idx`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `order_proof_images` ADD CONSTRAINT `order_proof_images_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
