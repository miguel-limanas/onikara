-- Avatar redondo de jogadores, mestres e admins. A imagem é um recorte pequeno
-- (data URL) feito no navegador a partir da arte do personagem; sem avatar,
-- a interface mostra um avatar padrão.

create table public.user_avatars (
  user_id uuid primary key references auth.users(id) on delete cascade,
  avatar text not null check (length(avatar) <= 60000 and avatar like 'data:image/%'),
  updated_at timestamptz not null default now()
);

alter table public.user_avatars enable row level security;

-- Cada usuário lê o próprio avatar; escrita só pelo RPC abaixo.
create policy "users can read own avatar" on public.user_avatars
  for select using (user_id = auth.uid());
create policy "admins can read avatars" on public.user_avatars
  for select using (public.is_admin());

create or replace function public.set_my_avatar(p_avatar text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Entre para alterar o avatar.' using errcode = '42501';
  end if;
  if p_avatar is null or btrim(p_avatar) = '' then
    delete from public.user_avatars where user_id = auth.uid();
    return;
  end if;
  if p_avatar not like 'data:image/%' or length(p_avatar) > 60000 then
    raise exception 'Imagem de avatar inválida ou grande demais.' using errcode = '22023';
  end if;
  insert into public.user_avatars (user_id, avatar) values (auth.uid(), p_avatar)
  on conflict (user_id) do update set avatar = excluded.avatar, updated_at = now();
end;
$$;

-- Avatares dos participantes (jogadores) de um combate que o chamador pode ver.
create or replace function public.combat_avatars(p_session_id uuid)
returns table (profile_id uuid, avatar text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, a.avatar
  from public.combat_participants cp
  join public.profiles p on p.id = cp.profile_id
  join public.user_avatars a on a.user_id = p.user_id
  where cp.combat_session_id = p_session_id
    and public.can_view_combat(p_session_id);
$$;

revoke all on function public.set_my_avatar(text) from public, anon;
revoke all on function public.combat_avatars(uuid) from public, anon;
grant execute on function public.set_my_avatar(text) to authenticated;
grant execute on function public.combat_avatars(uuid) to authenticated;
