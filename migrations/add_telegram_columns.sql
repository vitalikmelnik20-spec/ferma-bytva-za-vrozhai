-- Migration: add Telegram auth columns to players table
ALTER TABLE players ADD COLUMN IF NOT EXISTS telegram_id BIGINT UNIQUE;
ALTER TABLE players ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(100);
