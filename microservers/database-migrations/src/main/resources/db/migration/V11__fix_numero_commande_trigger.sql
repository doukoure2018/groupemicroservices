-- Fix: SUBSTRING FROM 13 returns '-0001' (with dash), causing duplicate keys
-- Correct index is 14 to extract just the numeric part '0001'
CREATE OR REPLACE FUNCTION generate_numero_commande()
RETURNS TRIGGER AS $$
DECLARE
    seq_num INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_commande FROM 14) AS INTEGER)), 0) + 1
    INTO seq_num
    FROM commandes
    WHERE DATE(created_at) = CURRENT_DATE;

    NEW.numero_commande := 'CMD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(seq_num::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Clean up any commandes with incorrect numero_commande (like CMD-YYYYMMDD-0000)
-- and reassign correct sequential numbers
DO $$
DECLARE
    rec RECORD;
    counter INTEGER := 1;
    current_date_str TEXT := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
BEGIN
    FOR rec IN
        SELECT commande_id FROM commandes
        WHERE DATE(created_at) = CURRENT_DATE
        ORDER BY commande_id ASC
    LOOP
        UPDATE commandes
        SET numero_commande = 'CMD-' || current_date_str || '-' || LPAD(counter::TEXT, 4, '0')
        WHERE commande_id = rec.commande_id;
        counter := counter + 1;
    END LOOP;
END $$;
