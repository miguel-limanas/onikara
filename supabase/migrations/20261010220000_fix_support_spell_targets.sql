-- Magias de suporte sem dano devem mirar o próprio conjurador.
-- O valor padrão da coluna ('enemy') foi aplicado por engano no seed inicial.
update public.spells
set target_type = 'self'
where id in ('water-veil', 'stone-guard')
  and target_type = 'enemy';
