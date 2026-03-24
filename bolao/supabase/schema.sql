-- ============================================================
-- BOLAO WHATSAPP-FIRST - Schema Supabase
-- ============================================================

-- Perfis de usuário (sincronizado com auth.users via trigger)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text not null,
  avatar_url text,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Perfil visível para todos os membros" on public.profiles for select using (true);
create policy "Usuário atualiza só o próprio perfil" on public.profiles for update using (auth.uid() = id);

-- Trigger: cria perfil automaticamente ao cadastrar
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Ligas
create table public.leagues (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  season text not null default '2026',
  paid boolean not null default false,
  created_at timestamptz default now()
);
alter table public.leagues enable row level security;
create policy "Ligas visíveis para membros" on public.leagues for select using (
  exists (select 1 from public.league_members lm where lm.league_id = id and lm.user_id = auth.uid())
  or owner_id = auth.uid()
);
create policy "Dono cria liga" on public.leagues for insert with check (owner_id = auth.uid());
create policy "Dono atualiza liga" on public.leagues for update using (owner_id = auth.uid());

-- Membros da liga
create table public.league_members (
  id uuid default gen_random_uuid() primary key,
  league_id uuid references public.leagues(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  joined_at timestamptz default now(),
  unique(league_id, user_id)
);
alter table public.league_members enable row level security;
create policy "Membros visíveis para outros membros" on public.league_members for select using (
  exists (select 1 from public.league_members lm where lm.league_id = league_id and lm.user_id = auth.uid())
);
create policy "Usuário entra na liga" on public.league_members for insert with check (user_id = auth.uid());

-- Rodadas
create table public.rounds (
  id uuid default gen_random_uuid() primary key,
  league_id uuid references public.leagues(id) on delete cascade not null,
  name text not null,
  start_date timestamptz not null,
  end_date timestamptz not null,
  status text not null default 'upcoming' check (status in ('upcoming','open','closed','finished')),
  created_at timestamptz default now()
);
alter table public.rounds enable row level security;
create policy "Rodadas visíveis para membros da liga" on public.rounds for select using (
  exists (
    select 1 from public.league_members lm
    where lm.league_id = rounds.league_id and lm.user_id = auth.uid()
  )
);
create policy "Dono cria rodada" on public.rounds for insert with check (
  exists (select 1 from public.leagues l where l.id = league_id and l.owner_id = auth.uid())
);
create policy "Dono atualiza rodada" on public.rounds for update using (
  exists (select 1 from public.leagues l where l.id = league_id and l.owner_id = auth.uid())
);

-- Jogos
create table public.matches (
  id uuid default gen_random_uuid() primary key,
  round_id uuid references public.rounds(id) on delete cascade not null,
  home_team text not null,
  away_team text not null,
  home_score integer,
  away_score integer,
  match_date timestamptz not null,
  home_flag text,
  away_flag text
);
alter table public.matches enable row level security;
create policy "Jogos visíveis para membros" on public.matches for select using (
  exists (
    select 1 from public.rounds r
    join public.league_members lm on lm.league_id = r.league_id
    where r.id = matches.round_id and lm.user_id = auth.uid()
  )
);
create policy "Dono cria jogos" on public.matches for insert with check (
  exists (
    select 1 from public.rounds r
    join public.leagues l on l.id = r.league_id
    where r.id = round_id and l.owner_id = auth.uid()
  )
);
create policy "Dono atualiza placar" on public.matches for update using (
  exists (
    select 1 from public.rounds r
    join public.leagues l on l.id = r.league_id
    where r.id = round_id and l.owner_id = auth.uid()
  )
);

-- Palpites
create table public.predictions (
  id uuid default gen_random_uuid() primary key,
  match_id uuid references public.matches(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  home_score integer not null,
  away_score integer not null,
  points integer,
  created_at timestamptz default now(),
  unique(match_id, user_id)
);
alter table public.predictions enable row level security;
create policy "Palpites visíveis para membros da liga" on public.predictions for select using (
  exists (
    select 1 from public.matches m
    join public.rounds r on r.id = m.round_id
    join public.league_members lm on lm.league_id = r.league_id
    where m.id = predictions.match_id and lm.user_id = auth.uid()
  )
);
create policy "Usuário cria próprio palpite" on public.predictions for insert with check (user_id = auth.uid());
create policy "Usuário atualiza próprio palpite (antes do fechamento)" on public.predictions for update using (user_id = auth.uid());

-- ============================================================
-- FUNÇÃO: calcular pontos por rodada
-- Regra: placar exato = 3pts | resultado correto = 1pt
-- ============================================================
create or replace function public.calculate_round_points(p_round_id uuid)
returns void as $$
declare
  m record;
  p record;
  pts integer;
  home_result integer;
  away_result integer;
begin
  for m in select * from public.matches where round_id = p_round_id and home_score is not null and away_score is not null loop
    for p in select * from public.predictions where match_id = m.id loop
      -- placar exato
      if p.home_score = m.home_score and p.away_score = m.away_score then
        pts := 3;
      -- resultado correto (vitória, empate, derrota)
      elsif
        (p.home_score > p.away_score and m.home_score > m.away_score) or
        (p.home_score = p.away_score and m.home_score = m.away_score) or
        (p.home_score < p.away_score and m.home_score < m.away_score)
      then
        pts := 1;
      else
        pts := 0;
      end if;
      update public.predictions set points = pts where id = p.id;
    end loop;
  end loop;
end;
$$ language plpgsql security definer;

-- ============================================================
-- VIEW: ranking por liga
-- ============================================================
create or replace view public.league_ranking as
select
  lm.league_id,
  p.id as user_id,
  p.name,
  p.avatar_url,
  coalesce(sum(pr.points), 0) as total_points,
  count(case when pr.points = 3 then 1 end) as exact_hits,
  count(case when pr.points = 1 then 1 end) as result_hits,
  rank() over (partition by lm.league_id order by coalesce(sum(pr.points), 0) desc) as position
from public.league_members lm
join public.profiles p on p.id = lm.user_id
left join public.predictions pr on pr.user_id = lm.user_id
left join public.matches m on m.id = pr.match_id
left join public.rounds r on r.id = m.round_id and r.league_id = lm.league_id
group by lm.league_id, p.id, p.name, p.avatar_url;
