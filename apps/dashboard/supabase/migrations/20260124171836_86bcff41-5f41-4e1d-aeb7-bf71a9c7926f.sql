-- Allow suppliers to view their own experiences (any status)
CREATE POLICY "Suppliers can view own experiences"
  ON public.experiences
  FOR SELECT
  USING (
    partner_id IN (
      SELECT partner_id FROM public.users WHERE auth_id = auth.uid()
    )
  );

-- Allow suppliers to create experiences for their partner
CREATE POLICY "Suppliers can insert own experiences"
  ON public.experiences
  FOR INSERT
  WITH CHECK (
    partner_id IN (
      SELECT partner_id FROM public.users WHERE auth_id = auth.uid()
    )
  );

-- Allow suppliers to update their own experiences
CREATE POLICY "Suppliers can update own experiences"
  ON public.experiences
  FOR UPDATE
  USING (
    partner_id IN (
      SELECT partner_id FROM public.users WHERE auth_id = auth.uid()
    )
  );

-- Allow suppliers to delete their own experiences
CREATE POLICY "Suppliers can delete own experiences"
  ON public.experiences
  FOR DELETE
  USING (
    partner_id IN (
      SELECT partner_id FROM public.users WHERE auth_id = auth.uid()
    )
  );