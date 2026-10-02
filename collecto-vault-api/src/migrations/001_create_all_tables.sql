-- Collecto Vault plain-PHP database schema.
-- Every application table deliberately uses the vault_ prefix.
-- Import this file into the database named by VAULT_DB_NAME before serving index.php.

CREATE TABLE IF NOT EXISTS vault_migrations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  run_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vault_chat_messages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  client_id BIGINT UNSIGNED NOT NULL,
  sender_type ENUM('customer','support') NOT NULL,
  message TEXT NOT NULL,
  attachments JSON NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  read_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX vault_chat_messages_client_created (client_id, created_at),
  INDEX vault_chat_messages_client_unread (client_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vault_whatsapp_contacts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  client_id BIGINT UNSIGNED NOT NULL UNIQUE,
  whatsapp_number VARCHAR(20) NOT NULL,
  is_preferred TINYINT(1) NOT NULL DEFAULT 1,
  verified_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vault_business_contacts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  contact_type ENUM('whatsapp','email','phone') NOT NULL UNIQUE,
  value VARCHAR(255) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vault_feedback (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  client_id BIGINT UNSIGNED NOT NULL,
  feedback_type ENUM('order','service','app','general') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  attachments JSON NULL,
  status ENUM('open','in-progress','resolved','closed') NOT NULL DEFAULT 'open',
  priority ENUM('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX vault_feedback_client_created (client_id, created_at),
  INDEX vault_feedback_status_created (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vault_ratings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  client_id BIGINT UNSIGNED NOT NULL,
  transaction_id BIGINT UNSIGNED NOT NULL,
  order_rating TINYINT UNSIGNED NOT NULL,
  payment_rating TINYINT UNSIGNED NOT NULL,
  service_rating TINYINT UNSIGNED NOT NULL,
  overall_rating TINYINT UNSIGNED NOT NULL,
  comment TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY vault_ratings_transaction (transaction_id),
  INDEX vault_ratings_client_created (client_id, created_at),
  CONSTRAINT vault_ratings_order_range CHECK (order_rating BETWEEN 1 AND 5),
  CONSTRAINT vault_ratings_payment_range CHECK (payment_rating BETWEEN 1 AND 5),
  CONSTRAINT vault_ratings_service_range CHECK (service_rating BETWEEN 1 AND 5),
  CONSTRAINT vault_ratings_overall_range CHECK (overall_rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vault_payment_status_cache (
  transaction_id VARCHAR(120) PRIMARY KEY,
  status VARCHAR(32) NOT NULL,
  payload_json JSON NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vault_card_collections (
  collection_id VARCHAR(60) PRIMARY KEY,
  client_id VARCHAR(80) NOT NULL,
  collecto_id VARCHAR(80) NOT NULL,
  expected_amount DECIMAL(16,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'UGX',
  description VARCHAR(200) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  checkout_url VARCHAR(2048) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX vault_card_collections_client (client_id, collecto_id),
  INDEX vault_card_collections_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vault_card_finalizations (
  collection_id VARCHAR(60) PRIMARY KEY,
  state ENUM('processing','completed','failed') NOT NULL,
  response_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT vault_card_finalizations_collection FOREIGN KEY (collection_id)
    REFERENCES vault_card_collections(collection_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
