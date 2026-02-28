-- ============================================================
-- 16. ORGANIZATION SYSTEM (NGO hierarchy, units, roles, members)
-- Run this snippet in your Supabase SQL Editor
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
