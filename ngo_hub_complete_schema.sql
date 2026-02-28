-- =============================================================================
-- NGO Hub — Complete Database Schema (Auto-Migration)
-- Run this file against your Supabase project to create or update all tables.
-- All statements use IF NOT EXISTS / DO-NOTHING guards so it is safe to re-run.
-- =============================================================================

-- ============================================================
-- 0. EXTENSIONS
-- ============================================================
create extension if not exists "pgcrypto";

-- ============================================================
-- 1. ORGANIZATIONS (Multi-tenant root)
-- ============================================================
create table if not exists organizations (
  id          uuid default gen_random_uuid() primary key,
  name        text not null,
  slug        text unique not null,
  logo_url    text,
  description text,
  website     text,
  country     text,
  created_at  timestamp with time zone default timezone('utc', now()) not null
);

alter table organizations enable row level security;

drop policy if exists "Orgs: authenticated read" on organizations;
create policy "Orgs: authenticated read" on organizations
  for select using (auth.role() = 'authenticated');

drop policy if exists "Orgs: owner manage" on organizations;
create policy "Orgs: owner manage" on organizations
  for all using (auth.role() = 'authenticated');

-- ============================================================
-- 2. PROFILES (Members)
-- ============================================================
create table if not exists profiles (
  id                uuid references auth.users on delete cascade primary key,
  fullname          text,
  email             text,
  phone             text,
  birth_date        date,
  gender            text,
  avatar_url        text,
  points            integer default 0,
  cotisation_status text check (cotisation_status in ('paid', 'unpaid', 'exempt')) default 'unpaid',
  is_validated      boolean default false,
  advisor_id        uuid references profiles(id) on delete set null,
  organization_id   uuid references organizations(id) on delete set null,
  created_at        timestamp with time zone default timezone('utc', now()) not null
);

do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='organization_id') then
    alter table profiles add column organization_id uuid references organizations(id) on delete set null;
  end if;
end $$;

alter table profiles enable row level security;

drop policy if exists "Profiles: authenticated read" on profiles;
create policy "Profiles: authenticated read" on profiles
  for select using (auth.role() = 'authenticated');

drop policy if exists "Profiles: self update" on profiles;
create policy "Profiles: self update" on profiles
  for update using (auth.uid() = id);

drop policy if exists "Profiles: self insert" on profiles;
create policy "Profiles: self insert" on profiles
  for insert with check (auth.uid() = id);

-- Trigger to create profile after sign up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, fullname, phone, birth_date)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'fullname',
    new.raw_user_meta_data->>'phone',
    (new.raw_user_meta_data->>'birth_date')::date
  ) on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Note: In Supabase, you must run this on the 'auth.users' table
-- which may require superuser permissions in the SQL editor.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 3. ROLES & POSTES
-- ============================================================
create table if not exists roles (
  id          uuid default gen_random_uuid() primary key,
  name        text not null,
  member_id   uuid references profiles(id) on delete cascade,
  created_at  timestamp with time zone default timezone('utc', now()) not null
);

create table if not exists postes (
  id          uuid default gen_random_uuid() primary key,
  title       text not null,
  member_id   uuid references profiles(id) on delete cascade,
  start_date  date,
  end_date    date,
  created_at  timestamp with time zone default timezone('utc', now()) not null
);

alter table roles  enable row level security;
alter table postes enable row level security;

drop policy if exists "Roles: authenticated" on roles;
create policy "Roles: authenticated" on roles for all using (auth.role() = 'authenticated');

drop policy if exists "Postes: authenticated" on postes;
create policy "Postes: authenticated" on postes for all using (auth.role() = 'authenticated');

-- ============================================================
-- 4. POINTS HISTORY
-- ============================================================
create table if not exists points_history (
  id          uuid default gen_random_uuid() primary key,
  member_id   uuid references profiles(id) on delete cascade not null,
  points      integer not null,
  source_type text,
  source_id   uuid,
  description text,
  created_at  timestamp with time zone default timezone('utc', now()) not null
);

alter table points_history enable row level security;

drop policy if exists "Points history: authenticated" on points_history;
create policy "Points history: authenticated" on points_history for all using (auth.role() = 'authenticated');

-- ============================================================
-- 5. OBJECTIVES
-- ============================================================
create table if not exists objectives (
  id          uuid default gen_random_uuid() primary key,
  title       text not null,
  description text,
  pillar      text,
  created_at  timestamp with time zone default timezone('utc', now()) not null
);

create table if not exists member_objectives (
  id           uuid default gen_random_uuid() primary key,
  member_id    uuid references profiles(id) on delete cascade not null,
  objective_id uuid references objectives(id) on delete cascade not null,
  status       text check (status in ('not_started','in_progress','completed')) default 'not_started',
  progress     integer default 0,
  created_at   timestamp with time zone default timezone('utc', now()) not null,
  unique(member_id, objective_id)
);

alter table objectives        enable row level security;
alter table member_objectives enable row level security;

drop policy if exists "Objectives: authenticated" on objectives;
create policy "Objectives: authenticated" on objectives for all using (auth.role() = 'authenticated');

