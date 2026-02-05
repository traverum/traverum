-- Create the traverum-assets storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('traverum-assets', 'traverum-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for traverum-assets bucket

-- Allow authenticated users to upload files to their partner's folder
CREATE POLICY "Partners can upload to their folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'traverum-assets' 
  AND (storage.foldername(name))[1] = 'partners'
  AND (storage.foldername(name))[2] IN (
    SELECT partner_id::text FROM public.users WHERE auth_id = auth.uid()
  )
);

-- Allow authenticated users to update their own files
CREATE POLICY "Partners can update their files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'traverum-assets' 
  AND (storage.foldername(name))[1] = 'partners'
  AND (storage.foldername(name))[2] IN (
    SELECT partner_id::text FROM public.users WHERE auth_id = auth.uid()
  )
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Partners can delete their files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'traverum-assets' 
  AND (storage.foldername(name))[1] = 'partners'
  AND (storage.foldername(name))[2] IN (
    SELECT partner_id::text FROM public.users WHERE auth_id = auth.uid()
  )
);

-- Allow public read access to all files in the bucket
CREATE POLICY "Public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'traverum-assets');

-- Add RLS policies for the media table

-- Enable RLS on media table
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

-- Partners can view their own media
CREATE POLICY "Partners can view their media"
ON public.media
FOR SELECT
TO authenticated
USING (
  partner_id IN (
    SELECT partner_id FROM public.users WHERE auth_id = auth.uid()
  )
);

-- Partners can insert their own media
CREATE POLICY "Partners can insert their media"
ON public.media
FOR INSERT
TO authenticated
WITH CHECK (
  partner_id IN (
    SELECT partner_id FROM public.users WHERE auth_id = auth.uid()
  )
);

-- Partners can update their own media
CREATE POLICY "Partners can update their media"
ON public.media
FOR UPDATE
TO authenticated
USING (
  partner_id IN (
    SELECT partner_id FROM public.users WHERE auth_id = auth.uid()
  )
);

-- Partners can delete their own media
CREATE POLICY "Partners can delete their media"
ON public.media
FOR DELETE
TO authenticated
USING (
  partner_id IN (
    SELECT partner_id FROM public.users WHERE auth_id = auth.uid()
  )
);