-- Fix RLS para simulations
DROP POLICY IF EXISTS "simulations_insert" ON simulations;
DROP POLICY IF EXISTS "simulations_update" ON simulations;
DROP POLICY IF EXISTS "simulations_delete" ON simulations;
CREATE POLICY "simulations_insert" ON simulations FOR INSERT TO authenticated WITH CHECK (consultant_id = current_consultant_id());
CREATE POLICY "simulations_update" ON simulations FOR UPDATE TO authenticated USING (consultant_id = current_consultant_id()) WITH CHECK (consultant_id = current_consultant_id());
CREATE POLICY "simulations_delete" ON simulations FOR DELETE TO authenticated USING (consultant_id = current_consultant_id() AND is_current_user_admin());

-- Fix RLS para flip_calculations
DROP POLICY IF EXISTS "flip_calculations_insert" ON flip_calculations;
DROP POLICY IF EXISTS "flip_calculations_update" ON flip_calculations;
DROP POLICY IF EXISTS "flip_calculations_delete" ON flip_calculations;
CREATE POLICY "flip_calculations_insert" ON flip_calculations FOR INSERT TO authenticated WITH CHECK (consultant_id = current_consultant_id());
CREATE POLICY "flip_calculations_update" ON flip_calculations FOR UPDATE TO authenticated USING (consultant_id = current_consultant_id()) WITH CHECK (consultant_id = current_consultant_id());
CREATE POLICY "flip_calculations_delete" ON flip_calculations FOR DELETE TO authenticated USING (consultant_id = current_consultant_id() AND is_current_user_admin());

-- Fix RLS para commissions (falta I, U, D)
DROP POLICY IF EXISTS "commissions_insert" ON commissions;
DROP POLICY IF EXISTS "commissions_update" ON commissions;
DROP POLICY IF EXISTS "commissions_delete" ON commissions;
CREATE POLICY "commissions_insert" ON commissions FOR INSERT TO authenticated WITH CHECK (consultant_id = current_consultant_id());
CREATE POLICY "commissions_update" ON commissions FOR UPDATE TO authenticated USING (consultant_id = current_consultant_id()) WITH CHECK (consultant_id = current_consultant_id());
CREATE POLICY "commissions_delete" ON commissions FOR DELETE TO authenticated USING (consultant_id = current_consultant_id() AND is_current_user_admin());

SELECT 'All RLS fixed' as status;