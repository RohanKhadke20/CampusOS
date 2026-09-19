-- Migration: 00003_payments_event_id.sql
-- Description: Add event_id, order_id, payment_id, amount columns to payments table and add webhook_events tracking table

ALTER TABLE payments ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE SET NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS order_id VARCHAR(100);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_id VARCHAR(100);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS amount INT;

-- Populate existing values
UPDATE payments SET order_id = razorpay_order_id WHERE order_id IS NULL AND razorpay_order_id IS NOT NULL;
UPDATE payments SET payment_id = razorpay_payment_id WHERE payment_id IS NULL AND razorpay_payment_id IS NOT NULL;
UPDATE payments SET amount = amount_cents WHERE amount IS NULL AND amount_cents IS NOT NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payments_event_id ON payments(event_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_id ON payments(payment_id);

-- Webhook events tracking table for idempotency
CREATE TABLE IF NOT EXISTS webhook_events (
    id VARCHAR(128) PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed_at ON webhook_events(processed_at);
