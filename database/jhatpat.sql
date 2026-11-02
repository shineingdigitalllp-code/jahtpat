-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 31, 2026 at 01:59 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `jhatpat`
--

-- --------------------------------------------------------

--
-- Table structure for table `activitylog`
--

CREATE TABLE `activitylog` (
  `id` int(11) NOT NULL,
  `adminId` varchar(191) NOT NULL,
  `action` varchar(60) NOT NULL,
  `entity` varchar(30) NOT NULL,
  `entityId` varchar(64) NOT NULL,
  `meta` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`meta`)),
  `ip` varchar(45) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `activitylog`
--

INSERT INTO `activitylog` (`id`, `adminId`, `action`, `entity`, `entityId`, `meta`, `ip`, `createdAt`) VALUES
(1, 'cmvw4krqo00002slovu0kiw4y', 'register_owner', 'admin_user', 'cmvw4krqo00002slovu0kiw4y', '{\"email\":\"admin@jhatpat.com\"}', '::1', '2026-10-31 08:14:27.710'),
(2, 'cmvw4krqo00002slovu0kiw4y', 'status_change', 'order', 'JP785421', '{\"from\":\"out_for_delivery\",\"to\":\"delivered\"}', '::1', '2026-10-31 08:54:07.147'),
(3, 'cmvw4krqo00002slovu0kiw4y', 'update_product', 'product', '116', '{\"name\":\"Chicken Curry Cut\"}', '::1', '2026-10-31 09:00:11.867'),
(4, 'cmvw4krqo00002slovu0kiw4y', 'upload_image', 'product', '/uploads/products/4db49634-e6c4-490d-9ef9-f17c1190cf76.webp', '{\"thumbUrl\":\"/uploads/products/4db49634-e6c4-490d-9ef9-f17c1190cf76-thumb.webp\"}', '::1', '2026-10-31 11:55:13.814'),
(5, 'cmvw4krqo00002slovu0kiw4y', 'upload_image', 'product', '/uploads/products/c49bfbc2-fd52-4c8d-9f1e-a45742fbf412.webp', '{\"thumbUrl\":\"/uploads/products/c49bfbc2-fd52-4c8d-9f1e-a45742fbf412-thumb.webp\"}', '::1', '2026-10-31 11:55:16.888'),
(6, 'cmvw4krqo00002slovu0kiw4y', 'upload_image', 'product', '/uploads/products/c5c74f8a-b46f-42b7-ab7b-57477330f1ec.webp', '{\"thumbUrl\":\"/uploads/products/c5c74f8a-b46f-42b7-ab7b-57477330f1ec-thumb.webp\"}', '::1', '2026-10-31 11:55:19.492'),
(7, 'cmvw4krqo00002slovu0kiw4y', 'update_product', 'product', '116', '{\"name\":\"Chicken Curry Cut\"}', '::1', '2026-10-31 11:55:20.750'),
(8, 'cmvw4krqo00002slovu0kiw4y', 'update_product', 'product', '116', '{\"name\":\"Chicken Curry Cut\"}', '::1', '2026-10-31 12:13:03.132'),
(9, 'cmvw4krqo00002slovu0kiw4y', 'logout', 'admin_user', 'cmvw4krqo00002slovu0kiw4y', NULL, '::1', '2026-10-31 12:32:46.281'),
(10, 'cmvw4krqo00002slovu0kiw4y', 'login', 'admin_user', 'cmvw4krqo00002slovu0kiw4y', NULL, '::1', '2026-10-31 12:33:04.922');

-- --------------------------------------------------------

--
-- Table structure for table `address`
--

CREATE TABLE `address` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `label` varchar(30) NOT NULL,
  `line1` varchar(191) NOT NULL,
  `line2` varchar(191) DEFAULT NULL,
  `city` varchar(60) NOT NULL,
  `state` varchar(60) NOT NULL,
  `pincode` varchar(6) NOT NULL,
  `lat` double DEFAULT NULL,
  `lng` double DEFAULT NULL,
  `isDefault` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `address`
--

INSERT INTO `address` (`id`, `userId`, `label`, `line1`, `line2`, `city`, `state`, `pincode`, `lat`, `lng`, `isDefault`) VALUES
('cmvthegzh0000owlorriatgnq', 'cmvt9sbmc00005wlobmztt36k', 'Work', 'Paliwal Complex', 'Gumanpura Road near multipurpose school', 'Kota', 'Rajasthan', '324001', NULL, NULL, 1),
('cmvw3ms560000vslo5ohimty0', 'cmvt7p69k000064lo0vrxpcr2', 'Home', '12, Talwandi', NULL, 'Kota', 'Rajasthan', '324005', NULL, NULL, 1),
('cmvw3ms590001vslohn4kjdiy', 'cmvt7p69k000064lo0vrxpcr2', 'Work', 'Indraprastha Industrial Area', NULL, 'Kota', 'Rajasthan', '324005', NULL, NULL, 0);

-- --------------------------------------------------------

--
-- Table structure for table `adminuser`
--

