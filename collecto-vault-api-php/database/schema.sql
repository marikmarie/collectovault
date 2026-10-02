-- Collecto Vault framework-free PHP API schema
-- Import this once into the database named by VAULT_DB_NAME.

CREATE TABLE IF NOT EXISTS chat_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clientId INT NOT NULL,
  senderType ENUM('customer', 'support') NOT NULL,
  message TEXT NOT NULL,
  attachments TEXT NULL COMMENT 'JSON array of attachment URLs',
  isRead BOOLEAN DEFAULT FALSE,
  readAt TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_client_id (clientId),
  INDEX idx_created_at (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS whatsapp_contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clientId INT NOT NULL,
  whatsappNumber VARCHAR(20) NOT NULL,
  isPreferred BOOLEAN DEFAULT FALSE,
  verifiedAt TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_client_preferred (clientId, isPreferred),
  INDEX idx_client_id (clientId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS business_contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contactType ENUM('whatsapp', 'email', 'phone') NOT NULL,
  value VARCHAR(255) NOT NULL,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_contact_type (contactType, isActive)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clientId INT NOT NULL,
  feedbackType ENUM('order', 'service', 'app', 'general') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  attachments TEXT NULL COMMENT 'JSON array of attachment URLs',
  status ENUM('open', 'in-progress', 'resolved', 'closed') DEFAULT 'open',
  priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_client_id (clientId),
  INDEX idx_status (status),
  INDEX idx_created_at (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ratings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clientId INT NOT NULL,
  transactionId INT NOT NULL,
  orderRating TINYINT NOT NULL,
  paymentRating TINYINT NOT NULL,
  serviceRating TINYINT NOT NULL,
  overallRating TINYINT NOT NULL,
  comment TEXT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_transaction_rating (clientId, transactionId),
  INDEX idx_client_id (clientId),
  INDEX idx_transaction_id (transactionId),
  INDEX idx_created_at (createdAt),
  CONSTRAINT chk_order_rating CHECK (orderRating BETWEEN 1 AND 5),
  CONSTRAINT chk_payment_rating CHECK (paymentRating BETWEEN 1 AND 5),
  CONSTRAINT chk_service_rating CHECK (serviceRating BETWEEN 1 AND 5),
  CONSTRAINT chk_overall_rating CHECK (overallRating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Makes the post-card-payment handoff idempotent across PHP requests and restarts.
CREATE TABLE IF NOT EXISTS card_payment_completions (
  cardCollectionId VARCHAR(60) PRIMARY KEY,
  status ENUM('processing', 'completed') NOT NULL,
  response JSON NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completedAt TIMESTAMP NULL,
  INDEX idx_status_created (status, createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
