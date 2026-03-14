-- ============================================
-- GlobalRx Orders Table Setup
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  shipping NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT NOT NULL DEFAULT 'khqr',
  payment_proof TEXT,
  payment_status TEXT NOT NULL DEFAULT 'Pending',
  status TEXT NOT NULL DEFAULT 'Confirmed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quick patches to add the above to existing tables without errors
DO $$
BEGIN
    BEGIN
        ALTER TABLE orders ADD COLUMN payment_proof TEXT;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE orders ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'Pending';
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
END $$;

-- Enable Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own orders
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own orders
CREATE POLICY "Users can insert own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Admin can view ALL orders (using email check)
CREATE POLICY "Admin can view all orders" ON orders
  FOR SELECT USING (
    auth.jwt() ->> 'email' = 'sanvansambath222@gmail.com'
    OR auth.jwt() ->> 'email' = 'admin@battopharmacy.com'
  );

-- Create index for faster queries
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- ============================================
-- Prescriptions Table
-- ============================================

CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  patient_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  notes TEXT,
  file_names TEXT[] DEFAULT '{}',
  file_data JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own prescriptions
CREATE POLICY "Users can view own prescriptions" ON prescriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own prescriptions
CREATE POLICY "Users can insert own prescriptions" ON prescriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin can view ALL prescriptions
CREATE POLICY "Admin can view all prescriptions" ON prescriptions
  FOR SELECT USING (
    auth.jwt() ->> 'email' = 'sanvansambath222@gmail.com'
    OR auth.jwt() ->> 'email' = 'admin@battopharmacy.com'
  );

-- Admin can update prescriptions (change status)
CREATE POLICY "Admin can update prescriptions" ON prescriptions
  FOR UPDATE USING (
    auth.jwt() ->> 'email' = 'sanvansambath222@gmail.com'
    OR auth.jwt() ->> 'email' = 'admin@battopharmacy.com'
  );

CREATE INDEX idx_prescriptions_user_id ON prescriptions(user_id);
CREATE INDEX idx_prescriptions_created_at ON prescriptions(created_at DESC);

-- ============================================
-- Products Table
-- ============================================

CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT,
  image TEXT,
  strength TEXT,
  dosage_form TEXT,
  pack_size TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  original_price NUMERIC,
  discount INTEGER DEFAULT 0,
  in_stock BOOLEAN DEFAULT TRUE,
  prescription_required BOOLEAN DEFAULT FALSE,
  rating NUMERIC DEFAULT 0,
  reviews INTEGER DEFAULT 0,
  description TEXT,
  ingredients TEXT[],
  usage TEXT,
  warnings TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Everyone can view products
CREATE POLICY "Public can view products" ON products
  FOR SELECT USING (true);

-- Admin can manage products
CREATE POLICY "Admin can manage products" ON products
  FOR ALL USING (
    auth.jwt() ->> 'email' = 'sanvansambath222@gmail.com'
    OR auth.jwt() ->> 'email' = 'admin@battopharmacy.com'
  );

-- Done!
