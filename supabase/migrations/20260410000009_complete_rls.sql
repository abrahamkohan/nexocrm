-- Complete RLS for ALL tables

-- agentes
DROP POLICY IF EXISTS "agentes_insert" ON agentes;
DROP POLICY IF EXISTS "agentes_update" ON agentes;
DROP POLICY IF EXISTS "agentes_delete" ON agentes;
CREATE POLICY "agentes_insert" ON agentes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "agentes_update" ON agentes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "agentes_delete" ON agentes FOR DELETE TO authenticated USING (true);

-- asset_usages
DROP POLICY IF EXISTS "asset_usages_update" ON asset_usages;
DROP POLICY IF EXISTS "asset_usages_delete" ON asset_usages;
CREATE POLICY "asset_usages_update" ON asset_usages FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- assets  
DROP POLICY IF EXISTS "assets_insert" ON assets;
DROP POLICY IF EXISTS "assets_update" ON assets;
DROP POLICY IF EXISTS "assets_delete" ON assets;
CREATE POLICY "assets_insert" ON assets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "assets_update" ON assets FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "assets_delete" ON assets FOR DELETE TO authenticated USING (true);

-- commission_clients
DROP POLICY IF EXISTS "commission_clients_insert" ON commission_clients;
DROP POLICY IF EXISTS "commission_clients_update" ON commission_clients;
DROP POLICY IF EXISTS "commission_clients_delete" ON commission_clients;
CREATE POLICY "commission_clients_insert" ON commission_clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "commission_clients_update" ON commission_clients FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "commission_clients_delete" ON commission_clients FOR DELETE TO authenticated USING (true);

-- commission_incomes
DROP POLICY IF EXISTS "commission_incomes_insert" ON commission_incomes;
DROP POLICY IF EXISTS "commission_incomes_update" ON commission_incomes;
DROP POLICY IF EXISTS "commission_incomes_delete" ON commission_incomes;
CREATE POLICY "commission_incomes_insert" ON commission_incomes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "commission_incomes_update" ON commission_incomes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "commission_incomes_delete" ON commission_incomes FOR DELETE TO authenticated USING (true);

-- commission_splits
DROP POLICY IF EXISTS "commission_splits_insert" ON commission_splits;
DROP POLICY IF EXISTS "commission_splits_update" ON commission_splits;
DROP POLICY IF EXISTS "commission_splits_delete" ON commission_splits;
CREATE POLICY "commission_splits_insert" ON commission_splits FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "commission_splits_update" ON commission_splits FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "commission_splits_delete" ON commission_splits FOR DELETE TO authenticated USING (true);

-- project_amenities
DROP POLICY IF EXISTS "project_amenities_insert" ON project_amenities;
DROP POLICY IF EXISTS "project_amenities_update" ON project_amenities;
DROP POLICY IF EXISTS "project_amenities_delete" ON project_amenities;
CREATE POLICY "project_amenities_insert" ON project_amenities FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "project_amenities_update" ON project_amenities FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "project_amenities_delete" ON project_amenities FOR DELETE TO authenticated USING (true);

-- profiles
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_delete" ON profiles;
CREATE POLICY "profiles_insert" ON profiles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "profiles_delete" ON profiles FOR DELETE TO authenticated USING (true);

-- financing_plans
DROP POLICY IF EXISTS "financing_plans_insert" ON financing_plans;
DROP POLICY IF EXISTS "financing_plans_update" ON financing_plans;
DROP POLICY IF EXISTS "financing_plans_delete" ON financing_plans;
CREATE POLICY "financing_plans_insert" ON financing_plans FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "financing_plans_update" ON financing_plans FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "financing_plans_delete" ON financing_plans FOR DELETE TO authenticated USING (true);

-- push_subscriptions
DROP POLICY IF EXISTS "push_subscriptions_insert" ON push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_update" ON push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_delete" ON push_subscriptions;
CREATE POLICY "push_subscriptions_insert" ON push_subscriptions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "push_subscriptions_update" ON push_subscriptions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "push_subscriptions_delete" ON push_subscriptions FOR DELETE TO authenticated USING (true);

SELECT 'All tables RLS complete' as status;