-- Trinova Vendor Scorecard: database setup.
-- Run once in Supabase: Dashboard -> SQL Editor -> New query -> paste this file -> Run.
--
-- Every company (organization) only ever sees its own categories, vendors and jobs.
-- Row Level Security enforces this in the database, not just in the app.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.memberships (
  org_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  full_name text not null default '',
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);
create index memberships_user_idx on public.memberships (user_id);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  created_at timestamptz not null default now(),
  unique (id, org_id)
);
create unique index categories_org_name_idx on public.categories (org_id, lower(name));

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  code text not null default '',
  category_id uuid,
  contact text not null default '',
  contract_value numeric(16, 2) not null default 0 check (contract_value >= 0),
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  unique (id, org_id),
  -- a vendor's category must belong to the same company
  foreign key (category_id, org_id) references public.categories (id, org_id) on delete restrict
);
create index vendors_org_idx on public.vendors (org_id);
create unique index vendors_org_code_idx on public.vendors (org_id, lower(code)) where code <> '';

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  vendor_id uuid not null,
  due_date date not null,
  delivered_date date not null,
  qty_ordered integer not null check (qty_ordered >= 0),
  qty_delivered integer not null check (qty_delivered >= 0),
  incident boolean not null default false,
  hse_compliant boolean not null default true,
  hse_notes text not null default '',
  quality smallint not null default 5 check (quality between 1 and 5),
  notes text not null default '',
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  -- a job's vendor must belong to the same company
  foreign key (vendor_id, org_id) references public.vendors (id, org_id) on delete cascade
);
create index jobs_org_idx on public.jobs (org_id);
create index jobs_vendor_due_idx on public.jobs (vendor_id, due_date desc);

-- ---------------------------------------------------------------------------
-- Access rules
-- ---------------------------------------------------------------------------

create function public.is_member(org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.memberships m where m.org_id = org and m.user_id = auth.uid()
  );
$$;

create function public.is_owner(org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.memberships m
    where m.org_id = org and m.user_id = auth.uid() and m.role = 'owner'
  );
$$;

alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.categories enable row level security;
alter table public.vendors enable row level security;
alter table public.jobs enable row level security;

create policy "members read their company" on public.organizations
  for select to authenticated using (public.is_member(id));
create policy "owners rename their company" on public.organizations
  for update to authenticated using (public.is_owner(id)) with check (public.is_owner(id));

create policy "members see their team" on public.memberships
  for select to authenticated using (public.is_member(org_id));
create policy "users update their own name" on public.memberships
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "members manage categories" on public.categories
  for all to authenticated using (public.is_member(org_id)) with check (public.is_member(org_id));
create policy "members manage vendors" on public.vendors
  for all to authenticated using (public.is_member(org_id)) with check (public.is_member(org_id));
create policy "members manage jobs" on public.jobs
  for all to authenticated using (public.is_member(org_id)) with check (public.is_member(org_id));

-- Users may only change their display name, never their company or role.
revoke update on public.memberships from authenticated;
grant update (full_name) on public.memberships to authenticated;
revoke update on public.organizations from authenticated;
grant update (name) on public.organizations to authenticated;

revoke all on public.organizations, public.memberships, public.categories, public.vendors, public.jobs from anon;

-- ---------------------------------------------------------------------------
-- New sign-ups (email or Google): create the company, make the user its owner, add default
-- categories. Google sign-ups have no company name yet; the app asks for one after login.
-- ---------------------------------------------------------------------------

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_org uuid;
begin
  insert into public.organizations (name)
  values (coalesce(nullif(trim(new.raw_user_meta_data ->> 'company_name'), ''), 'My company'))
  returning id into new_org;

  insert into public.memberships (org_id, user_id, role, full_name)
  values (new_org, new.id, 'owner', coalesce(trim(coalesce(
    new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')), ''));

  insert into public.categories (org_id, name)
  select new_org, c
  from unnest(array[
    'Oil & gas services', 'Logistics & dispatch', 'Equipment supply', 'Maintenance',
    'HSE services', 'IT services', 'Catering', 'Security'
  ]) as c;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
