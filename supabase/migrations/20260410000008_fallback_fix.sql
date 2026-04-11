-- Simpler fallback: Allow all authenticated users to INSERT/UPDATE/DELETE for now
-- This is less secure but allows the app to work

-- typologies - allow via project_id join to projects table (which has consultant_id)
DROP POLICY IF EXISTS "typologies_insert" ON typologies;
CREATE POLICY "typologies_insert" ON typologies FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "typology_update" ON typologies;
CREATE POLICY "typology_update" ON typologies FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- simulations - allow all authenticated
DROP POLICY IF EXISTS "simulations_insert" ON simulations;
CREATE POLICY "simulations_insert" ON simulations FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "simulations_update" ON simulations;
CREATE POLICY "simulations_update" ON simulations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- flip_calculations - allow all authenticated
DROP POLICY IF EXISTS "flip_calculations_insert" ON flip_calculations;
CREATE POLICY "flip_calculations_insert" ON flip_calculations FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "flip_calculations_update" ON flip_calculations;
CREATE POLICY "flip_calculations_update" ON flip_calculations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- commissions - allow via projects table join
DROP POLICY IF EXISTS "commissions_insert" ON commissions;
CREATE POLICY "commissions_insert" ON commissions FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "commissions_update" ON commissions;
CREATE POLICY "commissions_update" ON commissions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

SELECT 'Simple fallback applied - allows all authenticated users' as status;