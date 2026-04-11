-- Fix typologies RLS - agregar INSERT, UPDATE, DELETE
ALTER TABLE typologies ENABLE ROW LEVEL SECURITY;

-- INSERT - solo usuarios autenticados del mismo tenant
DROP POLICY IF EXISTS "typologies_insert" ON typologies;
CREATE POLICY "typologies_insert" ON typologies
  FOR INSERT TO authenticated
  WITH CHECK (consultant_id = current_consultant_id());

-- UPDATE - solo usuarios del mismo tenant
DROP POLICY IF EXISTS "typology_update" ON typologies;
CREATE POLICY "typology_update" ON typologies
  FOR UPDATE TO authenticated
  USING (consultant_id = current_consultant_id())
  WITH CHECK (consultant_id = current_consultant_id());

-- DELETE - solo admins del mismo tenant
DROP POLICY IF EXISTS "typology_delete" ON typologies;
CREATE POLICY "typology_delete" ON typologies
  FOR DELETE TO authenticated
  USING (consultant_id = current_consultant_id() AND is_current_user_admin());

SELECT 'Typologies RLS fixed' as status;