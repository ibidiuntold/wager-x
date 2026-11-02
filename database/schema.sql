-- ============================================================
-- WagerX — Complete MySQL Schema
-- Run against an empty `wagerx` database
-- ============================================================

CREATE DATABASE IF NOT EXISTS wagerx CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE wagerx;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id              VARCHAR(36)    NOT NULL PRIMARY KEY,
  email           VARCHAR(255)   NOT NULL UNIQUE,
  password        VARCHAR(255)   NOT NULL,
  firstName       VARCHAR(100)   NOT NULL,
  lastName        VARCHAR(100)   NOT NULL,
  nickname        VARCHAR(100)   UNIQUE,
  dob             DATE,
  phoneNumber     VARCHAR(20),
  avatarUrl       VARCHAR(500),
  referralCode    VARCHAR(20)    UNIQUE,
  role            ENUM('user','admin') NOT NULL DEFAULT 'user',
  status          ENUM('active','inactive','suspended','banned','pending') NOT NULL DEFAULT 'pending',
  emailVerified   TINYINT(1)     NOT NULL DEFAULT 0,
  kycVerified     TINYINT(1)     NOT NULL DEFAULT 0,
  balance         DECIMAL(15,2)  NOT NULL DEFAULT 0.00,
  walletBonus     DECIMAL(15,2)  NOT NULL DEFAULT 0.00,
  gamePoints      INT            NOT NULL DEFAULT 0,
  lastLogin       DATETIME,
  createdAt       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email        (email),
  INDEX idx_nickname     (nickname),
  INDEX idx_referralCode (referralCode),
  INDEX idx_status       (status),
  INDEX idx_createdAt    (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- GAMES
-- ============================================================
CREATE TABLE IF NOT EXISTS games (
  id            VARCHAR(100)   NOT NULL PRIMARY KEY,  -- uses slug as id
  title         VARCHAR(200)   NOT NULL,
  name          VARCHAR(200),
  slug          VARCHAR(200)   NOT NULL UNIQUE,
  description   TEXT,
  instructions  TEXT,
  image         VARCHAR(500),
  link          VARCHAR(500),
  activeStatus  TINYINT(1)     NOT NULL DEFAULT 1,
  minWager      DECIMAL(15,2)  NOT NULL DEFAULT 0.00,
  maxWager      DECIMAL(15,2)  NOT NULL DEFAULT 0.00,
  houseEdge     DECIMAL(5,2)   NOT NULL DEFAULT 0.00,
  monthPlayers  INT            NOT NULL DEFAULT 0,
  keywords      TEXT,
  gameSettings  JSON,
  createdAt     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slug         (slug),
  INDEX idx_activeStatus (activeStatus)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- WAGERS
-- ============================================================
CREATE TABLE IF NOT EXISTS wagers (
  id            VARCHAR(36)    NOT NULL PRIMARY KEY,
  creatorId     VARCHAR(36)    NOT NULL,
  title         VARCHAR(300)   NOT NULL,
  description   TEXT,
  slug          VARCHAR(350)   NOT NULL UNIQUE,
  category      VARCHAR(100),
  image         VARCHAR(500),
  status        ENUM('open','closed','settled','cancelled','rejected') NOT NULL DEFAULT 'open',
  isResolved    TINYINT(1)     NOT NULL DEFAULT 0,
  isPublic      TINYINT(1)     NOT NULL DEFAULT 1,
  options       JSON           NOT NULL,
  minimumEntry  DECIMAL(15,2)  NOT NULL DEFAULT 0.00,
  totalPool     DECIMAL(15,2)  NOT NULL DEFAULT 0.00,
  winningOption VARCHAR(300),
  expiresAt     DATETIME,
  createdAt     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (creatorId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_creatorId  (creatorId),
  INDEX idx_status     (status),
  INDEX idx_category   (category),
  INDEX idx_expiresAt  (expiresAt),
  INDEX idx_createdAt  (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- WAGER PARTICIPANTS
-- ============================================================
CREATE TABLE IF NOT EXISTS wager_participants (
  id              VARCHAR(36)    NOT NULL PRIMARY KEY,
  wagerId         VARCHAR(36)    NOT NULL,
  userId          VARCHAR(36)    NOT NULL,
  gameSessionId   VARCHAR(36),
  optionSelected  VARCHAR(300)   NOT NULL,
  amount          DECIMAL(15,2)  NOT NULL DEFAULT 0.00,
  joinedAt        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (wagerId) REFERENCES wagers(id) ON DELETE CASCADE,
  FOREIGN KEY (userId)  REFERENCES users(id)  ON DELETE CASCADE,
  INDEX idx_wagerId (wagerId),
  INDEX idx_userId  (userId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- GAME SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS game_sessions (
  id                  VARCHAR(36)   NOT NULL PRIMARY KEY,
  gameId              VARCHAR(100)  NOT NULL,
  status              ENUM('waiting','playing','finished','expired') NOT NULL DEFAULT 'waiting',
  wager               DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  winner              VARCHAR(36),
  currentTurn         VARCHAR(36),
  isRandomMatch       TINYINT(1)    NOT NULL DEFAULT 0,
  players             JSON,
  gameState           JSON,
  moves               JSON,
  config              JSON,
  startTime           BIGINT,
  endTime             BIGINT,
  lastActivityTime    BIGINT,
  expiresAt           BIGINT,
  createdAt           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_gameId  (gameId),
  INDEX idx_status  (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
  id                VARCHAR(36)    NOT NULL PRIMARY KEY,
  userId            VARCHAR(36)    NOT NULL,
  reference         VARCHAR(100)   NOT NULL UNIQUE,
  providerReference VARCHAR(100),
  amount            DECIMAL(15,2)  NOT NULL DEFAULT 0.00,
  netAmount         DECIMAL(15,2),
  processingFee     DECIMAL(15,2)  NOT NULL DEFAULT 0.00,
  status            ENUM('pending','processing','completed','failed','reversed') NOT NULL DEFAULT 'pending',
  type              ENUM('deposit','withdrawal','bonus','refund','wager_debit','wager_credit') NOT NULL,
  provider          ENUM('paystack','flutterwave','opay','internal') NOT NULL DEFAULT 'paystack',
  accountNumber     VARCHAR(20),
  bankCode          VARCHAR(20),
  bankName          VARCHAR(100),
  accountName       VARCHAR(200),
  recipientCode     VARCHAR(100),
  metadata          JSON,
  createdAt         DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt         DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_userId    (userId),
  INDEX idx_reference (reference),
  INDEX idx_status    (status),
  INDEX idx_type      (type),
  INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SETTLEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS settlements (
  id            VARCHAR(36)    NOT NULL PRIMARY KEY,
  wagerId       VARCHAR(36)    NOT NULL,
  creatorId     VARCHAR(36)    NOT NULL,
  totalAmount   DECIMAL(15,2)  NOT NULL DEFAULT 0.00,
  status        ENUM('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
  notes         TEXT,
  processedAt   DATETIME,
  createdAt     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (wagerId)   REFERENCES wagers(id) ON DELETE CASCADE,
  FOREIGN KEY (creatorId) REFERENCES users(id)  ON DELETE CASCADE,
  INDEX idx_wagerId (wagerId),
  INDEX idx_status  (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SETTLED USERS  (winners per settlement)
-- ============================================================
CREATE TABLE IF NOT EXISTS settled_users (
  id              VARCHAR(36)    NOT NULL PRIMARY KEY,
  settlementId    VARCHAR(36)    NOT NULL,
  wagerId         VARCHAR(36)    NOT NULL,
  userId          VARCHAR(36)    NOT NULL,
  amount          DECIMAL(15,2)  NOT NULL DEFAULT 0.00,
  transactionId   VARCHAR(36),
  createdAt       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (settlementId) REFERENCES settlements(id) ON DELETE CASCADE,
  FOREIGN KEY (userId)       REFERENCES users(id)       ON DELETE CASCADE,
  INDEX idx_settlementId (settlementId),
  INDEX idx_wagerId      (wagerId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- BONUSES
-- ============================================================
CREATE TABLE IF NOT EXISTS bonuses (
  id          VARCHAR(36)    NOT NULL PRIMARY KEY,
  name        VARCHAR(200)   NOT NULL,
  description TEXT,
  type        VARCHAR(50)    NOT NULL,
  amount      DECIMAL(15,2)  NOT NULL DEFAULT 0.00,
  criteria    JSON,
  target      VARCHAR(50),
  isActive    TINYINT(1)     NOT NULL DEFAULT 1,
  startDate   DATETIME,
  endDate     DATETIME,
  creatorId   VARCHAR(36),
  createdAt   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_type     (type),
  INDEX idx_isActive (isActive)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- BONUS USERS  (which users received which bonus)
-- ============================================================
CREATE TABLE IF NOT EXISTS bonus_users (
  id          VARCHAR(36)    NOT NULL PRIMARY KEY,
  bonusId     VARCHAR(36)    NOT NULL,
  userId      VARCHAR(36)    NOT NULL,
  amount      DECIMAL(15,2)  NOT NULL DEFAULT 0.00,
  awardedAt   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bonusId) REFERENCES bonuses(id) ON DELETE CASCADE,
  FOREIGN KEY (userId)  REFERENCES users(id)   ON DELETE CASCADE,
  INDEX idx_bonusId (bonusId),
  INDEX idx_userId  (userId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- REFERRALS
-- ============================================================
CREATE TABLE IF NOT EXISTS referrals (
  id            VARCHAR(36)   NOT NULL PRIMARY KEY,
  referrerId    VARCHAR(36)   NOT NULL,
  referralCode  VARCHAR(50)   NOT NULL UNIQUE,
  uses          INT           NOT NULL DEFAULT 0,
  maxUses       INT,
  bonusId       VARCHAR(36),
  isActive      TINYINT(1)    NOT NULL DEFAULT 1,
  createdAt     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (referrerId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_referrerId   (referrerId),
  INDEX idx_referralCode (referralCode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id          VARCHAR(36)   NOT NULL PRIMARY KEY,
  userId      VARCHAR(36),                            -- NULL = global broadcast
  title       VARCHAR(300)  NOT NULL,
  message     TEXT          NOT NULL,
  type        VARCHAR(50),
  category    VARCHAR(50),
  status      TINYINT(1)    NOT NULL DEFAULT 0,       -- 0 = unread, 1 = read
  buttonLink  VARCHAR(500),
  buttonText  VARCHAR(100),
  expiresAt   DATETIME,
  createdAt   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_userId    (userId),
  INDEX idx_status    (status),
  INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- COMMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS comments (
  id          VARCHAR(36)   NOT NULL PRIMARY KEY,
  wagerId     VARCHAR(36)   NOT NULL,
  userId      VARCHAR(36)   NOT NULL,
  comment     TEXT          NOT NULL,
  createdAt   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (wagerId) REFERENCES wagers(id) ON DELETE CASCADE,
  FOREIGN KEY (userId)  REFERENCES users(id)  ON DELETE CASCADE,
  INDEX idx_wagerId   (wagerId),
  INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- REPLIES  (replies to comments)
-- ============================================================
CREATE TABLE IF NOT EXISTS replies (
  id          VARCHAR(36)   NOT NULL PRIMARY KEY,
  commentId   VARCHAR(36)   NOT NULL,
  userId      VARCHAR(36)   NOT NULL,
  reply       TEXT          NOT NULL,
  createdAt   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (commentId) REFERENCES comments(id) ON DELETE CASCADE,
  FOREIGN KEY (userId)    REFERENCES users(id)    ON DELETE CASCADE,
  INDEX idx_commentId (commentId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- LIKES  (on comments and replies)
-- ============================================================
CREATE TABLE IF NOT EXISTS likes (
  id          VARCHAR(36)                      NOT NULL PRIMARY KEY,
  userId      VARCHAR(36)                      NOT NULL,
  targetId    VARCHAR(36)                      NOT NULL,
  targetType  ENUM('comment','reply')          NOT NULL,
  createdAt   DATETIME                         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY  uq_user_target (userId, targetId, targetType),
  INDEX idx_targetId (targetId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SUBSCRIBERS  (newsletter)
-- ============================================================
CREATE TABLE IF NOT EXISTS subscribers (
  id          VARCHAR(36)   NOT NULL PRIMARY KEY,
  email       VARCHAR(255)  NOT NULL UNIQUE,
  status      ENUM('active','unsubscribed') NOT NULL DEFAULT 'active',
  createdAt   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email  (email),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- MAILING SETTINGS  (one row per user)
-- ============================================================
CREATE TABLE IF NOT EXISTS mailing_settings (
  id                  VARCHAR(36)  NOT NULL PRIMARY KEY,
  userId              VARCHAR(36)  NOT NULL UNIQUE,
  systemMessages      TINYINT(1)   NOT NULL DEFAULT 1,
  personalBonuses     TINYINT(1)   NOT NULL DEFAULT 1,
  smsDistribution     TINYINT(1)   NOT NULL DEFAULT 0,
  pushNotifications   TINYINT(1)   NOT NULL DEFAULT 0,
  createdAt           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- BANK DETAILS  (one row per user)
-- ============================================================
CREATE TABLE IF NOT EXISTS bank_details (
  id            VARCHAR(36)  NOT NULL PRIMARY KEY,
  userId        VARCHAR(36)  NOT NULL UNIQUE,
  accountNumber VARCHAR(20)  NOT NULL,
  bankCode      VARCHAR(20)  NOT NULL,
  bankName      VARCHAR(100) NOT NULL,
  accountName   VARCHAR(200) NOT NULL,
  createdAt     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- ADMIN SETTINGS  (single-row config table)
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_settings (
  id        VARCHAR(36)  NOT NULL PRIMARY KEY,
  data      JSON         NOT NULL,
  createdAt DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed the single admin_settings row
INSERT IGNORE INTO admin_settings (id, data) VALUES ('main', '{}');

-- ============================================================
-- MIGRATIONS  (run these if upgrading an existing database)
-- ============================================================

-- v1.1: rename isPrivate -> isPublic on wagers (if you ran the original schema)
-- ALTER TABLE wagers ADD COLUMN IF NOT EXISTS isPublic TINYINT(1) NOT NULL DEFAULT 1 AFTER isResolved;
-- ALTER TABLE wagers DROP COLUMN IF EXISTS isPrivate;

-- v1.2: add wagerType column to wagers
ALTER TABLE wagers ADD COLUMN IF NOT EXISTS wagerType ENUM('p2p', 'event') NOT NULL DEFAULT 'p2p';

-- v1.3: leaderboard columns on users
ALTER TABLE users ADD COLUMN IF NOT EXISTS totalWinnings   DECIMAL(15,2) NOT NULL DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS wagersPlayed    INT           NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS weeklyWinnings  DECIMAL(15,2) NOT NULL DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS weeklyWagerCount INT          NOT NULL DEFAULT 0;

-- v1.4: oddsAtBet on wager_participants
ALTER TABLE wager_participants ADD COLUMN IF NOT EXISTS oddsAtBet DECIMAL(5,2) NOT NULL DEFAULT 1.00;

-- v1.5: friendships table
CREATE TABLE IF NOT EXISTS friendships (
  id           VARCHAR(36)                              NOT NULL PRIMARY KEY,
  requesterId  VARCHAR(36)                              NOT NULL,
  addresseeId  VARCHAR(36)                              NOT NULL,
  status       ENUM('pending','accepted','rejected')    NOT NULL DEFAULT 'pending',
  createdAt    DATETIME                                 NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt    DATETIME                                 NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_friendship (requesterId, addresseeId),
  FOREIGN KEY (requesterId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (addresseeId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_requesterId (requesterId),
  INDEX idx_addresseeId (addresseeId),
  INDEX idx_status      (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
