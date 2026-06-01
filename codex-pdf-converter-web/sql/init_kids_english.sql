CREATE DATABASE IF NOT EXISTS `kids_english`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;

USE `kids_english`;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(100) NOT NULL,
  `password_hash` VARCHAR(128) NOT NULL,
  `role` VARCHAR(20) NOT NULL DEFAULT 'STAFF',
  `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `users` (`username`, `password_hash`, `role`, `status`)
VALUES ('admin', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'ADMIN', 'ACTIVE')
ON DUPLICATE KEY UPDATE `username` = VALUES(`username`);

CREATE TABLE IF NOT EXISTS `papers` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `owner_user_id` BIGINT UNSIGNED NOT NULL,
  `share_code` VARCHAR(6) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `theme_note` VARCHAR(1000) NULL,
  `welcome_speech` VARCHAR(1000) NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  `question_count` INT NOT NULL DEFAULT 0,
  `total_score` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_papers_status` (`status`),
  KEY `idx_papers_updated_at` (`updated_at`),
  KEY `idx_papers_owner_user_id` (`owner_user_id`),
  UNIQUE KEY `uk_papers_share_code` (`share_code`),
  CONSTRAINT `fk_papers_owner_user`
    FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`)
    ON DELETE RESTRICT
    ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `paper_questions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `paper_id` BIGINT UNSIGNED NOT NULL,
  `sort_no` INT NOT NULL,
  `question_type` VARCHAR(50) NOT NULL,
  `prompt` VARCHAR(1000) NULL,
  `score` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `content_json` JSON NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_paper_questions_paper_sort` (`paper_id`, `sort_no`),
  KEY `idx_paper_questions_type` (`question_type`),
  CONSTRAINT `fk_paper_questions_paper`
    FOREIGN KEY (`paper_id`) REFERENCES `papers` (`id`)
    ON DELETE CASCADE
    ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `submissions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `paper_id` BIGINT UNSIGNED NOT NULL,
  `owner_user_id` BIGINT UNSIGNED NOT NULL,
  `student_name` VARCHAR(100) NOT NULL,
  `student_phone` VARCHAR(50) NOT NULL,
  `student_age` VARCHAR(20) NOT NULL,
  `student_grade` VARCHAR(100) NOT NULL,
  `total_score` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `total_possible_score` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `percent_score` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `report_json` JSON NULL,
  `report_token` VARCHAR(64) NOT NULL,
  `submitted_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_submissions_report_token` (`report_token`),
  KEY `idx_submissions_paper_id` (`paper_id`),
  KEY `idx_submissions_owner_user_id` (`owner_user_id`),
  KEY `idx_submissions_student_name` (`student_name`),
  KEY `idx_submissions_student_phone` (`student_phone`),
  KEY `idx_submissions_submitted_at` (`submitted_at`),
  CONSTRAINT `fk_submissions_paper`
    FOREIGN KEY (`paper_id`) REFERENCES `papers` (`id`)
    ON DELETE CASCADE
    ON UPDATE RESTRICT,
  CONSTRAINT `fk_submissions_owner_user`
    FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`)
    ON DELETE RESTRICT
    ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `submission_answers` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `submission_id` BIGINT UNSIGNED NOT NULL,
  `paper_question_id` BIGINT UNSIGNED NOT NULL,
  `sort_no` INT NOT NULL,
  `question_type` VARCHAR(50) NOT NULL,
  `prompt` VARCHAR(1000) NULL,
  `student_answer_json` JSON NULL,
  `correct_answer_json` JSON NULL,
  `gained_score` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `total_score` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `answer_status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_submission_answers_submission_question` (`submission_id`, `paper_question_id`),
  KEY `idx_submission_answers_submission_id` (`submission_id`),
  KEY `idx_submission_answers_sort_no` (`sort_no`),
  CONSTRAINT `fk_submission_answers_submission`
    FOREIGN KEY (`submission_id`) REFERENCES `submissions` (`id`)
    ON DELETE CASCADE
    ON UPDATE RESTRICT,
  CONSTRAINT `fk_submission_answers_question`
    FOREIGN KEY (`paper_question_id`) REFERENCES `paper_questions` (`id`)
    ON DELETE RESTRICT
    ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `user_sessions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `session_token` VARCHAR(128) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_sessions_token` (`session_token`),
  KEY `idx_user_sessions_user_id` (`user_id`),
  CONSTRAINT `fk_user_sessions_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE OR REPLACE VIEW `vw_paper_summary` AS
SELECT
  p.id,
  p.owner_user_id,
  p.title,
  p.status,
  p.question_count,
  p.total_score,
  p.created_at,
  p.updated_at,
  COUNT(s.id) AS submission_count,
  MAX(s.submitted_at) AS last_submitted_at
FROM `papers` p
LEFT JOIN `submissions` s ON s.paper_id = p.id
GROUP BY
  p.id,
  p.owner_user_id,
  p.title,
  p.status,
  p.question_count,
  p.total_score,
  p.created_at,
  p.updated_at;
