-- 1. Remove personal name from users table (GDPR compliance)
ALTER TABLE public.users DROP COLUMN IF EXISTS name;

-- 2. Create trigger function for new suppliers
CREATE OR REPLACE FUNCTION public.handle_new_supplier()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_partner_id uuid;
  company_name text;
BEGIN
  -- Get company name from metadata, fallback to email prefix
  company_name := COALESCE(
    new.raw_user_meta_data ->> 'company_name',
    split_part(new.email, '@', 1)
  );
  
  -- Create partner record (company data only)
  INSERT INTO public.partners (name, email, partner_type)
  VALUES (company_name, new.email, 'supplier')
  RETURNING id INTO new_partner_id;
  
  -- Create user record (minimal linking data)
  INSERT INTO public.users (auth_id, email, partner_id)
  VALUES (new.id, new.email, new_partner_id);
  
  RETURN new;
END;
$$;

-- 3. Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_supplier();

-- 4. RLS policies for users table
CREATE POLICY "Users can view own record" ON public.users
  FOR SELECT USING (auth_id = auth.uid());

CREATE POLICY "Users can update own record" ON public.users
  FOR UPDATE USING (auth_id = auth.uid());

-- 5. RLS policies for partners table
CREATE POLICY "Partners can view own record" ON public.partners
  FOR SELECT USING (
    id IN (SELECT partner_id FROM public.users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Partners can update own record" ON public.partners
  FOR UPDATE USING (
    id IN (SELECT partner_id FROM public.users WHERE auth_id = auth.uid())
  );