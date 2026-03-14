CREATE TABLE `lineConversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lineUserId` varchar(255) NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lineConversations_id` PRIMARY KEY(`id`)
);