CREATE TABLE `adminuser` (
  `id` varchar(191) NOT NULL,
  `name` varchar(60) NOT NULL,
  `email` varchar(191) NOT NULL,
  `passwordHash` varchar(191) NOT NULL,
  `role` enum('owner','manager','staff') NOT NULL DEFAULT 'staff',
  `status` enum('pending','active','suspended') NOT NULL DEFAULT 'pending',
  `mustChangePassword` tinyint(1) NOT NULL DEFAULT 0,
  `lastLoginAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `adminuser`
--

INSERT INTO `adminuser` (`id`, `name`, `email`, `passwordHash`, `role`, `status`, `mustChangePassword`, `lastLoginAt`, `createdAt`) VALUES
('cmvw4krqo00002slovu0kiw4y', 'Abhishek Tyagi', 'admin@jhatpat.com', '$2b$12$iiDB5BwtWTEAyt.M4R0ZPuqU3lEkuGvySEND34hwYMp7L49f8KG0O', 'owner', 'active', 0, '2026-10-31 12:33:04.908', '2026-10-31 08:14:27.696');

-- --------------------------------------------------------

--
-- Table structure for table `banner`
--

CREATE TABLE `banner` (
  `id` int(11) NOT NULL,
  `image` varchar(191) NOT NULL,
  `link` varchar(191) NOT NULL,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `categoryId` int(11) DEFAULT NULL,
  `ctaLabel` varchar(20) NOT NULL DEFAULT 'Shop Now',
  `subtitle` varchar(120) NOT NULL,
  `title` varchar(60) NOT NULL,
  `placement` enum('home','offers') NOT NULL DEFAULT 'home'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `banner`
--

INSERT INTO `banner` (`id`, `image`, `link`, `sortOrder`, `isActive`, `categoryId`, `ctaLabel`, `subtitle`, `title`, `placement`) VALUES
(16, '/images/catalog/fruit-basket.jpg', '/categories/fruits-vegetables', 0, 1, 79, 'Shop Now', '100% organic & handpicked fruits for your healthy life.', 'Eat Fresh, Stay Healthy.', 'home'),
(17, '/images/catalog/gift.jpg', '/categories/snacks-beverages', 0, 1, NULL, 'Shop Now', 'Celebrate with premium quality and best offers', 'Festive Delights Delivered to You', 'home'),
(18, '/images/catalog/groceries.jpg', '/categories/fruits-vegetables', 1, 1, NULL, 'Shop Now', 'Handpicked fruits & vegetables every morning', 'Fresh From the Farm', 'home'),
(19, '/images/catalog/rice.jpg', '/categories/staples', 2, 1, NULL, 'Shop Now', 'Rice, atta, oil & more at everyday low prices', 'Daily Staples, Best Prices', 'home'),
(20, '/images/catalog/groceries.jpg', '/categories/fruits-vegetables', 0, 1, NULL, 'Shop Now', 'Use code JHATPAT', 'Fresh Groceries Big Savings', 'offers'),
(21, '/images/catalog/fruit-basket.jpg', '/categories/snacks-beverages', 1, 1, NULL, 'Shop Now', 'Up to 30% OFF', 'Combo Deals', 'offers'),
(22, '/images/catalog/detergent.jpg', '/categories/household', 2, 1, NULL, 'Shop Now', 'Up to 50% OFF', 'Brand Offers', 'offers');

-- --------------------------------------------------------

--
-- Table structure for table `cart`
--

CREATE TABLE `cart` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `couponId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cartitem`
--

CREATE TABLE `cartitem` (
  `cartId` varchar(191) NOT NULL,
  `productId` int(11) NOT NULL,
  `qty` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `category`
--

CREATE TABLE `category` (
  `id` int(11) NOT NULL,
  `name` varchar(60) NOT NULL,
  `slug` varchar(80) NOT NULL,
  `image` varchar(191) NOT NULL,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `featured` tinyint(1) NOT NULL DEFAULT 0,
  `parentId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `category`
--

INSERT INTO `category` (`id`, `name`, `slug`, `image`, `sortOrder`, `isActive`, `featured`, `parentId`) VALUES
(79, 'Fruits & Vegetables', 'fruits-vegetables', '/images/catalog/apples.jpg', 0, 1, 0, NULL),
(80, 'Mango', 'mango', '/images/catalog/mango.jpg', 0, 1, 0, 79),
(81, 'Citrus', 'citrus', '/images/catalog/oranges.jpg', 1, 1, 0, 79),
(82, 'Berries', 'berries', '/images/catalog/blueberries.jpg', 2, 1, 0, 79),
(83, 'Apples', 'apples', '/images/catalog/apples.jpg', 3, 1, 0, 79),
(84, 'Exotics', 'exotics', '/images/catalog/dragon-fruit.jpg', 4, 1, 0, 79),
(85, 'Tropical', 'tropical', '/images/catalog/pineapple.jpg', 5, 1, 0, 79),
(86, 'Vegetables', 'vegetables', '/images/catalog/broccoli.jpg', 6, 1, 0, 79),
(87, 'Herbs', 'herbs', '/images/catalog/herbs.jpg', 7, 1, 0, 79),
(88, 'Dairy & Bakery', 'dairy-bakery', '/images/catalog/milk.jpg', 1, 1, 0, NULL),
(89, 'Milk', 'milk', '/images/catalog/milk.jpg', 0, 1, 0, 88),
(90, 'Bread & Buns', 'bread-buns', '/images/catalog/bread.jpg', 1, 1, 0, 88),
(91, 'Snacks & Beverages', 'snacks-beverages', '/images/catalog/chips.jpg', 2, 1, 0, NULL),
(92, 'Chips & Namkeen', 'chips-namkeen', '/images/catalog/chips.jpg', 0, 1, 0, 91),
(93, 'Juices & Drinks', 'juices-drinks', '/images/catalog/juice.jpg', 1, 1, 1, 91),
(94, 'Instant Food', 'instant-food', '/images/catalog/noodles.jpg', 2, 1, 1, 91),
(95, 'Staples', 'staples', '/images/catalog/rice.jpg', 3, 1, 0, NULL),
(96, 'Oil, Ghee & Masala', 'oil-ghee-masala', '/images/catalog/oil.jpg', 0, 1, 1, 95),
(97, 'Rice & Atta', 'rice-atta', '/images/catalog/rice.jpg', 1, 1, 1, 95),
(98, 'Personal Care', 'personal-care', '/images/catalog/soap.jpg', 4, 1, 0, NULL),
(99, 'Bath & Body', 'bath-body', '/images/catalog/soap.jpg', 0, 1, 0, 98),
(100, 'Household', 'household', '/images/catalog/detergent.jpg', 5, 1, 0, NULL),
(101, 'Cleaning', 'cleaning', '/images/catalog/detergent.jpg', 0, 1, 1, 100),
(102, 'Meat & Eggs', 'meat-eggs', '/images/catalog/eggs.jpg', 6, 1, 0, NULL),
(103, 'Eggs', 'eggs', '/images/catalog/eggs.jpg', 0, 1, 0, 102),
(104, 'Chicken', 'chicken', '/images/catalog/chicken.jpg', 1, 1, 0, 102);

-- --------------------------------------------------------

--
-- Table structure for table `coupon`
--

CREATE TABLE `coupon` (
  `id` int(11) NOT NULL,
  `code` varchar(30) NOT NULL,
  `type` enum('flat','percent','free_delivery') NOT NULL,
  `value` int(11) NOT NULL,
  `minOrderPaise` int(11) NOT NULL DEFAULT 0,
  `maxDiscountPaise` int(11) DEFAULT NULL,
  `validFrom` datetime(3) NOT NULL,
  `validTo` datetime(3) NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `category` enum('general','bank','wallet','combo') NOT NULL DEFAULT 'general',
  `image` varchar(191) NOT NULL,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `subtitle` varchar(60) NOT NULL,
  `title` varchar(40) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `coupon`
--

INSERT INTO `coupon` (`id`, `code`, `type`, `value`, `minOrderPaise`, `maxDiscountPaise`, `validFrom`, `validTo`, `isActive`, `category`, `image`, `sortOrder`, `subtitle`, `title`) VALUES
(7, 'JHATPAT20', 'percent', 20, 0, 15000, '2026-10-30 07:48:01.664', '2027-10-31 07:48:01.664', 1, 'general', '/images/catalog/fruit-basket.jpg', 0, 'on your first order', 'Flat 20% OFF'),
(8, 'JHATPATFD', 'free_delivery', 0, 29900, NULL, '2026-10-30 07:48:01.664', '2027-10-31 07:48:01.664', 1, 'general', '/images/catalog/groceries.jpg', 1, 'on orders above ₹299', 'Free Delivery'),
(9, 'SAVE100', 'flat', 10000, 49900, NULL, '2026-10-30 07:48:01.664', '2027-10-31 07:48:01.664', 1, 'general', '/images/catalog/rice.jpg', 2, 'on orders above ₹499', '₹100 OFF'),
(10, 'HDFC10', 'percent', 10, 39900, 10000, '2026-10-30 07:48:01.664', '2027-10-31 07:48:01.664', 1, 'bank', '/images/catalog/oil.jpg', 3, 'with HDFC Bank cards', '10% Instant Discount'),
(11, 'WALLET50', 'flat', 5000, 29900, NULL, '2026-10-30 07:48:01.664', '2027-10-31 07:48:01.664', 1, 'wallet', '/images/catalog/juice.jpg', 4, 'when you pay with wallet', '₹50 Cashback'),
(12, 'COMBO15', 'percent', 15, 19900, 7500, '2026-10-30 07:48:01.664', '2027-10-31 07:48:01.664', 1, 'combo', '/images/catalog/broccoli.jpg', 5, 'on fruit & veg combos', '15% OFF Combos');

-- --------------------------------------------------------

--
-- Table structure for table `order`
--

CREATE TABLE `order` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `addressId` varchar(191) NOT NULL,
  `status` enum('pending_payment','placed','preparing','out_for_delivery','delivered','cancelled') NOT NULL DEFAULT 'placed',
  `paymentMethod` enum('upi','card','netbanking','wallet','cod') NOT NULL,
  `paymentStatus` enum('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
  `subtotalPaise` int(11) NOT NULL,
  `discountPaise` int(11) NOT NULL,
  `couponPaise` int(11) NOT NULL DEFAULT 0,
  `deliveryPaise` int(11) NOT NULL,
  `totalPaise` int(11) NOT NULL,
  `razorpayOrderId` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `code` varchar(12) NOT NULL,
  `deliveredAt` datetime(3) DEFAULT NULL,
  `etaAt` datetime(3) DEFAULT NULL,
  `outForDeliveryAt` datetime(3) DEFAULT NULL,
  `preparingAt` datetime(3) DEFAULT NULL,
  `riderName` varchar(60) DEFAULT NULL,
  `riderPhone` varchar(10) DEFAULT NULL,
  `couponCode` varchar(30) DEFAULT NULL,
  `adminNote` varchar(255) DEFAULT NULL,
  `cancelReason` varchar(120) DEFAULT NULL,
  `cancelledAt` datetime(3) DEFAULT NULL,
  `razorpayPaymentId` varchar(191) DEFAULT NULL,
  `refundedPaise` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `order`
--

INSERT INTO `order` (`id`, `userId`, `addressId`, `status`, `paymentMethod`, `paymentStatus`, `subtotalPaise`, `discountPaise`, `couponPaise`, `deliveryPaise`, `totalPaise`, `razorpayOrderId`, `createdAt`, `code`, `deliveredAt`, `etaAt`, `outForDeliveryAt`, `preparingAt`, `riderName`, `riderPhone`, `couponCode`, `adminNote`, `cancelReason`, `cancelledAt`, `razorpayPaymentId`, `refundedPaise`) VALUES
('cmvw3ms5g0002vslo8rbryara', 'cmvt7p69k000064lo0vrxpcr2', 'cmvw3ms560000vslo5ohimty0', 'delivered', 'upi', 'paid', 37200, 5000, 0, 0, 32200, NULL, '2026-10-31 07:23:01.922', 'JP785421', '2026-10-31 08:54:07.122', '2026-10-31 07:56:01.922', '2026-10-31 07:48:01.922', '2026-10-31 07:28:01.922', 'Rohit Kumar', '9123456780', NULL, NULL, NULL, NULL, NULL, 0),
('cmvw3ms5l0003vsloogey8098', 'cmvt7p69k000064lo0vrxpcr2', 'cmvw3ms560000vslo5ohimty0', 'delivered', 'upi', 'paid', 89600, 12300, 0, 0, 77300, NULL, '2026-10-14 07:48:01.927', 'JP762309', '2026-10-14 08:26:01.927', NULL, '2026-10-14 08:13:01.927', '2026-10-14 07:53:01.927', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0),
('cmvw3ms5q0004vslovh554cu9', 'cmvt7p69k000064lo0vrxpcr2', 'cmvw3ms560000vslo5ohimty0', 'delivered', 'upi', 'paid', 52000, 9200, 0, 0, 42800, NULL, '2026-10-10 07:48:01.933', 'JP748201', '2026-10-10 08:26:01.933', NULL, '2026-10-10 08:13:01.933', '2026-10-10 07:53:01.933', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0);

-- --------------------------------------------------------

--
-- Table structure for table `orderitem`
--

CREATE TABLE `orderitem` (
  `orderId` varchar(191) NOT NULL,
  `productId` int(11) NOT NULL,
  `name` varchar(120) NOT NULL,
  `unit` varchar(30) NOT NULL,
  `qty` int(11) NOT NULL,
  `pricePaise` int(11) NOT NULL,
  `mrpPaise` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `orderitem`
--

INSERT INTO `orderitem` (`orderId`, `productId`, `name`, `unit`, `qty`, `pricePaise`, `mrpPaise`) VALUES
('cmvw3ms5g0002vslo8rbryara', 97, 'Robusta Banana', '6 pcs', 2, 4500, 5500),
('cmvw3ms5g0002vslo8rbryara', 101, 'Desi Tomato', '1 kg', 2, 3500, 4500),
('cmvw3ms5g0002vslo8rbryara', 102, 'Spinach (Palak)', '250 g', 2, 2500, 3000),
('cmvw3ms5g0002vslo8rbryara', 104, 'Toned Milk', '1 L', 2, 5600, 5600),
('cmvw3ms5l0003vsloogey8098', 102, 'Spinach (Palak)', '250 g', 2, 2500, 3000),
('cmvw3ms5l0003vsloogey8098', 110, 'Masala Noodles', '4 x 70 g', 1, 5600, 6000),
('cmvw3ms5l0003vsloogey8098', 111, 'Cold Pressed Groundnut Oil', '1 L', 2, 28900, 34000),
('cmvw3ms5l0003vsloogey8098', 115, 'Farm Fresh Eggs', '12 pcs', 1, 8900, 9600),
('cmvw3ms5q0004vslovh554cu9', 90, 'Nagpur Orange', '1 kg', 1, 9900, 12000),
('cmvw3ms5q0004vslovh554cu9', 93, 'Shimla Apple', '1 kg', 1, 17900, 22000),
('cmvw3ms5q0004vslovh554cu9', 103, 'Mint Leaves', '100 g', 2, 1500, 2000),
('cmvw3ms5q0004vslovh554cu9', 105, 'Sourdough Bread', '400 g', 1, 12000, 14000);

-- --------------------------------------------------------

--
-- Table structure for table `product`
--

CREATE TABLE `product` (
  `id` int(11) NOT NULL,
  `categoryId` int(11) NOT NULL,
  `name` varchar(120) NOT NULL,
  `slug` varchar(140) NOT NULL,
  `unit` varchar(30) NOT NULL,
  `description` text NOT NULL,
  `tag` varchar(30) DEFAULT NULL,
  `ratingAvg` double NOT NULL DEFAULT 0,
  `ratingCount` int(11) NOT NULL DEFAULT 0,
  `mrpPaise` int(11) NOT NULL,
  `pricePaise` int(11) NOT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `subtitle` varchar(80) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `product`
--

INSERT INTO `product` (`id`, `categoryId`, `name`, `slug`, `unit`, `description`, `tag`, `ratingAvg`, `ratingCount`, `mrpPaise`, `pricePaise`, `stock`, `isActive`, `subtitle`, `createdAt`, `updatedAt`) VALUES
(88, 80, 'Alphonso Mango', 'alphonso-mango', '1 kg', 'Alphonso Mango — sweet, juicy & premium quality. Delivered fresh from our Kota store.', 'Organic', 4.8, 210, 18900, 14900, 100, 1, 'Sweet, juicy & premium quality', '2026-10-31 07:48:01.450', '2026-10-31 07:48:01.450'),
(89, 81, 'Lime (Kagzi)', 'lime-kagzi', '250 g', 'Lime (Kagzi) — tangy, fresh & full of vitamin c. Delivered fresh from our Kota store.', 'Organic', 4.7, 120, 3900, 2900, 100, 1, 'Tangy, fresh & full of vitamin C', '2026-10-31 07:48:01.460', '2026-10-31 07:48:01.460'),
(90, 81, 'Nagpur Orange', 'nagpur-orange', '1 kg', 'Nagpur Orange — sweet and easy to peel. Delivered fresh from our Kota store.', 'Fresh', 4.5, 86, 12000, 9900, 100, 1, 'Sweet and easy to peel', '2026-10-31 07:48:01.468', '2026-10-31 07:48:01.468'),
(91, 82, 'Blueberries', 'blueberries', '125 g', 'Blueberries — packed with antioxidants. Delivered fresh from our Kota store.', 'Fresh', 4.9, 150, 29900, 24900, 100, 1, 'Packed with antioxidants', '2026-10-31 07:48:01.476', '2026-10-31 07:48:01.476'),
(92, 82, 'Strawberries', 'strawberries', '200 g', 'Strawberries — mahabaleshwar, ripe & red. Delivered fresh from our Kota store.', 'Fresh', 4.6, 98, 11000, 8900, 100, 1, 'Mahabaleshwar, ripe & red', '2026-10-31 07:48:01.484', '2026-10-31 07:48:01.484'),
(93, 83, 'Shimla Apple', 'shimla-apple', '1 kg', 'Shimla Apple — crisp, sweet & crunchy. Delivered fresh from our Kota store.', 'Organic', 4.6, 312, 22000, 17900, 100, 1, 'Crisp, sweet & crunchy', '2026-10-31 07:48:01.492', '2026-10-31 07:48:01.492'),
(94, 84, 'Dragon Fruit', 'dragon-fruit', '1 pc', 'Dragon Fruit — rich in fibre & antioxidants. Delivered fresh from our Kota store.', 'Fresh', 4.6, 98, 12000, 9900, 100, 1, 'Rich in fibre & antioxidants', '2026-10-31 07:48:01.500', '2026-10-31 07:48:01.500'),
(95, 84, 'Kiwi', 'kiwi', '3 pcs', 'Kiwi — tangy and loaded with vitamin c. Delivered fresh from our Kota store.', 'Fresh', 4.4, 64, 9900, 7900, 100, 1, 'Tangy and loaded with vitamin C', '2026-10-31 07:48:01.505', '2026-10-31 07:48:01.505'),
(96, 85, 'Pineapple', 'pineapple', '1 pc', 'Pineapple — juicy, sweet & tangy. Delivered fresh from our Kota store.', NULL, 4.3, 57, 8500, 6900, 100, 1, 'Juicy, sweet & tangy', '2026-10-31 07:48:01.514', '2026-10-31 07:48:01.514'),
(97, 85, 'Robusta Banana', 'robusta-banana', '6 pcs', 'Robusta Banana — naturally ripened. Delivered fresh from our Kota store.', 'Organic', 4.5, 401, 5500, 4500, 100, 1, 'Naturally ripened', '2026-10-31 07:48:01.518', '2026-10-31 07:48:01.518'),
(98, 85, 'Pomegranate', 'pomegranate', '500 g', 'Pomegranate — bhagwa, deep red arils. Delivered fresh from our Kota store.', NULL, 4.6, 140, 15000, 11900, 100, 1, 'Bhagwa, deep red arils', '2026-10-31 07:48:01.523', '2026-10-31 07:48:01.523'),
(99, 85, 'Green Grapes', 'green-grapes', '500 g', 'Green Grapes — seedless and sweet. Delivered fresh from our Kota store.', 'Fresh', 4.4, 77, 8900, 6900, 100, 1, 'Seedless and sweet', '2026-10-31 07:48:01.527', '2026-10-31 07:48:01.527'),
(100, 86, 'Broccoli', 'broccoli', '250 g', 'Broccoli — farm fresh green florets. Delivered fresh from our Kota store.', 'Organic', 4.5, 88, 7500, 5900, 100, 1, 'Farm fresh green florets', '2026-10-31 07:48:01.535', '2026-10-31 07:48:01.535'),
(101, 86, 'Desi Tomato', 'desi-tomato', '1 kg', 'Desi Tomato — ripe and tangy. Delivered fresh from our Kota store.', 'Fresh', 4.3, 520, 4500, 3500, 100, 1, 'Ripe and tangy', '2026-10-31 07:48:01.539', '2026-10-31 07:48:01.539'),
(102, 86, 'Spinach (Palak)', 'spinach-palak', '250 g', 'Spinach (Palak) — tender leaves, cleaned. Delivered fresh from our Kota store.', 'Organic', 4.4, 210, 3000, 2500, 100, 1, 'Tender leaves, cleaned', '2026-10-31 07:48:01.542', '2026-10-31 07:48:01.542'),
(103, 87, 'Mint Leaves', 'mint-leaves', '100 g', 'Mint Leaves — fresh and aromatic. Delivered fresh from our Kota store.', 'Fresh', 4.5, 132, 2000, 1500, 100, 1, 'Fresh and aromatic', '2026-10-31 07:48:01.550', '2026-10-31 07:48:01.550'),
(104, 89, 'Toned Milk', 'toned-milk', '1 L', 'Toned Milk — pasteurised, fresh daily. Delivered fresh from our Kota store.', NULL, 4.7, 980, 5600, 5600, 100, 1, 'Pasteurised, fresh daily', '2026-10-31 07:48:01.563', '2026-10-31 07:48:01.563'),
(105, 90, 'Sourdough Bread', 'sourdough-bread', '400 g', 'Sourdough Bread — baked this morning. Delivered fresh from our Kota store.', NULL, 4.6, 75, 14000, 12000, 100, 1, 'Baked this morning', '2026-10-31 07:48:01.570', '2026-10-31 07:48:01.570'),
(106, 92, 'Salted Potato Chips', 'salted-potato-chips', '150 g', 'Salted Potato Chips — classic and crunchy. Delivered fresh from our Kota store.', NULL, 4.3, 260, 5000, 4500, 100, 1, 'Classic and crunchy', '2026-10-31 07:48:01.583', '2026-10-31 07:48:01.583'),
(107, 92, 'Premium Dry Fruits Mix', 'premium-dry-fruits-mix', '500 g', 'Premium Dry Fruits Mix — almonds, cashews & raisins. Delivered fresh from our Kota store.', NULL, 4.7, 188, 79900, 59900, 100, 1, 'Almonds, cashews & raisins', '2026-10-31 07:48:01.588', '2026-10-31 07:48:01.588'),
(108, 92, 'Fresh Fruit Hamper', 'fresh-fruit-hamper', '1.5 kg', 'Fresh Fruit Hamper — seasonal fruits, gift packed. Delivered fresh from our Kota store.', NULL, 4.6, 54, 59900, 49900, 100, 1, 'Seasonal fruits, gift packed', '2026-10-31 07:48:01.592', '2026-10-31 07:48:01.592'),
(109, 93, 'Cold Pressed Orange Juice', 'cold-pressed-orange-juice', '250 ml', 'Cold Pressed Orange Juice — no added sugar. Delivered fresh from our Kota store.', NULL, 4.4, 66, 12000, 9900, 100, 1, 'No added sugar', '2026-10-31 07:48:01.599', '2026-10-31 07:48:01.599'),
(110, 94, 'Masala Noodles', 'masala-noodles', '4 x 70 g', 'Masala Noodles — ready in 2 minutes. Delivered fresh from our Kota store.', NULL, 4.5, 840, 6000, 5600, 100, 1, 'Ready in 2 minutes', '2026-10-31 07:48:01.607', '2026-10-31 07:48:01.607'),
(111, 96, 'Cold Pressed Groundnut Oil', 'cold-pressed-groundnut-oil', '1 L', 'Cold Pressed Groundnut Oil — wood pressed, unrefined. Delivered fresh from our Kota store.', NULL, 4.6, 143, 34000, 28900, 100, 1, 'Wood pressed, unrefined', '2026-10-31 07:48:01.616', '2026-10-31 07:48:01.616'),
(112, 97, 'Basmati Rice', 'basmati-rice', '5 kg', 'Basmati Rice — long grain, aged 1 year. Delivered fresh from our Kota store.', NULL, 4.5, 412, 79900, 64900, 100, 1, 'Long grain, aged 1 year', '2026-10-31 07:48:01.623', '2026-10-31 07:48:01.623'),
(113, 99, 'Handmade Neem Soap', 'handmade-neem-soap', '3 x 100 g', 'Handmade Neem Soap — gentle, natural ingredients. Delivered fresh from our Kota store.', NULL, 4.4, 92, 22500, 18000, 100, 1, 'Gentle, natural ingredients', '2026-10-31 07:48:01.632', '2026-10-31 07:48:01.632'),
(114, 101, 'Liquid Detergent', 'liquid-detergent', '1 L', 'Liquid Detergent — tough on stains, gentle on clothes. Delivered fresh from our Kota store.', NULL, 4.3, 205, 24900, 19900, 100, 1, 'Tough on stains, gentle on clothes', '2026-10-31 07:48:01.640', '2026-10-31 07:48:01.640'),
(115, 103, 'Farm Fresh Eggs', 'farm-fresh-eggs', '12 pcs', 'Farm Fresh Eggs — protein rich, white eggs. Delivered fresh from our Kota store.', NULL, 4.6, 630, 9600, 8900, 100, 1, 'Protein rich, white eggs', '2026-10-31 07:48:01.648', '2026-10-31 07:48:01.648'),
(116, 104, 'Chicken Curry Cut', 'chicken-curry-cut', '500 g', 'Chicken Curry Cut — antibiotic residue free. Delivered fresh from our Kota store.', NULL, 4.4, 318, 22000, 18900, 100, 1, 'Antibiotic residue free', '2026-10-31 07:48:01.654', '2026-10-31 12:13:03.102');

-- --------------------------------------------------------

--
-- Table structure for table `productimage`
--

CREATE TABLE `productimage` (
  `id` int(11) NOT NULL,
  `productId` int(11) NOT NULL,
  `url` varchar(191) NOT NULL,
  `sortOrder` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `productimage`
--

INSERT INTO `productimage` (`id`, `productId`, `url`, `sortOrder`) VALUES
(88, 88, '/images/catalog/mango.jpg', 0),
(89, 89, '/images/catalog/lime.jpg', 0),
(90, 90, '/images/catalog/oranges.jpg', 0),
(91, 91, '/images/catalog/blueberries.jpg', 0),
(92, 92, '/images/catalog/strawberries.jpg', 0),
(93, 93, '/images/catalog/apples.jpg', 0),
(94, 94, '/images/catalog/dragon-fruit.jpg', 0),
(95, 95, '/images/catalog/kiwi.jpg', 0),
(96, 96, '/images/catalog/pineapple.jpg', 0),
(97, 97, '/images/catalog/banana.jpg', 0),
(98, 98, '/images/catalog/pomegranate.jpg', 0),
(99, 99, '/images/catalog/grapes.jpg', 0),
(100, 100, '/images/catalog/broccoli.jpg', 0),
(101, 101, '/images/catalog/tomatoes.jpg', 0),
(102, 102, '/images/catalog/spinach.jpg', 0),
(103, 103, '/images/catalog/herbs.jpg', 0),
(104, 104, '/images/catalog/milk.jpg', 0),
(105, 105, '/images/catalog/bread.jpg', 0),
(106, 106, '/images/catalog/chips.jpg', 0),
(107, 107, '/images/catalog/dry-fruits.jpg', 0),
(108, 108, '/images/catalog/fruit-basket.jpg', 0),
(109, 109, '/images/catalog/juice.jpg', 0),
(110, 110, '/images/catalog/noodles.jpg', 0),
(111, 111, '/images/catalog/oil.jpg', 0),
(112, 112, '/images/catalog/rice.jpg', 0),
(113, 113, '/images/catalog/soap.jpg', 0),
(114, 114, '/images/catalog/detergent.jpg', 0),
(115, 115, '/images/catalog/eggs.jpg', 0),
(121, 116, '/uploads/products/4db49634-e6c4-490d-9ef9-f17c1190cf76.webp', 0),
(122, 116, '/uploads/products/c49bfbc2-fd52-4c8d-9f1e-a45742fbf412.webp', 1),
(123, 116, '/uploads/products/c5c74f8a-b46f-42b7-ab7b-57477330f1ec.webp', 2);

-- --------------------------------------------------------

--
-- Table structure for table `storesetting`
--

CREATE TABLE `storesetting` (
  `id` int(11) NOT NULL DEFAULT 1,
  `name` varchar(60) NOT NULL DEFAULT 'Jhatpat',
  `phone` varchar(15) DEFAULT NULL,
  `address` varchar(191) DEFAULT NULL,
  `isOpen` tinyint(1) NOT NULL DEFAULT 1,
  `etaMinutes` int(11) NOT NULL DEFAULT 10,
  `deliveryFeePaise` int(11) NOT NULL,
  `freeDeliveryAbovePaise` int(11) NOT NULL,
  `minOrderPaise` int(11) NOT NULL DEFAULT 0,
  `lowStockThreshold` int(11) NOT NULL DEFAULT 10,
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `storesetting`
--

INSERT INTO `storesetting` (`id`, `name`, `phone`, `address`, `isOpen`, `etaMinutes`, `deliveryFeePaise`, `freeDeliveryAbovePaise`, `minOrderPaise`, `lowStockThreshold`, `updatedAt`) VALUES
(1, 'Jhatpat', '+919876543210', 'Shop 12, Main Market, Kota, Rajasthan', 1, 10, 2000, 19900, 0, 10, '2026-10-31 07:48:01.941');

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `id` varchar(191) NOT NULL,
  `name` varchar(60) NOT NULL,
  `mobile` varchar(10) DEFAULT NULL,
  `email` varchar(191) DEFAULT NULL,
  `passwordHash` varchar(191) DEFAULT NULL,
  `googleId` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `walletPaise` int(11) NOT NULL DEFAULT 0,
  `isBlocked` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`id`, `name`, `mobile`, `email`, `passwordHash`, `googleId`, `createdAt`, `walletPaise`, `isBlocked`) VALUES
('cmvt7p69k000064lo0vrxpcr2', 'Amit Sharma', '9876543210', 'amit.sharma@example.com', '$2b$12$eG50Qr3UwLve4QFfaGOx5ulRtqX7w/tkYHUyBXBM2FwFayyL5dsnu', NULL, '2026-10-29 07:18:33.464', 25000, 0),
('cmvt9sbmc00005wlobmztt36k', 'Abhishek Tyagi', '9057137074', 'thecode2258@gmail.com', '$2b$12$JssgPMNN4hI/Yc.wZYin7Ok67JjjBxSEDTP0rghqCNyn6nze/akSy', NULL, '2026-10-29 08:16:59.604', 0, 0),
('cmvum4fxh000094loboiqe6wq', 'Amit', '8824109250', 'amit@email.com', '$2b$12$MLkibzeeLpbijpJPHEVmQOb9CnqyL/SAggxLRYgGafi0FQaGW2tze', NULL, '2026-10-30 06:50:06.629', 0, 0),
('cmvw330gr000080lovrjym4a7', 'Abhishek Tyagi', '7737474404', NULL, '$2b$12$nT14kTmC3hZJyqbcjiCoDe4kg.Sx74A.aKVI9RMH4lJWrsnKjk6EG', NULL, '2026-10-31 07:32:39.579', 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `wallettransaction`
--

CREATE TABLE `wallettransaction` (
  `id` int(11) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `adminId` varchar(191) NOT NULL,
  `amountPaise` int(11) NOT NULL,
  `reason` varchar(120) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `wishlist`
--

CREATE TABLE `wishlist` (
  `userId` varchar(191) NOT NULL,
  `productId` int(11) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `_prisma_migrations`
--

CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) NOT NULL,
  `checksum` varchar(64) NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) NOT NULL,
  `logs` text DEFAULT NULL,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `applied_steps_count` int(10) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `_prisma_migrations`
--

INSERT INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`) VALUES
('18bcc664-6401-4bc7-8ab1-1f8231122df3', 'eb004da2a7da8c3b111573c7412ed4a55a9cbc43157bc952b5b440d96c36e7b6', '2026-10-31 07:43:00.888', '20261031131500_admin_panel', NULL, NULL, '2026-10-31 07:43:00.614', 1),
('b9199147-198f-48e9-a0a0-4dede3555ccc', '2e0aca9ea109f4f6d70c7f39092c279831775ce0a6e77ff41ab0903950e8df66', '2026-10-29 07:17:19.580', '20261029090000_offers_orders', NULL, NULL, '2026-10-29 07:17:19.510', 1),
('d3fde22c-cd6d-4020-bc9d-744fb2b3bc11', '12dcbec1a5a04d355d01ee35c5ff96155fe3c2e0434a760545d8d0060adcfbc5', '2026-10-29 06:55:33.757', '20261029065533_catalog', NULL, NULL, '2026-10-29 06:55:33.608', 1),
('e5759471-ea05-4d6e-b6be-75594c80249b', '1891b513875365aad2b1b6fc7e51a4a68358e36f1ec85eedd088a853c5378ca4', '2026-10-29 11:57:24.415', '20261029120000_order_coupon_code', NULL, NULL, '2026-10-29 11:57:24.398', 1),
('eb308c2b-e3c8-4fc2-9894-09f168dd2d0c', '11c3630ec72c71622e636e810424bf5b88d3cbd763831504df0081c6f432906b', '2026-10-29 06:43:17.318', '20261029064316_init', NULL, NULL, '2026-10-29 06:43:16.425', 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activitylog`
--
ALTER TABLE `activitylog`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ActivityLog_entity_entityId_idx` (`entity`,`entityId`),
  ADD KEY `ActivityLog_createdAt_idx` (`createdAt`),
  ADD KEY `ActivityLog_adminId_fkey` (`adminId`);

--
-- Indexes for table `address`
--
ALTER TABLE `address`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Address_userId_idx` (`userId`);

--
-- Indexes for table `adminuser`
--
ALTER TABLE `adminuser`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `AdminUser_email_key` (`email`);

--
-- Indexes for table `banner`
--
ALTER TABLE `banner`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Banner_categoryId_isActive_idx` (`categoryId`,`isActive`);

--
-- Indexes for table `cart`
--
ALTER TABLE `cart`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Cart_userId_key` (`userId`),
  ADD KEY `Cart_couponId_fkey` (`couponId`);

--
-- Indexes for table `cartitem`
--
ALTER TABLE `cartitem`
  ADD PRIMARY KEY (`cartId`,`productId`),
  ADD KEY `CartItem_productId_fkey` (`productId`);

--
-- Indexes for table `category`
--
ALTER TABLE `category`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Category_slug_key` (`slug`),
  ADD KEY `Category_parentId_isActive_idx` (`parentId`,`isActive`);

--
-- Indexes for table `coupon`
--
ALTER TABLE `coupon`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Coupon_code_key` (`code`);

--
-- Indexes for table `order`
--
ALTER TABLE `order`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Order_code_key` (`code`),
  ADD UNIQUE KEY `Order_razorpayOrderId_key` (`razorpayOrderId`),
  ADD UNIQUE KEY `Order_razorpayPaymentId_key` (`razorpayPaymentId`),
  ADD KEY `Order_userId_createdAt_idx` (`userId`,`createdAt`),
  ADD KEY `Order_addressId_fkey` (`addressId`),
  ADD KEY `Order_status_createdAt_idx` (`status`,`createdAt`),
  ADD KEY `Order_createdAt_idx` (`createdAt`);

--
-- Indexes for table `orderitem`
--
ALTER TABLE `orderitem`
  ADD PRIMARY KEY (`orderId`,`productId`),
  ADD KEY `OrderItem_productId_fkey` (`productId`);

--
-- Indexes for table `product`
--
ALTER TABLE `product`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Product_slug_key` (`slug`),
  ADD KEY `Product_categoryId_isActive_idx` (`categoryId`,`isActive`),
  ADD KEY `Product_stock_idx` (`stock`);

--
-- Indexes for table `productimage`
--
ALTER TABLE `productimage`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ProductImage_productId_idx` (`productId`);

--
-- Indexes for table `storesetting`
--
ALTER TABLE `storesetting`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `User_mobile_key` (`mobile`),
  ADD UNIQUE KEY `User_email_key` (`email`),
  ADD UNIQUE KEY `User_googleId_key` (`googleId`);

--
-- Indexes for table `wallettransaction`
--
ALTER TABLE `wallettransaction`
  ADD PRIMARY KEY (`id`),
  ADD KEY `WalletTransaction_userId_createdAt_idx` (`userId`,`createdAt`),
  ADD KEY `WalletTransaction_adminId_fkey` (`adminId`);

--
-- Indexes for table `wishlist`
--
ALTER TABLE `wishlist`
  ADD PRIMARY KEY (`userId`,`productId`),
  ADD KEY `Wishlist_productId_fkey` (`productId`);

--
-- Indexes for table `_prisma_migrations`
--
ALTER TABLE `_prisma_migrations`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activitylog`
--
ALTER TABLE `activitylog`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `banner`
--
ALTER TABLE `banner`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `category`
--
ALTER TABLE `category`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=105;

--
-- AUTO_INCREMENT for table `coupon`
--
ALTER TABLE `coupon`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `product`
--
ALTER TABLE `product`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=117;

--
-- AUTO_INCREMENT for table `productimage`
--
ALTER TABLE `productimage`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=124;

--
-- AUTO_INCREMENT for table `wallettransaction`
--
ALTER TABLE `wallettransaction`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activitylog`
--
ALTER TABLE `activitylog`
  ADD CONSTRAINT `ActivityLog_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `adminuser` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `address`
--
ALTER TABLE `address`
  ADD CONSTRAINT `Address_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `banner`
--
ALTER TABLE `banner`
  ADD CONSTRAINT `Banner_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `category` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `cart`
--
ALTER TABLE `cart`
  ADD CONSTRAINT `Cart_couponId_fkey` FOREIGN KEY (`couponId`) REFERENCES `coupon` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Cart_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `cartitem`
--
ALTER TABLE `cartitem`
  ADD CONSTRAINT `CartItem_cartId_fkey` FOREIGN KEY (`cartId`) REFERENCES `cart` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `CartItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `category`
--
ALTER TABLE `category`
  ADD CONSTRAINT `Category_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `category` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `order`
--
ALTER TABLE `order`
  ADD CONSTRAINT `Order_addressId_fkey` FOREIGN KEY (`addressId`) REFERENCES `address` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `Order_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `orderitem`
--
ALTER TABLE `orderitem`
  ADD CONSTRAINT `OrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `OrderItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `product`
--
ALTER TABLE `product`
  ADD CONSTRAINT `Product_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `category` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `productimage`
--
ALTER TABLE `productimage`
  ADD CONSTRAINT `ProductImage_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `wallettransaction`
--
ALTER TABLE `wallettransaction`
  ADD CONSTRAINT `WalletTransaction_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `adminuser` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `WalletTransaction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `wishlist`
--
ALTER TABLE `wishlist`
  ADD CONSTRAINT `Wishlist_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Wishlist_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
