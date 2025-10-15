-- Supabase Storage policies for bucket "proofs"
-- Run these statements in Supabase SQL editor

-- Ensure bucket exists (run once)
-- If you prefer, create the bucket via the Supabase UI.
insert into storage.buckets (id, name, public)
values ('proofs', 'proofs', true)
on conflict (id) do nothing;

-- Policies: allow public read and authenticated uploads
-- Note: Public read is optional. Remove if you prefer signed URLs only.
drop policy if exists "Public read for proofs" on storage.objects;
create policy "Public read for proofs"
on storage.objects for select
using (bucket_id = 'proofs');

drop policy if exists "Authenticated upload to proofs" on storage.objects;
create policy "Authenticated upload to proofs"
on storage.objects for insert to authenticated
with check (bucket_id = 'proofs');

-- Optional: allow authenticated users to update their own objects
drop policy if exists "Authenticated update own proofs" on storage.objects;
create policy "Authenticated update own proofs"
on storage.objects for update to authenticated
using (bucket_id = 'proofs' and owner = auth.uid())
with check (bucket_id = 'proofs' and owner = auth.uid());

-- Optional: allow authenticated users to delete their own objects
drop policy if exists "Authenticated delete own proofs" on storage.objects;
create policy "Authenticated delete own proofs"
on storage.objects for delete to authenticated
using (bucket_id = 'proofs' and owner = auth.uid());

-- If you are not using Supabase Auth on the frontend and need temporary uploads
-- from the client, you can replace "to authenticated" with "to anon" above.
-- This is not recommended for production; prefer server-side uploads or signed URLs.