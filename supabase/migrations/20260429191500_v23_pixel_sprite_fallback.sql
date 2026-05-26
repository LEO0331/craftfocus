-- CraftFocus V2.3
-- Persist compact pixel sprite payloads for custom listings and backfill existing rows.

alter table public.craft_posts
  add column if not exists pixel_palette jsonb,
  add column if not exists pixel_grid text[];

comment on column public.craft_posts.pixel_palette is 'V2.3 fallback palette map used when image URLs are unavailable.';
comment on column public.craft_posts.pixel_grid is 'V2.3 fallback 8x8 pixel grid used when image URLs are unavailable.';

create or replace function public.v23_is_valid_pixel_grid(grid text[])
returns boolean
language plpgsql
immutable
as $$
declare
  row_text text;
begin
  if grid is null then
    return true;
  end if;

  if array_length(grid, 1) <> 8 then
    return false;
  end if;

  foreach row_text in array grid loop
    if char_length(row_text) <> 8 then
      return false;
    end if;
  end loop;

  return true;
end;
$$;

alter table public.craft_posts
  drop constraint if exists craft_posts_pixel_grid_shape;
alter table public.craft_posts
  add constraint craft_posts_pixel_grid_shape
  check (public.v23_is_valid_pixel_grid(pixel_grid));

create or replace function public.v23_seed_pixel_grid(seed_text text)
returns text[]
language plpgsql
immutable
as $$
declare
  rows text[] := array[]::text[];
  row_text text;
  token text;
  nibble text;
begin
  for y in 0..7 loop
    row_text := '';
    for x in 0..7 loop
      nibble := substr(md5(coalesce(seed_text, '') || ':' || x::text || ':' || y::text), 1, 1);
      token := case
        when nibble in ('0', '1') then 'a'
        when nibble in ('2', '3') then 'b'
        when nibble in ('4', '5') then 'c'
        when nibble = '6' then 'd'
        else '.'
      end;
      row_text := row_text || token;
    end loop;
    rows := array_append(rows, row_text);
  end loop;

  return rows;
end;
$$;

update public.craft_posts cp
set
  pixel_palette = coalesce(
    cp.pixel_palette,
    '{".":"#00000000","a":"#4E79A7","b":"#E15759","c":"#F28E2B","d":"#76B7B2"}'::jsonb
  ),
  pixel_grid = coalesce(cp.pixel_grid, public.v23_seed_pixel_grid(cp.id::text || ':' || coalesce(cp.title, 'listing')))
where cp.listing_type = 'custom'
  and (cp.pixel_palette is null or cp.pixel_grid is null);