drop policy if exists "Member objectives: authenticated" on member_objectives;
create policy "Member objectives: authenticated" on member_objectives for all using (auth.role() = 'authenticated');

-- ============================================================
-- 6. COMPLAINTS
-- ============================================================
create table if not exists complaints (
  id          uuid default gen_random_uuid() primary key,
  member_id   uuid references profiles(id) on delete cascade not null,
  subject     text not null,
  description text,
  status      text check (status in ('open','in_review','resolved')) default 'open',
  created_at  timestamp with time zone default timezone('utc', now()) not null
);

alter table complaints enable row level security;

drop policy if exists "Complaints: authenticated" on complaints;
create policy "Complaints: authenticated" on complaints for all using (auth.role() = 'authenticated');

-- ============================================================
-- 7. JPS SNAPSHOTS
-- ============================================================
create table if not exists jps_snapshots (
  id          uuid default gen_random_uuid() primary key,
  member_id   uuid references profiles(id) on delete cascade not null,
  year        integer not null,
  month       integer not null,
  trimester   integer not null,
  score       numeric(5,2) default 0,
  category    text,
  created_at  timestamp with time zone default timezone('utc', now()) not null,
  unique(member_id, year, month)
);

alter table jps_snapshots enable row level security;

drop policy if exists "JPS snapshots: authenticated" on jps_snapshots;
create policy "JPS snapshots: authenticated" on jps_snapshots for all using (auth.role() = 'authenticated');

-- ============================================================
-- 8. ACTIVITIES + SUB-TYPES
-- ============================================================
create table if not exists activities (
  id                  uuid default gen_random_uuid() primary key,
  title               text not null,
  description         text,
  activity_type       text check (activity_type in ('event','meeting','formation','general_assembly')) not null,
  activity_begin_date date,
  activity_end_date   date,
  activity_address    text,
  image_url           text,
  video_url           text,
  recap_videos        text[],
  pillar              text,
  organization_id     uuid references organizations(id) on delete set null,
  created_by          uuid references profiles(id) on delete set null,
  created_at          timestamp with time zone default timezone('utc', now()) not null
);

do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='activities' and column_name='organization_id') then
    alter table activities add column organization_id uuid references organizations(id) on delete set null;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='activities' and column_name='video_url') then
    alter table activities add column video_url text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='activities' and column_name='recap_videos') then
    alter table activities add column recap_videos text[];
  end if;
end $$;

create table if not exists events (
  id                    uuid default gen_random_uuid() primary key,
  activity_id           uuid references activities(id) on delete cascade unique,
  registration_deadline date
);

create table if not exists meetings (
  id          uuid default gen_random_uuid() primary key,
  activity_id uuid references activities(id) on delete cascade unique,
  agenda      text
);

create table if not exists formations (
  id          uuid default gen_random_uuid() primary key,
  activity_id uuid references activities(id) on delete cascade unique,
  trainer     text,
  duration_h  numeric(5,2)
);

create table if not exists general_assemblies (
  id            uuid default gen_random_uuid() primary key,
  activity_id   uuid references activities(id) on delete cascade unique,
  assembly_type text
);

create table if not exists activity_participants (
  id          uuid default gen_random_uuid() primary key,
  activity_id uuid references activities(id) on delete cascade not null,
  member_id   uuid references profiles(id) on delete cascade not null,
  role        text default 'participant',
  joined_at   timestamp with time zone default timezone('utc', now()) not null,
  unique(activity_id, member_id)
);

create table if not exists categories (
  id   uuid default gen_random_uuid() primary key,
  name text not null unique
);

create table if not exists activity_categories (
  id          uuid default gen_random_uuid() primary key,
  activity_id uuid references activities(id) on delete cascade not null,
  category_id uuid references categories(id) on delete cascade not null,
  unique(activity_id, category_id)
);

alter table activities           enable row level security;
alter table activity_participants enable row level security;
alter table categories           enable row level security;
alter table activity_categories  enable row level security;

drop policy if exists "Activities: authenticated" on activities;
create policy "Activities: authenticated" on activities for all using (auth.role() = 'authenticated');

drop policy if exists "Participants: authenticated" on activity_participants;
create policy "Participants: authenticated" on activity_participants for all using (auth.role() = 'authenticated');

drop policy if exists "Categories: authenticated" on categories;
create policy "Categories: authenticated" on categories for all using (auth.role() = 'authenticated');

drop policy if exists "Activity categories: authenticated" on activity_categories;
create policy "Activity categories: authenticated" on activity_categories for all using (auth.role() = 'authenticated');

-- ============================================================
-- 9. RECRUITMENT (Candidates)
-- ============================================================
create table if not exists candidates (
  id              uuid default gen_random_uuid() primary key,
  fullname        text not null,
  email           text,
  phone           text,
  status          text check (status in ('new','in_review','accepted','rejected')) default 'new',
  score           numeric(5,2),
  notes           text,
  organization_id uuid references organizations(id) on delete set null,
  created_at      timestamp with time zone default timezone('utc', now()) not null
);

do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='candidates' and column_name='organization_id') then
    alter table candidates add column organization_id uuid references organizations(id) on delete set null;
  end if;
