-- ONLY for a fresh disposable PostgreSQL database, never a Supabase project.
do $$ begin
  if not exists(select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
  if not exists(select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
  if not exists(select 1 from pg_roles where rolname = 'service_role') then create role service_role bypassrls; end if;
end $$;
create schema auth;
create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}'::jsonb);
create function auth.uid() returns uuid language sql stable as
$$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
create function auth.role() returns text language sql stable as $$ select current_user::text $$;
grant usage on schema auth to authenticated,anon,service_role;
create schema storage;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid primary key,bucket_id text,name text);
create function storage.foldername(text) returns text[] language sql immutable as
$$ select string_to_array($1,'/') $$;
alter default privileges in schema public grant all on tables to authenticated,service_role;
alter default privileges in schema public grant usage on sequences to authenticated,service_role;
