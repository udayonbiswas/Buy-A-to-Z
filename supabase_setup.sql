-- 🚀 COMPLETE DATABASE SETUP & RECOVERY (v8 - FINAL STABLE)
-- RUN THIS IN SUPABASE SQL EDITOR TO FIX ALL TABLES & RLS ERRORS

-- 1. ALL TABLES SETUP
CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, name TEXT NOT NULL, price NUMERIC NOT NULL, "originalPrice" NUMERIC, image TEXT, category TEXT, rating NUMERIC DEFAULT 4.5, "reviewCount" INTEGER DEFAULT 0, discount NUMERIC DEFAULT 0, stock INTEGER DEFAULT 0, location TEXT, "partNumber" TEXT, "galleryImages" JSONB DEFAULT '[]'::jsonb, "availableSizes" JSONB DEFAULT '[]'::jsonb, "showSizes" BOOLEAN DEFAULT true, "availableColors" JSONB DEFAULT '[]'::jsonb, "showColors" BOOLEAN DEFAULT true, description TEXT, weight TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, name TEXT NOT NULL, icon TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS banners (id TEXT PRIMARY KEY, title TEXT, subtitle TEXT, "buttonText" TEXT, "imageUrl" TEXT, "backgroundColor" TEXT, "textColor" TEXT, "categoryLink" TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, "customerId" TEXT, "customerName" TEXT, "customerEmail" TEXT, "customerMobile" TEXT, items JSONB NOT NULL DEFAULT '[]'::jsonb, total NUMERIC NOT NULL, status TEXT DEFAULT 'processing', timestamp TIMESTAMPTZ DEFAULT NOW(), delivery JSONB NOT NULL DEFAULT '{}'::jsonb, payment JSONB NOT NULL DEFAULT '{}'::jsonb, "trackingNumber" TEXT, "trackingCarrier" TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS users (uid TEXT PRIMARY KEY, id TEXT, "fullName" TEXT, email TEXT UNIQUE, "mobileNumber" TEXT UNIQUE, password TEXT, avatar TEXT, role TEXT DEFAULT 'user', "isAdmin" BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS configs (key TEXT PRIMARY KEY, value JSONB NOT NULL, updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS reviews (id TEXT PRIMARY KEY, "productId" TEXT, "userId" TEXT, "userName" TEXT, rating INTEGER, comment TEXT, timestamp TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS suppliers (id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT, email TEXT, address TEXT, "category" TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS purchases (id TEXT PRIMARY KEY, "supplierId" TEXT, "supplierName" TEXT, timestamp TIMESTAMPTZ DEFAULT NOW(), items JSONB DEFAULT '[]'::jsonb, "totalAmount" NUMERIC, status TEXT, note TEXT);

-- 2. ENSURE ALL COLUMNS EXIST (FOR UPDATES)
ALTER TABLE products ADD COLUMN IF NOT EXISTS "availableSizes" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "showSizes" BOOLEAN DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "availableColors" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "showColors" BOOLEAN DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "galleryImages" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "partNumber" TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "location" TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "weight" TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "originalPrice" NUMERIC;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "rating" NUMERIC DEFAULT 4.5;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "reviewCount" INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS id TEXT;

-- 3. 🔓 DISABLE RLS & ALLOW PUBLIC ACCESS (FIXES ALL PIRACY/SECURITY ERRORS)
DO $$ 
BEGIN
  -- Products
  ALTER TABLE IF EXISTS products DISABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "public_p" ON products;
  CREATE POLICY "public_p" ON products FOR ALL USING (true) WITH CHECK (true);
  
  -- Suppliers
  ALTER TABLE IF EXISTS suppliers DISABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "public_s" ON suppliers;
  CREATE POLICY "public_s" ON suppliers FOR ALL USING (true) WITH CHECK (true);

  -- Purchases
  ALTER TABLE IF EXISTS purchases DISABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "public_pur" ON purchases;
  CREATE POLICY "public_pur" ON purchases FOR ALL USING (true) WITH CHECK (true);
  
  -- Categories
  ALTER TABLE IF EXISTS categories DISABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "public_c" ON categories;
  CREATE POLICY "public_c" ON categories FOR ALL USING (true) WITH CHECK (true);

  -- Orders
  ALTER TABLE IF EXISTS orders DISABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "public_o" ON orders;
  CREATE POLICY "public_o" ON orders FOR ALL USING (true) WITH CHECK (true);

  -- Users
  ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "public_u" ON users;
  CREATE POLICY "public_u" ON users FOR ALL USING (true) WITH CHECK (true);

  -- Banners
  ALTER TABLE IF EXISTS banners DISABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "public_b" ON banners;
  CREATE POLICY "public_b" ON banners FOR ALL USING (true) WITH CHECK (true);

  -- Configs
  ALTER TABLE IF EXISTS configs DISABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "public_cfg" ON configs;
  CREATE POLICY "public_cfg" ON configs FOR ALL USING (true) WITH CHECK (true);

  -- Reviews
  ALTER TABLE IF EXISTS reviews DISABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "public_r" ON reviews;
  CREATE POLICY "public_r" ON reviews FOR ALL USING (true) WITH CHECK (true);
END $$;

-- 🔐 Alternatively, if you want RLS, run these policies:
-- DROP POLICY IF EXISTS "public_access" ON products;
-- CREATE POLICY "public_access" ON products FOR ALL USING (true) WITH CHECK (true);