end $$;

alter table candidates enable row level security;

drop policy if exists "Candidates: authenticated" on candidates;
create policy "Candidates: authenticated" on candidates for all using (auth.role() = 'authenticated');

-- ============================================================
-- 10. PROJECTS & TEAMS
-- ============================================================
create table if not exists projects (
  id              uuid default gen_random_uuid() primary key,
  name            text not null,
  description     text,
  leader_id       uuid references profiles(id) on delete set null,
  organization_id uuid references organizations(id) on delete set null,
  created_at      timestamp with time zone default timezone('utc', now()) not null
);

do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='projects' and column_name='organization_id') then
    alter table projects add column organization_id uuid references organizations(id) on delete set null;
  end if;
end $$;

create table if not exists project_members (
  id         uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  member_id  uuid references profiles(id) on delete cascade not null,
  role       text check (role in ('member','admin')) default 'member',
  joined_at  timestamp with time zone default timezone('utc', now()) not null,
  unique(project_id, member_id)
);

create table if not exists teams (
  id              uuid default gen_random_uuid() primary key,
  name            text not null,
  description     text,
  activity_id     uuid references activities(id) on delete set null,
  project_id      uuid references projects(id) on delete cascade,
  is_public       boolean default false,
  strategy        text,
  resources       jsonb default '[]'::jsonb,
  organization_id uuid references organizations(id) on delete set null,
  created_by      uuid references profiles(id) on delete set null,
  created_at      timestamp with time zone default timezone('utc', now()) not null
);

do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='teams' and column_name='organization_id') then
    alter table teams add column organization_id uuid references organizations(id) on delete set null;
  end if;
end $$;

create table if not exists team_members (
  id        uuid default gen_random_uuid() primary key,
  team_id   uuid references teams(id) on delete cascade not null,
  member_id uuid references profiles(id) on delete cascade not null,
  role      text check (role in ('member','admin','lead')) default 'member',
  joined_at timestamp with time zone default timezone('utc', now()) not null,
  unique(team_id, member_id)
);

