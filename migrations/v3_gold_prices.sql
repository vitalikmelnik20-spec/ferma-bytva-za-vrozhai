-- v3: All rings and talismans use gold only (move price → price_gold)
UPDATE items
SET price_gold = price, price = 0
WHERE category IN ('ring', 'talisman') AND price > 0 AND price_gold = 0;
