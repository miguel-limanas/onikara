update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"app_role": "admin"}'::jsonb
where email = 'leonardo@onikara.local';
