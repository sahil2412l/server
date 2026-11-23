-- Payment Service Database Schema (Server 3)
-- Strict ACID Compliance, Double-Entry Financial Ledger, & Webhook Audit

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Customer Accounts
CREATE TABLE IF NOT EXISTS customer_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    balance_cents BIGINT DEFAULT 0 CHECK (balance_cents >= 0),
    is_frozen BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Double-Entry Ledger (Immutable Financial Records)
CREATE TABLE IF NOT EXISTS financial_ledger (
    entry_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id VARCHAR(128) UNIQUE NOT NULL,
    account_id UUID REFERENCES customer_accounts(id),
    entry_type VARCHAR(10) CHECK (entry_type IN ('DEBIT', 'CREDIT')),
    amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
    currency VARCHAR(3) DEFAULT 'USD',
    description TEXT NOT NULL,
    balance_after_cents BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
    invoice_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(64) UNIQUE NOT NULL,
    account_id UUID REFERENCES customer_accounts(id),
    amount_cents BIGINT NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(30) DEFAULT 'ISSUED',
    pdf_path VARCHAR(512),
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP WITH TIME ZONE
);

-- Verified Webhook Audit Log (HMAC-SHA256 verified)
CREATE TABLE IF NOT EXISTS webhook_events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gateway_name VARCHAR(50) NOT NULL,
    external_event_id VARCHAR(128) UNIQUE NOT NULL,
    payload JSONB NOT NULL,
    signature_verified BOOLEAN DEFAULT TRUE,
    processed_status VARCHAR(50) DEFAULT 'PROCESSED',
    received_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance & Audit Indexes
CREATE INDEX IF NOT EXISTS idx_ledger_tx ON financial_ledger(transaction_id);
CREATE INDEX IF NOT EXISTS idx_ledger_account ON financial_ledger(account_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_webhook_ext_id ON webhook_events(external_event_id);
