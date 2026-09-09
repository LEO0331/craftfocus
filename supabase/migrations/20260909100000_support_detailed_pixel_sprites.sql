-- New previews persist at 16x16 for clearer collectible thumbnails while
-- retaining legacy 8x8 rows.
create or replace function public.v23_is_valid_pixel_grid(grid text[])
returns boolean
language plpgsql
immutable
as $$
declare
  row_text text;
  grid_size integer;
begin
  if grid is null then return true; end if;
  grid_size := array_length(grid, 1);
  if grid_size not in (8, 16) then return false; end if;
  foreach row_text in array grid loop
    if char_length(row_text) <> grid_size then return false; end if;
  end loop;
  return true;
end;
$$;

comment on function public.v23_is_valid_pixel_grid(text[]) is
  'Accepts legacy 8x8 and detailed 16x16 square pixel sprites.';
