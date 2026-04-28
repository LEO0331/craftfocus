insert into public.item_catalog (id, name, category, required_progress)
values
  ('leather_wallet', 'Leather Wallet', 'leather', 100),
  ('sewing_kit', 'Sewing Kit', 'sewing', 100),
  ('fabric_roll', 'Fabric Roll', 'sewing', 100),
  ('dumbbell', 'Dumbbell', 'gym', 100),
  ('yoga_mat', 'Yoga Mat', 'gym', 100),
  ('study_desk', 'Study Desk', 'study', 100),
  ('bookshelf', 'Bookshelf', 'study', 100),
  ('desk_lamp', 'Desk Lamp', 'study', 100),
  ('work_desk', 'Work Desk', 'work', 100),
  ('plant', 'Plant', 'craft', 100)
on conflict (id) do update
set
  name = excluded.name,
  category = excluded.category,
  required_progress = excluded.required_progress;
