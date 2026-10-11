-- Imagem (avatar) das magias. Sem imagem cadastrada, a interface mostra um avatar
-- padrão colorido pelo elemento da magia. O admin preenche no catálogo de magias.

alter table public.spells
  add column if not exists image_url text
  check (image_url is null or (length(image_url) <= 500 and (image_url like '/%' or image_url like 'https://%')));
