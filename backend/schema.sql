-- ============================================================
--  KRAVINGS DELIVERY BOY MODULE  –  MySQL Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS kravings_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE kravings_db;

-- ── DELIVERY BOYS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS delivery_boys (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  first_name      VARCHAR(80)  NOT NULL,
  last_name       VARCHAR(80)  NOT NULL,
  email           VARCHAR(150) NOT NULL UNIQUE,
  mobile          VARCHAR(15)  NOT NULL UNIQUE,
  password_hash   VARCHAR(256) NOT NULL,
  city            VARCHAR(80),
  dob             DATE,
  profile_photo   VARCHAR(255),
  partner_id      VARCHAR(20)  UNIQUE,            -- e.g. DB-2025-001
  status          ENUM('pending','active','suspended','rejected') DEFAULT 'pending',
  is_online       TINYINT(1)   DEFAULT 0,
  rating          DECIMAL(3,2) DEFAULT 0.00,
  total_deliveries INT         DEFAULT 0,
  acceptance_rate  DECIMAL(5,2) DEFAULT 0.00,
  created_at      DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ── VEHICLE DETAILS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vehicles (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  delivery_boy_id INT NOT NULL,
  vehicle_type    ENUM('bike','scooter','bicycle','ev') DEFAULT 'bike',
  brand_model     VARCHAR(120),
  reg_number      VARCHAR(30)  UNIQUE,
  year            YEAR,
  color           VARCHAR(60),
  FOREIGN KEY (delivery_boy_id) REFERENCES delivery_boys(id) ON DELETE CASCADE
);

-- ── BANK ACCOUNTS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bank_accounts (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  delivery_boy_id INT NOT NULL UNIQUE,
  account_number  VARCHAR(30)  NOT NULL,
  ifsc_code       VARCHAR(15)  NOT NULL,
  bank_name       VARCHAR(100),
  account_holder  VARCHAR(150),
  verified        TINYINT(1)   DEFAULT 0,
  FOREIGN KEY (delivery_boy_id) REFERENCES delivery_boys(id) ON DELETE CASCADE
);

-- ── DOCUMENTS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  delivery_boy_id INT NOT NULL,
  doc_type        ENUM('driving_licence','rc_book','insurance','aadhaar','pan','selfie') NOT NULL,
  file_path       VARCHAR(255),
  status          ENUM('pending','verified','rejected','expired') DEFAULT 'pending',
  expiry_date     DATE,
  uploaded_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (delivery_boy_id) REFERENCES delivery_boys(id) ON DELETE CASCADE
);

-- ── OTP STORE ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS otp_store (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  mobile          VARCHAR(15)  NOT NULL,
  otp_code        VARCHAR(10)  NOT NULL,
  purpose         ENUM('register','forgot_password','login') DEFAULT 'login',
  expires_at      DATETIME     NOT NULL,
  used            TINYINT(1)   DEFAULT 0,
  created_at      DATETIME     DEFAULT CURRENT_TIMESTAMP
);

-- ── ORDERS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  order_number    VARCHAR(20)  UNIQUE NOT NULL,   -- e.g. KRV9823
  delivery_boy_id INT,
  customer_name   VARCHAR(120),
  customer_phone  VARCHAR(15),
  pickup_address  VARCHAR(300) NOT NULL,
  drop_address    VARCHAR(300) NOT NULL,
  pickup_lat      DECIMAL(10,7),
  pickup_lng      DECIMAL(10,7),
  drop_lat        DECIMAL(10,7),
  drop_lng        DECIMAL(10,7),
  items           TEXT,                            -- JSON string
  item_count      INT          DEFAULT 1,
  distance_km     DECIMAL(6,2),
  estimated_time  VARCHAR(20),
  base_earn       DECIMAL(8,2) DEFAULT 0.00,
  bonus_earn      DECIMAL(8,2) DEFAULT 0.00,
  tip             DECIMAL(8,2) DEFAULT 0.00,
  total_earn      DECIMAL(8,2) DEFAULT 0.00,
  otp_code        VARCHAR(10),
  status          ENUM('new','assigned','picked','delivered','cancelled') DEFAULT 'new',
  assigned_at     DATETIME,
  picked_at       DATETIME,
  delivered_at    DATETIME,
  cancelled_at    DATETIME,
  cancel_reason   VARCHAR(255),
  created_at      DATETIME     DEFAULT CURRENT_TIMESTAMP
);

