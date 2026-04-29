insert into public.item_catalog (id, name, category, required_progress)
values
  ('wall_clock', 'Wall Clock', 'study', 100),
  ('bean_bag', 'Bean Bag', 'craft', 100),
  ('tool_box', 'Tool Box', 'work', 100),
  ('floor_rug', 'Floor Rug', 'study', 100),
  ('wall_frame', 'Wall Frame', 'craft', 100)
on conflict (id) do update
set
  name = excluded.name,
  category = excluded.category,
  required_progress = excluded.required_progress;