-- Helper functions (Security Definer) to break RLS recursion
create or replace function public.is_team_public(t_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  return exists (select 1 from teams where id = t_id and is_public = true);
end; $$;

create or replace function public.is_team_member(t_id uuid, u_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  return exists (select 1 from team_members where team_id = t_id and member_id = u_id);
end; $$;

create or replace function public.can_admin_team(t_id uuid, u_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  return exists (select 1 from teams where id = t_id and created_by = u_id)
      or exists (select 1 from team_members where team_id = t_id and member_id = u_id and role in ('admin','lead'));
end; $$;

create or replace function public.is_project_admin(p_id uuid, u_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  return exists (select 1 from project_members where project_id = p_id and member_id = u_id and role = 'admin');
end; $$;

alter table projects        enable row level security;
alter table project_members enable row level security;
alter table teams           enable row level security;
alter table team_members    enable row level security;

drop policy if exists "Projects: authenticated" on projects;
create policy "Projects: authenticated" on projects for all using (auth.role() = 'authenticated');

drop policy if exists "Project members: authenticated" on project_members;
create policy "Project members: authenticated" on project_members for all using (auth.role() = 'authenticated');

drop policy if exists "View teams" on teams;
create policy "View teams" on teams for select using (
  is_public = true or created_by = auth.uid() or public.is_team_member(id, auth.uid())
);

drop policy if exists "Update teams" on teams;
create policy "Update teams" on teams for update using (public.can_admin_team(id, auth.uid()));

drop policy if exists "View team members" on team_members;
create policy "View team members" on team_members for select using (auth.role() = 'authenticated');

drop policy if exists "Add team members" on team_members;
create policy "Add team members" on team_members for insert with check (
  (auth.uid() = member_id and public.is_team_public(team_id))
  or public.can_admin_team(team_id, auth.uid())
);

drop policy if exists "Remove team members" on team_members;
create policy "Remove team members" on team_members for delete using (
  auth.uid() = member_id or public.can_admin_team(team_id, auth.uid())
);

-- ============================================================
-- 11. TASKS
-- ============================================================
create table if not exists tasks (
  id          uuid default gen_random_uuid() primary key,
  title       text not null,
  description text,
  points      integer default 0,
  subtasks    jsonb default '[]'::jsonb,
  created_at  timestamp with time zone default timezone('utc', now()) not null
);

do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='tasks' and column_name='points') then
    alter table tasks add column points integer default 0;
  end if;
end $$;

create table if not exists member_tasks (
  id                    uuid default gen_random_uuid() primary key,
  task_id               uuid references tasks(id) on delete cascade not null,
  member_id             uuid references profiles(id) on delete cascade not null,
  status                text check (status in ('todo','in_progress','completed')) default 'todo',
  tracking_type         text check (tracking_type in ('manual','subtasks')) default 'subtasks',
  progress_percentage   integer default 0,
  completed_subtask_ids jsonb default '[]'::jsonb,
  assigned_at           timestamp with time zone default timezone('utc', now()) not null,
  updated_at            timestamp with time zone default timezone('utc', now()) not null
);

alter table tasks        enable row level security;
alter table member_tasks enable row level security;

drop policy if exists "Enable all access for authenticated users" on tasks;
create policy "Enable all access for authenticated users" on tasks for all using (auth.role() = 'authenticated');

drop policy if exists "Enable all access for authenticated users" on member_tasks;
create policy "Enable all access for authenticated users" on member_tasks for all using (auth.role() = 'authenticated');

-- Trigger: Award / return points on task completion
create or replace function handle_task_completion()
returns trigger as $$
declare
  task_points integer;
  task_title  text;
begin
  if new.status = 'completed' and (old.status is null or old.status != 'completed') then
    select points, title into task_points, task_title from tasks where id = new.task_id;
    if task_points > 0 then
      update profiles set points = coalesce(points, 0) + task_points where id = new.member_id;
      insert into points_history (member_id, points, source_type, source_id, description)
        values (new.member_id, task_points, 'task', new.task_id, 'Completed Task: ' || task_title);
    end if;
  elsif old.status = 'completed' and new.status != 'completed' then
    select points, title into task_points, task_title from tasks where id = new.task_id;
    if task_points > 0 then
      update profiles set points = coalesce(points, 0) - task_points where id = new.member_id;
      insert into points_history (member_id, points, source_type, source_id, description)
        values (new.member_id, -task_points, 'task', new.task_id, 'Task Reopened: ' || task_title || ' (Points Returned)');
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_task_completion on member_tasks;
create trigger on_task_completion
  after update on member_tasks
  for each row execute function handle_task_completion();

-- Trigger: Return points when assignment is deleted
create or replace function handle_task_deletion()
returns trigger as $$
declare
  task_points integer;
  task_title  text;
begin
  if old.status = 'completed' then
    select points, title into task_points, task_title from tasks where id = old.task_id;
    if task_points > 0 then
      update profiles set points = coalesce(points, 0) - task_points where id = old.member_id;
      insert into points_history (member_id, points, source_type, source_id, description)
        values (old.member_id, -task_points, 'task', old.task_id, 'Assignment Deleted: ' || task_title || ' (Points Returned)');
    end if;
  end if;
  return old;
end;
$$ language plpgsql;

drop trigger if exists on_task_deletion on member_tasks;
create trigger on_task_deletion
  after delete on member_tasks
  for each row execute function handle_task_deletion();

-- Trigger: Block direct delete of completed assignments
create or replace function prevent_completed_task_modification()
returns trigger as $$
begin
  if TG_OP = 'DELETE' and old.status = 'completed' then
    raise exception 'Cannot delete a completed task assignment. Reopen it first.';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists check_completed_task_lock on member_tasks;
create trigger check_completed_task_lock
  before update or delete on member_tasks
  for each row execute function prevent_completed_task_modification();

-- ============================================================
-- 12. CLUBS
-- ============================================================
create table if not exists clubs (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text,
  logo_url     text,
  region       text,
  president_id uuid not null references auth.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Per-club roles (President, Vice-President, Secretary, Treasurer, Member, etc.)
create table if not exists club_roles (
  id           uuid primary key default gen_random_uuid(),
  club_id      uuid not null references clubs(id) on delete cascade,
  name         text not null,
  is_president boolean not null default false,
  sort_order   int default 0,
  created_at   timestamptz not null default now(),
  unique(club_id, name)
);

-- Club membership: pending (request) or accepted
create table if not exists club_members (
  id           uuid primary key default gen_random_uuid(),
  club_id      uuid not null references clubs(id) on delete cascade,
  member_id    uuid not null references auth.users(id) on delete cascade,
  club_role_id uuid references club_roles(id) on delete set null,
  status       text not null default 'pending' check (status in ('pending', 'accepted')),
  is_board_member boolean not null default false,
  message      text,
  joined_at    timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique(club_id, member_id)
);

-- Club events
create table if not exists club_events (
  id          uuid primary key default gen_random_uuid(),
  club_id     uuid not null references clubs(id) on delete cascade,
  title       text not null,
  description text,
  image_url   text,
  location    text,
  start_at    timestamptz not null,
  end_at      timestamptz,
  created_by  uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Super admin flag on profiles (if not already added)
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'profiles' and column_name = 'is_superadmin'
  ) then
    alter table profiles add column is_superadmin boolean not null default false;
  end if;
end $$;

-- Helper: check if user is president or accepted board member (SECURITY DEFINER bypasses RLS)
create or replace function public.is_club_board_member(c_id uuid, u_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  return exists (
    select 1 from clubs c
    left join club_members cm on cm.club_id = c.id and cm.member_id = u_id
    where c.id = c_id
      and (c.president_id = u_id or (cm.status = 'accepted' and cm.is_board_member = true))
  );
end; $$;

-- Helper: check if user is accepted member of a club (SECURITY DEFINER bypasses RLS)
create or replace function public.is_club_accepted_member(c_id uuid, u_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  return exists (
    select 1 from club_members
    where club_id = c_id and member_id = u_id and status = 'accepted'
  );
end; $$;

-- RLS
alter table clubs       enable row level security;
alter table club_roles  enable row level security;
alter table club_members enable row level security;
alter table club_events  enable row level security;

-- Clubs policies
drop policy if exists "Clubs: public read" on clubs;
create policy "Clubs: public read" on clubs for select using (true);

drop policy if exists "Clubs: authenticated create" on clubs;
create policy "Clubs: authenticated create" on clubs for insert
  with check (auth.uid() = president_id);

drop policy if exists "Clubs: president or superadmin update" on clubs;
create policy "Clubs: president or superadmin update" on clubs for update
  using (
    auth.uid() = president_id
    or (select is_superadmin from profiles where id = auth.uid()) = true
  );

drop policy if exists "Clubs: president or superadmin delete" on clubs;
create policy "Clubs: president or superadmin delete" on clubs for delete
  using (
    auth.uid() = president_id
    or (select is_superadmin from profiles where id = auth.uid()) = true
  );

-- Club roles policies
drop policy if exists "Club roles: read" on club_roles;
create policy "Club roles: read" on club_roles for select using (true);

drop policy if exists "Club roles: board or superadmin manage" on club_roles;
drop policy if exists "Club roles: board manage" on club_roles;
create policy "Club roles: board manage" on club_roles for all
  using (
    public.is_club_board_member(club_id, auth.uid())
    or exists (select 1 from profiles p where p.id = auth.uid() and p.is_superadmin = true)
  );

-- Club members policies
drop policy if exists "Club members: read" on club_members;
create policy "Club members: read" on club_members for select
  using (
    member_id = auth.uid()
    or exists (select 1 from clubs c where c.id = club_id and c.president_id = auth.uid())
    or public.is_club_accepted_member(club_id, auth.uid())
  );

drop policy if exists "Club members: request join" on club_members;
create policy "Club members: request join" on club_members for insert
  with check (
    auth.uid() = member_id
    or public.is_club_board_member(club_id, auth.uid())
    or exists (select 1 from profiles p where p.id = auth.uid() and p.is_superadmin = true)
  );

drop policy if exists "Club members: board or superadmin update" on club_members;
create policy "Club members: board or superadmin update" on club_members for update
  using (
    public.is_club_board_member(club_id, auth.uid())
    or exists (select 1 from profiles p where p.id = auth.uid() and p.is_superadmin = true)
  );

drop policy if exists "Club members: self or president delete" on club_members;
create policy "Club members: self or president delete" on club_members for delete
  using (
    member_id = auth.uid()
    or exists (select 1 from clubs c where c.id = club_id and c.president_id = auth.uid())
    or exists (select 1 from profiles p where p.id = auth.uid() and p.is_superadmin = true)
  );

-- Club events policies
drop policy if exists "Club events: public read" on club_events;
create policy "Club events: public read" on club_events for select using (true);

drop policy if exists "Club events: club board create" on club_events;
create policy "Club events: club board create" on club_events for insert
  with check (
    created_by = auth.uid()
    and public.is_club_board_member(club_id, auth.uid())
  );

drop policy if exists "Club events: club board update" on club_events;
create policy "Club events: club board update" on club_events for update
  using (
    public.is_club_board_member(club_id, auth.uid())
    or exists (select 1 from profiles p where p.id = auth.uid() and p.is_superadmin = true)
  );

drop policy if exists "Club events: club board delete" on club_events;
create policy "Club events: club board delete" on club_events for delete
  using (
    public.is_club_board_member(club_id, auth.uid())
    or exists (select 1 from profiles p where p.id = auth.uid() and p.is_superadmin = true)
  );

-- Trigger: create president role and auto-add president on club creation
create or replace function on_club_created()
returns trigger as $$
begin
  insert into club_roles (club_id, name, is_president, sort_order)
  values (new.id, 'President', true, 0);

  insert into club_members (club_id, member_id, status, joined_at, club_role_id)
  select new.id, new.president_id, 'accepted', now(), id
  from club_roles where club_id = new.id and is_president = true;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_club_created on clubs;
create trigger on_club_created
  after insert on clubs
  for each row execute procedure on_club_created();

-- Trigger: auto-update updated_at on clubs
create or replace function clubs_updated_at()
returns trigger as $$ begin new.updated_at = now(); return new; end; $$ language plpgsql;

drop trigger if exists clubs_updated_at on clubs;
create trigger clubs_updated_at
  before update on clubs
  for each row execute procedure clubs_updated_at();

-- Trigger: auto-update updated_at on club_events
create or replace function club_events_updated_at()
returns trigger as $$ begin new.updated_at = now(); return new; end; $$ language plpgsql;

drop trigger if exists club_events_updated_at on club_events;
create trigger club_events_updated_at
  before update on club_events
  for each row execute procedure club_events_updated_at();

-- ============================================================
-- 13. COMMUNITY: POSTS & COMMENTS
-- ============================================================
create table if not exists club_posts (
  id          uuid default gen_random_uuid() primary key,
  club_id     uuid references clubs(id) on delete cascade,         -- If null, it's a global public post
  author_id   uuid not null references profiles(id) on delete cascade,
  title       text,
  content     text not null,
  image_url   text,
  is_pinned   boolean default false,
  created_at  timestamp with time zone default timezone('utc', now()) not null,
  updated_at  timestamp with time zone default timezone('utc', now()) not null
);

create table if not exists club_comments (
  id          uuid default gen_random_uuid() primary key,
  post_id     uuid not null references club_posts(id) on delete cascade,
  author_id   uuid not null references profiles(id) on delete cascade,
  content     text not null,
  created_at  timestamp with time zone default timezone('utc', now()) not null,
  updated_at  timestamp with time zone default timezone('utc', now()) not null
);

-- RLS
alter table club_posts    enable row level security;
alter table club_comments enable row level security;

-- Posts: SELECT
drop policy if exists "Club posts: public read if global or club member" on club_posts;
drop policy if exists "Club posts: read" on club_posts;
create policy "Club posts: read" on club_posts for select using (
  club_id is null
  or exists (
    select 1 from club_members cm
    where cm.club_id = club_posts.club_id and cm.member_id = auth.uid() and cm.status = 'accepted'
  )
  or exists (
    select 1 from profiles p where p.id = auth.uid() and p.is_superadmin = true
  )
);

-- Posts: INSERT
drop policy if exists "Club posts: authenticated create" on club_posts;
drop policy if exists "Club posts: create" on club_posts;
create policy "Club posts: create" on club_posts for insert with check (
  author_id = auth.uid()
  and (
    club_id is null
    or exists (
      select 1 from club_members cm
      where cm.club_id = club_posts.club_id and cm.member_id = auth.uid() and cm.status = 'accepted'
    )
  )
);

-- Posts: UPDATE
drop policy if exists "Club posts: author or superadmin manage" on club_posts;
drop policy if exists "Club posts: update" on club_posts;
create policy "Club posts: update" on club_posts for update using (
  author_id = auth.uid()
  or exists (select 1 from profiles p where p.id = auth.uid() and p.is_superadmin = true)
);

-- Posts: DELETE
drop policy if exists "Club posts: delete" on club_posts;
create policy "Club posts: delete" on club_posts for delete using (
  author_id = auth.uid()
  or exists (select 1 from profiles p where p.id = auth.uid() and p.is_superadmin = true)
);

-- Comments: SELECT
drop policy if exists "Club comments: public read if global or club member" on club_comments;
drop policy if exists "Club comments: read" on club_comments;
create policy "Club comments: read" on club_comments for select using (
  exists (
    select 1 from club_posts cp where cp.id = club_comments.post_id and (
      cp.club_id is null
      or exists (
        select 1 from club_members cm
        where cm.club_id = cp.club_id and cm.member_id = auth.uid() and cm.status = 'accepted'
      )
    )
  )
  or exists (select 1 from profiles p where p.id = auth.uid() and p.is_superadmin = true)
);

-- Comments: INSERT
drop policy if exists "Club comments: authenticated create" on club_comments;
drop policy if exists "Club comments: create" on club_comments;
create policy "Club comments: create" on club_comments for insert with check (
  author_id = auth.uid()
  and exists (
    select 1 from club_posts cp where cp.id = post_id and (
      cp.club_id is null
      or exists (
        select 1 from club_members cm
        where cm.club_id = cp.club_id and cm.member_id = auth.uid() and cm.status = 'accepted'
      )
    )
  )
);

-- Comments: UPDATE
drop policy if exists "Club comments: author or superadmin manage" on club_comments;
drop policy if exists "Club comments: update" on club_comments;
create policy "Club comments: update" on club_comments for update using (
  author_id = auth.uid()
  or exists (select 1 from profiles p where p.id = auth.uid() and p.is_superadmin = true)
);

-- Comments: DELETE
drop policy if exists "Club comments: delete" on club_comments;
create policy "Club comments: delete" on club_comments for delete using (
  author_id = auth.uid()
  or exists (select 1 from profiles p where p.id = auth.uid() and p.is_superadmin = true)
);


-- ============================================================
-- 15. CLUB DEPARTMENTS
-- ============================================================
create table if not exists club_departments (
  id          uuid primary key default gen_random_uuid(),
  club_id     uuid not null references clubs(id) on delete cascade,
  name        text not null,
  description text,
  created_by  uuid not null references auth.users(id),
  created_at  timestamptz not null default now(),
  unique(club_id, name)
);

create table if not exists club_department_members (
  id            uuid primary key default gen_random_uuid(),
  department_id uuid not null references club_departments(id) on delete cascade,
  member_id     uuid not null references auth.users(id) on delete cascade,
  role          text default 'member' check (role in ('member','head')),
  status        text default 'pending' check (status in ('pending','accepted')),
  created_at    timestamptz not null default now(),
  unique(department_id, member_id)
);

alter table club_departments enable row level security;
alter table club_department_members enable row level security;

-- Departments: club members can see, board can manage
drop policy if exists "Departments: read" on club_departments;
create policy "Departments: read" on club_departments for select using (
  exists (select 1 from club_members cm where cm.club_id = club_departments.club_id and cm.member_id = auth.uid() and cm.status = 'accepted')
  or public.is_club_board_member(club_id, auth.uid())
);

drop policy if exists "Departments: board create" on club_departments;
create policy "Departments: board create" on club_departments for insert with check (
  public.is_club_board_member(club_id, auth.uid())
);

drop policy if exists "Departments: board update" on club_departments;
create policy "Departments: board update" on club_departments for update using (
  public.is_club_board_member(club_id, auth.uid())
);

drop policy if exists "Departments: board delete" on club_departments;
create policy "Departments: board delete" on club_departments for delete using (
  public.is_club_board_member(club_id, auth.uid())
);

-- Department members
drop policy if exists "Dept members: read" on club_department_members;
create policy "Dept members: read" on club_department_members for select using (true);

drop policy if exists "Dept members: join" on club_department_members;
create policy "Dept members: join" on club_department_members for insert with check (
  (member_id = auth.uid() and status = 'pending')
  or public.is_club_board_member(
    (select club_id from club_departments where id = department_id), auth.uid()
  )
);

drop policy if exists "Dept members: board update" on club_department_members;
create policy "Dept members: board update" on club_department_members for update using (
  public.is_club_board_member(
    (select club_id from club_departments where id = department_id), auth.uid()
  )
);

drop policy if exists "Dept members: leave or board remove" on club_department_members;
create policy "Dept members: leave or board remove" on club_department_members for delete using (
  member_id = auth.uid()
  or public.is_club_board_member(
    (select club_id from club_departments where id = department_id), auth.uid()
  )
);

        -- ============================================================
        -- 16. ORGANIZATION SYSTEM (NGO hierarchy, units, roles, members)
        -- ============================================================

        -- Add parent reference to ngos for hierarchy
        alter table ngos add column if not exists parent_id uuid references ngos(id) on delete set null;

        -- Unit types: user-defined names per org (Chapter, Branch, Commission, Team, etc.)
        create table if not exists ngo_unit_types (
          id          uuid primary key default gen_random_uuid(),
          ngo_id      uuid not null references ngos(id) on delete cascade,
          name        text not null,          -- "Chapter", "Branch", "Committee"...
          level       int not null default 0, -- 0=root, 1=child, 2=grandchild...
          icon        text,
          created_at  timestamptz default now(),
          unique(ngo_id, name)
        );

        -- Units: actual instances of a unit type
        create table if not exists ngo_units (
          id             uuid primary key default gen_random_uuid(),
          ngo_id         uuid not null references ngos(id) on delete cascade,
          unit_type_id   uuid not null references ngo_unit_types(id) on delete cascade,
          parent_unit_id uuid references ngo_units(id) on delete cascade,
          name           text not null,
          description    text,
          created_at     timestamptz default now(),
          unique(ngo_id, parent_unit_id, name)
        );

        -- Roles with fine-grained permissions
        create table if not exists ngo_roles (
          id          uuid primary key default gen_random_uuid(),
          ngo_id      uuid not null references ngos(id) on delete cascade,
          name        text not null,
          permissions text[] default '{}',
          is_admin    boolean default false,
          color       text default '#6B7280',
          sort_order  int default 0,
          unique(ngo_id, name)
        );

        -- Members with role, unit, engagement
        create table if not exists ngo_members (
          id                uuid primary key default gen_random_uuid(),
          ngo_id            uuid not null references ngos(id) on delete cascade,
          member_id         uuid not null references auth.users(id) on delete cascade,
          role_id           uuid references ngo_roles(id) on delete set null,
          unit_id           uuid references ngo_units(id) on delete set null,
          status            text default 'pending' check (status in ('pending','accepted','rejected')),
          engagement_points int default 0,
          joined_at         timestamptz,
          created_at        timestamptz default now(),
          unique(ngo_id, member_id)
        );

        -- Helper: check if user is NGO admin (creator or admin role)
        create or replace function public.is_ngo_admin(n_id uuid, u_id uuid)
        returns boolean language plpgsql security definer set search_path = public as $$
        begin
          return (
            exists (select 1 from ngos where id = n_id and creator_id = u_id)
            or exists (
              select 1 from ngo_members nm
              join ngo_roles nr on nr.id = nm.role_id
              where nm.ngo_id = n_id and nm.member_id = u_id
                and nm.status = 'accepted' and nr.is_admin = true
            )
          );
        end; $$;

        -- Helper: check if user is accepted member
        create or replace function public.is_ngo_member(n_id uuid, u_id uuid)
        returns boolean language plpgsql security definer set search_path = public as $$
        begin
          return exists (
            select 1 from ngo_members
            where ngo_id = n_id and member_id = u_id and status = 'accepted'
          );
        end; $$;

        -- Helper: check specific permission
        create or replace function public.has_ngo_permission(n_id uuid, u_id uuid, perm text)
        returns boolean language plpgsql security definer set search_path = public as $$
        begin
          return (
            exists (select 1 from ngos where id = n_id and creator_id = u_id)
            or exists (
              select 1 from ngo_members nm
              join ngo_roles nr on nr.id = nm.role_id
              where nm.ngo_id = n_id and nm.member_id = u_id
                and nm.status = 'accepted'
                and (nr.is_admin = true or perm = any(nr.permissions) or 'all' = any(nr.permissions))
            )
          );
        end; $$;

        -- RLS
        alter table ngo_unit_types enable row level security;
        alter table ngo_units enable row level security;
        alter table ngo_roles enable row level security;
        alter table ngo_members enable row level security;

        -- Unit types: members read, admins manage
        drop policy if exists "NGO unit types: read" on ngo_unit_types;
        create policy "NGO unit types: read" on ngo_unit_types for select using (
          public.is_ngo_member(ngo_id, auth.uid()) or public.is_ngo_admin(ngo_id, auth.uid())
        );
        drop policy if exists "NGO unit types: manage" on ngo_unit_types;
        create policy "NGO unit types: manage" on ngo_unit_types for all using (
          public.has_ngo_permission(ngo_id, auth.uid(), 'manage_units')
        );

        -- Units: members read, admins manage
        drop policy if exists "NGO units: read" on ngo_units;
        create policy "NGO units: read" on ngo_units for select using (
          public.is_ngo_member(ngo_id, auth.uid()) or public.is_ngo_admin(ngo_id, auth.uid())
        );
        drop policy if exists "NGO units: manage" on ngo_units;
        create policy "NGO units: manage" on ngo_units for all using (
          public.has_ngo_permission(ngo_id, auth.uid(), 'manage_units')
        );

        -- Roles: members read, admins manage
        drop policy if exists "NGO roles: read" on ngo_roles;
        create policy "NGO roles: read" on ngo_roles for select using (
          public.is_ngo_member(ngo_id, auth.uid()) or public.is_ngo_admin(ngo_id, auth.uid())
        );
        drop policy if exists "NGO roles: manage" on ngo_roles;
        create policy "NGO roles: manage" on ngo_roles for all using (
          public.has_ngo_permission(ngo_id, auth.uid(), 'manage_roles')
        );

        -- Members: members see each other, admins manage, anyone can request join
        drop policy if exists "NGO members: read" on ngo_members;
        create policy "NGO members: read" on ngo_members for select using (
          member_id = auth.uid()
          or public.is_ngo_member(ngo_id, auth.uid())
          or public.is_ngo_admin(ngo_id, auth.uid())
        );
        drop policy if exists "NGO members: join" on ngo_members;
        create policy "NGO members: join" on ngo_members for insert with check (
          (auth.uid() = member_id and status = 'pending')
          or public.has_ngo_permission(ngo_id, auth.uid(), 'manage_members')
        );
        drop policy if exists "NGO members: manage" on ngo_members;
        create policy "NGO members: manage" on ngo_members for update using (
          public.has_ngo_permission(ngo_id, auth.uid(), 'manage_members')
        );
        drop policy if exists "NGO members: leave or admin remove" on ngo_members;
        create policy "NGO members: leave or admin remove" on ngo_members for delete using (
          member_id = auth.uid()
          or public.is_ngo_admin(ngo_id, auth.uid())
        );

        -- Auto-add creator as admin member
        create or replace function on_ngo_created()
        returns trigger as $$
        declare
          admin_role_id uuid;
        begin
          -- Create default Admin role
          insert into ngo_roles (ngo_id, name, permissions, is_admin, color, sort_order)
          values (new.id, 'Admin', array['all'], true, '#3B82F6', 0)
          returning id into admin_role_id;

          -- Add creator as member
          insert into ngo_members (ngo_id, member_id, role_id, status, joined_at)
          values (new.id, new.creator_id, admin_role_id, 'accepted', now());

          return new;
        end;
        $$ language plpgsql security definer;

        drop trigger if exists on_ngo_created on ngos;
        create trigger on_ngo_created
          after insert on ngos
          for each row execute function on_ngo_created();

-- ============================================================
-- END OF SCHEMA
-- ============================================================
-- ============================================================
-- 14. TEAM MEETINGS
-- ============================================================
create table if not exists team_meetings (
  id uuid default gen_random_uuid() primary key,
  team_id uuid not null references teams(id) on delete cascade,
  title text not null,
  description text,
  meeting_date timestamp with time zone not null,
  meeting_link text,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table team_meetings enable row level security;

drop policy if exists "Team meetings: read" on team_meetings;
create policy "Team meetings: read" on team_meetings for select using (
  exists (select 1 from public.team_members where team_id = team_meetings.team_id and member_id = auth.uid()) OR
  exists (select 1 from public.teams where id = team_meetings.team_id and is_public = true)
);

drop policy if exists "Team meetings: manage" on team_meetings;
create policy "Team meetings: manage" on team_meetings for all using (
  public.can_admin_team(team_id, auth.uid())
);
-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
insert into storage.buckets (id, name, public) values ('activity-images', 'activity-images', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('activity-attachments', 'activity-attachments', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('profiles_images', 'profiles_images', true) on conflict do nothing;

create policy "Public Access" on storage.objects for select using ( bucket_id in ('activity-images', 'activity-attachments', 'profiles_images') );
create policy "Auth Insert" on storage.objects for insert with check ( auth.role() = 'authenticated' );
create policy "Auth Update" on storage.objects for update using ( auth.role() = 'authenticated' );
create policy "Auth Delete" on storage.objects for delete using ( auth.role() = 'authenticated' );
