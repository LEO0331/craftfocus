-- Limit craft uploads to 10 new listings per user per day (UTC day window)

drop policy if exists "craft_posts_owner_insert" on public.craft_posts;

create policy "craft_posts_owner_insert" on public.craft_posts
for insert
with check (
  auth.uid() = user_id
  and (
    select count(*)
    from public.craft_posts cp
    where cp.user_id = auth.uid()
      and cp.created_at >= date_trunc('day', now())
      and cp.created_at < date_trunc('day', now()) + interval '1 day'
  ) < 10
);
