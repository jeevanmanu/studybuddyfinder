-- Add storage policies for study-documents bucket
-- The bucket already exists, just need to add proper RLS policies

-- Policy: Users can upload their own documents (files stored in user_id folder)
CREATE POLICY "Users can upload their own study documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'study-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can view their own documents
CREATE POLICY "Users can view their own study documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'study-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can update their own documents
CREATE POLICY "Users can update their own study documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'study-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own documents
CREATE POLICY "Users can delete their own study documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'study-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);