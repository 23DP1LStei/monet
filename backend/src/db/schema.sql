-- Monet kopstrādes sistēmas datubāzes fiziskā struktūra
-- Izstrādāta atbilstoši dokumenta monet_posms2.docx specifikācijai

CREATE DATABASE IF NOT EXISTS monet_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE monet_db;

-- 5.1. Tabula: roles (Lietotāju lomas)
CREATE TABLE IF NOT EXISTS roles (
  role_id INT AUTO_INCREMENT PRIMARY KEY,
  role_name VARCHAR(20) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5.2. Tabula: users (Reģistrētie lietotāji)
CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(20) NOT NULL UNIQUE,
  fname VARCHAR(50) NOT NULL,
  surname VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone_number VARCHAR(15) NOT NULL UNIQUE,
  role_id INT NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles (role_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5.3. Tabula: coworking_spaces (Kopstrādes telpas)
CREATE TABLE IF NOT EXISTS coworking_spaces (
  space_id INT AUTO_INCREMENT PRIMARY KEY,
  creator_id INT NOT NULL,
  space_name VARCHAR(100) NOT NULL,
  address VARCHAR(255) NOT NULL,
  space_description TEXT,
  available_spots INT NOT NULL DEFAULT 1,
  price_per_hour DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  price_per_day DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_spaces_creator FOREIGN KEY (creator_id) REFERENCES users (user_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5.7. Tabula: photos (Telpu fotoattēli)
CREATE TABLE IF NOT EXISTS photos (
  photo_id INT AUTO_INCREMENT PRIMARY KEY,
  space_id INT NOT NULL,
  photo_path VARCHAR(255) NOT NULL,
  CONSTRAINT fk_photos_space FOREIGN KEY (space_id) REFERENCES coworking_spaces (space_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5.4. Tabula: reservations (Telpu rezervācijas)
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
  CONSTRAINT fk_reservations_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5.5. Tabula: payment_history (Maksājumu vēsture)
CREATE TABLE IF NOT EXISTS payment_history (
  payment_id INT AUTO_INCREMENT PRIMARY KEY,
  reservation_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_status ENUM('successful', 'failed', 'refunded') NOT NULL DEFAULT 'successful',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_reservation FOREIGN KEY (reservation_id) REFERENCES reservations (reservation_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5.6. Tabula: reviews (Atsauksmes un vērtējumi)
CREATE TABLE IF NOT EXISTS reviews (
  review_id INT AUTO_INCREMENT PRIMARY KEY,
  reservation_id INT NOT NULL UNIQUE,
  user_id INT NOT NULL,
  space_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reviews_reservation FOREIGN KEY (reservation_id) REFERENCES reservations (reservation_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_reviews_space FOREIGN KEY (space_id) REFERENCES coworking_spaces (space_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sākotnējie sistēmas dati: Lomas
INSERT IGNORE INTO roles (role_id, role_name) VALUES
  (1, 'guest'),
  (2, 'user'),
  (3, 'landlord'),
  (4, 'admin');
