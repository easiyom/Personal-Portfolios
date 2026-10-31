-- Run once in the Supabase SQL Editor as the project owner.
create table public.portfolio_admins (user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.portfolio_admins enable row level security;
revoke all on public.portfolio_admins from anon, authenticated;
create function public.is_portfolio_admin() returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.portfolio_admins where user_id = auth.uid());
$$;
revoke all on function public.is_portfolio_admin() from public;
grant execute on function public.is_portfolio_admin() to anon, authenticated;
create table public.projects (
 id text primary key check(id ~ '^[a-z0-9-]{1,64}$'),
 data jsonb not null check(jsonb_typeof(data) = 'object'),
 sort_order integer not null default 0,
 published boolean not null default false,
 updated_at timestamptz not null default now()
);
alter table public.projects enable row level security;
grant select on public.projects to anon, authenticated;
grant insert, update, delete on public.projects to authenticated;
create policy "Visitors read published projects" on public.projects for select using (published or public.is_portfolio_admin());
create policy "Admins insert" on public.projects for insert to authenticated with check (public.is_portfolio_admin());
create policy "Admins update" on public.projects for update to authenticated using (public.is_portfolio_admin()) with check (public.is_portfolio_admin());
create policy "Admins delete" on public.projects for delete to authenticated using (public.is_portfolio_admin());
create function public.project_updated_at() returns trigger language plpgsql set search_path = '' as $$ begin new.updated_at = clock_timestamp(); return new; end; $$;
create trigger projects_updated before update on public.projects for each row execute function public.project_updated_at();
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('project-images','project-images',true,5242880,array['image/jpeg','image/png','image/webp','image/avif']);
create policy "Admin image upload" on storage.objects for insert to authenticated with check (bucket_id='project-images' and public.is_portfolio_admin());
create policy "Admin image delete" on storage.objects for delete to authenticated using (bucket_id='project-images' and public.is_portfolio_admin());
-- Public bucket images are accessible by URL. Draft text is private, uploaded images are public.
-- After creating your user in Authentication > Users, run separately:
-- insert into public.portfolio_admins(user_id) values ('YOUR_AUTH_USER_UUID');