-- ── EARNINGS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS earnings (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  delivery_boy_id INT NOT NULL,
  order_id        INT,
  earn_type       ENUM('delivery','bonus','tip','penalty','payout') NOT NULL,
  amount          DECIMAL(10,2) NOT NULL,
  description     VARCHAR(255),
  earn_date       DATE         NOT NULL,
  created_at      DATETIME     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (delivery_boy_id) REFERENCES delivery_boys(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id)        REFERENCES orders(id) ON DELETE SET NULL
);

-- ── PAYOUTS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payouts (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  delivery_boy_id INT NOT NULL,
  amount          DECIMAL(10,2) NOT NULL,
  period_start    DATE         NOT NULL,
  period_end      DATE         NOT NULL,
  status          ENUM('pending','processing','paid','failed') DEFAULT 'pending',
  utr_number      VARCHAR(50),
  paid_at         DATETIME,
  created_at      DATETIME     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (delivery_boy_id) REFERENCES delivery_boys(id) ON DELETE CASCADE
);

-- ── RATINGS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ratings (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  delivery_boy_id INT NOT NULL,
  order_id        INT NOT NULL,
  stars           TINYINT      NOT NULL CHECK (stars BETWEEN 1 AND 5),
  review          TEXT,
  rated_at        DATETIME     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (delivery_boy_id) REFERENCES delivery_boys(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id)        REFERENCES orders(id) ON DELETE CASCADE
);

-- ── NOTIFICATIONS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  delivery_boy_id INT NOT NULL,
  title           VARCHAR(150) NOT NULL,
  body            TEXT,
  notif_type      ENUM('order','payment','system','alert') DEFAULT 'system',
  is_read         TINYINT(1)   DEFAULT 0,
  created_at      DATETIME     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (delivery_boy_id) REFERENCES delivery_boys(id) ON DELETE CASCADE
);

-- ── LOCATION LOGS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS location_logs (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  delivery_boy_id INT NOT NULL,
  order_id        INT,
  latitude        DECIMAL(10,7) NOT NULL,
  longitude       DECIMAL(10,7) NOT NULL,
  logged_at       DATETIME     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (delivery_boy_id) REFERENCES delivery_boys(id) ON DELETE CASCADE
);

-- ── SAMPLE DATA ────────────────────────────────────────────
INSERT INTO delivery_boys
  (first_name,last_name,email,mobile,password_hash,city,dob,partner_id,status,is_online,rating,total_deliveries)
VALUES
  ('Ravi','Kumar','ravi@example.com','+919876543210',
   'pbkdf2:sha256:demo_hash','Vijayawada','1997-05-12','DB-2025-001','active',1,4.87,420),
  ('Suresh','Babu','suresh@example.com','+919012345678',
   'pbkdf2:sha256:demo_hash','Guntur','1999-08-20','DB-2025-002','active',0,4.60,218);

INSERT INTO vehicles (delivery_boy_id,vehicle_type,brand_model,reg_number,year,color)
VALUES (1,'scooter','Honda Activa 6G','AP39BZ4521',2022,'Pearl White');

INSERT INTO orders
  (order_number,delivery_boy_id,customer_name,customer_phone,
   pickup_address,drop_address,items,item_count,distance_km,estimated_time,
   base_earn,total_earn,otp_code,status,assigned_at)
VALUES
  ('KRV9823',1,'Priya S.','+919876543210',
   'Andhra Snacks Hub, MG Road','Flat 12, Sri Nagar Colony, Patamata',
   '[{"name":"Pani Puri","qty":2},{"name":"Samosa","qty":1}]',3,1.2,'~6 min',
   38.00,38.00,'4821','picked',NOW()),
  ('KRV9822',1,'Arjun R.','+919123456789',
   'Pizza Planet, Governorpet','H.No 8-3-14, Labbipet',
   '[{"name":"Margherita Pizza","qty":1},{"name":"Fries","qty":1}]',2,3.8,'~22 min',
   55.00,55.00,'7362','delivered',NOW());
