-- ============================================================================
-- Monet kopstrādes sistēmas datubāzes pilnā fiziskā struktūra
-- Izstrādāta atbilstoši dokumenta monet_posms2.docx specifikācijai
-- Ietver visas 7 bāzes tabulas, datu tipus, ierobežojumus (CHECK, FK),
-- lomu datus, kā arī paplašinātos laukus meklēšanai, filtrēšanai un ērtībām.
-- ============================================================================

CREATE DATABASE IF NOT EXISTS monet_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE monet_db;

-- ----------------------------------------------------------------------------
-- 5.1. Tabula: roles (Lietotāju lomas)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
  role_id INT AUTO_INCREMENT PRIMARY KEY,
  role_name VARCHAR(20) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5.2. Tabula: users (Reģistrētie lietotāji)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(20) NOT NULL UNIQUE,
  fname VARCHAR(50) NOT NULL,
  surname VARCHAR(50) NOT NULL,
  email VARCHAR(50) NOT NULL UNIQUE,
  phone_number VARCHAR(15) NOT NULL UNIQUE,
  role_id INT NOT NULL DEFAULT 2,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles (role_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_users_username CHECK (CHAR_LENGTH(username) >= 3 AND CHAR_LENGTH(username) <= 20),
  CONSTRAINT chk_users_fname CHECK (CHAR_LENGTH(fname) <= 50 AND fname NOT REGEXP '[0-9]'),
  CONSTRAINT chk_users_surname CHECK (CHAR_LENGTH(surname) <= 50 AND surname NOT REGEXP '[0-9]'),
  CONSTRAINT chk_users_email CHECK (CHAR_LENGTH(email) <= 50),
  CONSTRAINT chk_users_phone CHECK (CHAR_LENGTH(phone_number) >= 7 AND CHAR_LENGTH(phone_number) <= 15)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5.3. Tabula: coworking_spaces (Kopstrādes telpas)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS coworking_spaces (
  space_id INT AUTO_INCREMENT PRIMARY KEY,
  creator_id INT NOT NULL,
  space_name VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL DEFAULT '',
  address VARCHAR(255) NOT NULL,
  space_type ENUM('hot-desk', 'dedicated', 'private-office', 'meeting-room') NOT NULL DEFAULT 'hot-desk',
  space_description TEXT,
  available_spots INT NOT NULL DEFAULT 1,
  price_per_hour DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  price_per_day DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  is_instant_book BOOLEAN NOT NULL DEFAULT FALSE,
  amenities TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_spaces_creator FOREIGN KEY (creator_id) REFERENCES users (user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_spaces_spots CHECK (available_spots >= 1),
  CONSTRAINT chk_spaces_price_hour CHECK (price_per_hour >= 0.00),
  CONSTRAINT chk_spaces_price_day CHECK (price_per_day >= 0.00),
  INDEX idx_spaces_city (city),
  INDEX idx_spaces_type (space_type),
  INDEX idx_spaces_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5.7. Tabula: photos (Telpu fotoattēli)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS photos (
  photo_id INT AUTO_INCREMENT PRIMARY KEY,
  space_id INT NOT NULL,
  photo_path VARCHAR(255) NOT NULL,
  CONSTRAINT fk_photos_space FOREIGN KEY (space_id) REFERENCES coworking_spaces (space_id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_photos_space (space_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5.4. Tabula: reservations (Telpu rezervācijas)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reservations (
  reservation_id INT AUTO_INCREMENT PRIMARY KEY,
  space_id INT NOT NULL,
  user_id INT NOT NULL,
  reservation_type ENUM('individual', 'group') NOT NULL DEFAULT 'individual',
  guest_count INT NOT NULL DEFAULT 1,
  amount DECIMAL(10,2) NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  reservation_status ENUM('pending', 'confirmed', 'canceled') NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reservations_space FOREIGN KEY (space_id) REFERENCES coworking_spaces (space_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_reservations_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_reservations_guests CHECK (guest_count >= 1),
  CONSTRAINT chk_reservations_amount CHECK (amount >= 0.00),
  INDEX idx_reservations_user (user_id),
  INDEX idx_reservations_space (space_id),
  INDEX idx_reservations_status (reservation_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5.5. Tabula: payment_history (Maksājumu vēsture)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_history (
  payment_id INT AUTO_INCREMENT PRIMARY KEY,
  reservation_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_status ENUM('successful', 'failed', 'refunded') NOT NULL DEFAULT 'successful',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_reservation FOREIGN KEY (reservation_id) REFERENCES reservations (reservation_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_payments_amount CHECK (amount >= 0.00),
  INDEX idx_payments_reservation (reservation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5.6. Tabula: reviews (Atsauksmes un vērtējumi)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
  review_id INT AUTO_INCREMENT PRIMARY KEY,
  reservation_id INT NOT NULL UNIQUE,
  user_id INT NOT NULL,
  space_id INT NOT NULL,
  rating INT NOT NULL,
  comment TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reviews_reservation FOREIGN KEY (reservation_id) REFERENCES reservations (reservation_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_reviews_space FOREIGN KEY (space_id) REFERENCES coworking_spaces (space_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_reviews_rating CHECK (rating >= 1 AND rating <= 5),
  INDEX idx_reviews_space (space_id),
  INDEX idx_reviews_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Sākotnējie sistēmas dati: Lomas
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO roles (role_id, role_name) VALUES
  (1, 'guest'),
  (2, 'user'),
  (3, 'landlord'),
  (4, 'admin');

-- ----------------------------------------------------------------------------
-- Migrācijas: droša jauno lauku pievienošana jau eksistējošai datubāzei
-- ----------------------------------------------------------------------------
ALTER TABLE coworking_spaces
  ADD COLUMN IF NOT EXISTS city VARCHAR(100) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS space_type ENUM('hot-desk','dedicated','private-office','meeting-room') NOT NULL DEFAULT 'hot-desk',
  ADD COLUMN IF NOT EXISTS is_instant_book BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS amenities TEXT DEFAULT '[]';
