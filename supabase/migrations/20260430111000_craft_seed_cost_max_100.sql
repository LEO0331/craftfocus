-- Restrict craft listing seed cost to 1..100

alter table public.craft_posts
  drop constraint if exists craft_posts_seed_cost_minmax;

alter table public.craft_posts
  add constraint craft_posts_seed_cost_minmax
  check (seed_cost between 1 and 100);
