-- Imagem (avatar) dos itens. Enquanto o item não tem imagem cadastrada, a interface
-- mostra um avatar padrão por tipo. O admin preenche o campo no catálogo de itens.

alter table public.items
  add column if not exists image_url text
  check (image_url is null or (length(image_url) <= 500 and (image_url like '/%' or image_url like 'https://%')));
