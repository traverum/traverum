-- Enable RLS on experience_sessions
ALTER TABLE experience_sessions ENABLE ROW LEVEL SECURITY;

-- Suppliers can view sessions for their experiences
CREATE POLICY "Suppliers can view own experience sessions"
  ON experience_sessions FOR SELECT
  USING (experience_id IN (
    SELECT id FROM experiences WHERE partner_id IN (
      SELECT partner_id FROM users WHERE auth_id = auth.uid()
    )
  ));

-- Suppliers can insert sessions for their experiences
CREATE POLICY "Suppliers can insert own experience sessions"
  ON experience_sessions FOR INSERT
  WITH CHECK (experience_id IN (
    SELECT id FROM experiences WHERE partner_id IN (
      SELECT partner_id FROM users WHERE auth_id = auth.uid()
    )
  ));

-- Suppliers can update their sessions
CREATE POLICY "Suppliers can update own experience sessions"
  ON experience_sessions FOR UPDATE
  USING (experience_id IN (
    SELECT id FROM experiences WHERE partner_id IN (
      SELECT partner_id FROM users WHERE auth_id = auth.uid()
    )
  ));

-- Suppliers can delete their sessions
CREATE POLICY "Suppliers can delete own experience sessions"
  ON experience_sessions FOR DELETE
  USING (experience_id IN (
    SELECT id FROM experiences WHERE partner_id IN (
      SELECT partner_id FROM users WHERE auth_id = auth.uid()
    )
  ));