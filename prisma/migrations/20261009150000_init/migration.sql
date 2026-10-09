-- CreateTable
CREATE TABLE `customers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `address_detail` TEXT NOT NULL,
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customer_id` INTEGER NOT NULL,
    `box_amount` INTEGER NOT NULL,
    `total_price` DOUBLE NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_orders_customer_id`(`customer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `delivery_tasks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `task_number` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `departure_time` VARCHAR(191) NOT NULL DEFAULT '11:30',
    `total_distance` DOUBLE NOT NULL DEFAULT 0.0,
    `estimated_minutes` INTEGER NOT NULL DEFAULT 0,
    `total_boxes` INTEGER NOT NULL DEFAULT 0,
    `delivery_fee` DOUBLE NOT NULL DEFAULT 0.0,
    `total_revenue` DOUBLE NOT NULL DEFAULT 0.0,
    `total_food_cost` DOUBLE NOT NULL DEFAULT 0.0,
    `net_profit` DOUBLE NOT NULL DEFAULT 0.0,
    `route_color` VARCHAR(191) NOT NULL DEFAULT '#EF4444',
    `status` VARCHAR(191) NOT NULL DEFAULT 'PROPOSED',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `rider_id` INTEGER NULL,

    UNIQUE INDEX `delivery_tasks_task_number_key`(`task_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `task_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `task_id` INTEGER NOT NULL,
    `order_id` INTEGER NOT NULL,
    `stop_sequence` INTEGER NOT NULL,
    `est_arrival` VARCHAR(191) NULL,
    `actual_arrival` DATETIME(3) NULL,
    `delivery_status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',

    UNIQUE INDEX `task_items_order_id_key`(`order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_items` ADD CONSTRAINT `task_items_task_id_fkey` FOREIGN KEY (`task_id`) REFERENCES `delivery_tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_items` ADD CONSTRAINT `task_items_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
