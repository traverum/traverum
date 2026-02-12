-- Add DELETE policy for hotel_configs (was missing, causing delete property to fail)
CREATE POLICY "Partners can delete own hotel configs" ON public.hotel_configs
  FOR DELETE TO authenticated
  USING (partner_id IN (SELECT public.get_user_partner_ids()));
