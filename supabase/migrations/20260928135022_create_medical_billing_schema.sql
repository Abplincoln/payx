/*
# Create Medical Billing Database Schema

## Overview
This migration creates the core database schema for the BotChain Medical Billing dApp.
It stores medical bills, payment records, providers, and patients off-chain as a
complement to the on-chain MedicalBilling smart contract. The app currently uses
mock data hardcoded in src/data/mockData.ts — this migration replaces that with a
real Supabase backend.

## New Tables

### 1. `providers`
Stores healthcare providers who create and manage bills.
- `id` — auto-incrementing integer primary key (e.g. 1 → "PROV-001")
- `name` — provider display name (e.g. "Dr. Sarah Chen")
- `wallet_address` — BotChain wallet address (text, unique)
- `facility` — facility/clinic name
- `created_at` — timestamp

### 2. `patients`
Stores patients who receive bills and make payments.
- `id` — auto-incrementing integer primary key (e.g. 1 → "PAT-001")
- `reference_id` — human-readable patient reference (unique, e.g. "PAT-001")
- `wallet_address` — BotChain wallet address (text, unique)
- `name` — patient display name
- `created_at` — timestamp

### 3. `bills`
Stores medical bills created by providers for patients.
- `id` — auto-incrementing integer primary key
- `bill_number` — human-readable bill ID (unique, e.g. "PX-0001")
- `patient_id` — FK to patients.id (ON DELETE CASCADE)
- `provider_id` — FK to providers.id (ON DELETE CASCADE)
- `service_description` — description of the medical service
- `amount_bot` — amount in BOT (numeric, stored as BOT units)
- `due_date` — date the bill is due (date type)
- `created_date` — date the bill was created
- `payment_date` — date the bill was paid (nullable)
- `status` — enum: pending, paid, cancelled, overdue (default: pending)
- `transaction_hash` — on-chain payment transaction hash (nullable)
- `created_at` — timestamp

### 4. `payments`
Stores payment records for bills that have been paid on-chain.
- `id` — auto-incrementing integer primary key
- `payment_number` — human-readable payment ID (unique, e.g. "PYMT-001")
- `bill_id` — FK to bills.id (ON DELETE CASCADE)
- `patient_wallet_address` — patient's wallet at time of payment
- `provider_wallet_address` — provider's wallet at time of payment
- `amount_bot` — amount paid in BOT
- `payment_date` — date of payment
- `transaction_hash` — on-chain transaction hash
- `network` — blockchain network name (default: "BotChain Testnet")
- `created_at` — timestamp

## Security (Row Level Security)

This app does NOT currently have a sign-in / authentication screen — users select
a role (provider or patient) from the landing page to view a dashboard. There is
no Supabase auth flow. Therefore, all policies use `TO anon, authenticated` so
the anon-key frontend client can read and write data.

RLS is enabled on all four tables. CRUD policies are defined per table:
- SELECT, INSERT, UPDATE, DELETE — all open to anon + authenticated.

This is a single-tenant demo app where all data is intentionally shared/public.
When authentication is added in a future stage, these policies should be tightened
to scope by provider_id / patient_id ownership.

## Indexes
- `idx_bills_patient_id` — fast lookup of bills by patient
- `idx_bills_provider_id` — fast lookup of bills by provider
- `idx_bills_status` — filtering bills by status
- `idx_payments_bill_id` — fast lookup of payments by bill

## Important Notes
1. The `bill_status` enum type is created with IF NOT EXISTS via a DO block.
2. All foreign keys use ON DELETE CASCADE to maintain referential integrity.
3. Amounts are stored as numeric(18,8) to preserve precision for blockchain values.
4. The `bill_number` and `payment_number` columns are unique to prevent duplicates.
5. All CREATE TABLE statements use IF NOT EXISTS for idempotency.
*/

-- ─────────────────────────────────────────────────────────────────────
-- Enum type for bill status
-- ─────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE bill_status AS ENUM ('pending', 'paid', 'cancelled', 'overdue');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- providers
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS providers (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  wallet_address text NOT NULL UNIQUE,
  facility text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_providers" ON providers;
CREATE POLICY "anon_select_providers" ON providers
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_providers" ON providers;
CREATE POLICY "anon_insert_providers" ON providers
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_providers" ON providers;
CREATE POLICY "anon_update_providers" ON providers
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_providers" ON providers;
CREATE POLICY "anon_delete_providers" ON providers
  FOR DELETE TO anon, authenticated USING (true);

-- ─────────────────────────────────────────────────────────────────────
-- patients
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patients (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  reference_id text NOT NULL UNIQUE,
  wallet_address text NOT NULL UNIQUE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_patients" ON patients;
CREATE POLICY "anon_select_patients" ON patients
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_patients" ON patients;
CREATE POLICY "anon_insert_patients" ON patients
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_patients" ON patients;
CREATE POLICY "anon_update_patients" ON patients
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_patients" ON patients;
CREATE POLICY "anon_delete_patients" ON patients
  FOR DELETE TO anon, authenticated USING (true);

-- ─────────────────────────────────────────────────────────────────────
-- bills
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bills (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  bill_number text NOT NULL UNIQUE,
  patient_id bigint NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  provider_id bigint NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  service_description text NOT NULL,
  amount_bot numeric(18,8) NOT NULL,
  due_date date NOT NULL,
  created_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_date date,
  status bill_status NOT NULL DEFAULT 'pending',
  transaction_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_bills" ON bills;
CREATE POLICY "anon_select_bills" ON bills
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_bills" ON bills;
CREATE POLICY "anon_insert_bills" ON bills
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_bills" ON bills;
CREATE POLICY "anon_update_bills" ON bills
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_bills" ON bills;
CREATE POLICY "anon_delete_bills" ON bills
  FOR DELETE TO anon, authenticated USING (true);

-- ─────────────────────────────────────────────────────────────────────
-- payments
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  payment_number text NOT NULL UNIQUE,
  bill_id bigint NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  patient_wallet_address text NOT NULL,
  provider_wallet_address text NOT NULL,
  amount_bot numeric(18,8) NOT NULL,
  payment_date date NOT NULL,
  transaction_hash text NOT NULL,
  network text NOT NULL DEFAULT 'BotChain Testnet',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_payments" ON payments;
CREATE POLICY "anon_select_payments" ON payments
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_payments" ON payments;
CREATE POLICY "anon_insert_payments" ON payments
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_payments" ON payments;
CREATE POLICY "anon_update_payments" ON payments
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_payments" ON payments;
CREATE POLICY "anon_delete_payments" ON payments
  FOR DELETE TO anon, authenticated USING (true);

-- ─────────────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_bills_patient_id ON bills(patient_id);
CREATE INDEX IF NOT EXISTS idx_bills_provider_id ON bills(provider_id);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
CREATE INDEX IF NOT EXISTS idx_payments_bill_id ON payments(bill_id);
