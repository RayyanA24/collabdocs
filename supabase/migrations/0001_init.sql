-- CollabDocs schema. Run in the Supabase SQL editor (or `supabase db push`).
-- Uses Supabase Auth; no service-role key is needed anywhere in the app.

create table public.profiles (
  id    uuid primary key references auth.users (id) on delete cascade,
  email text not null unique
);

create table public.documents (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references public.profiles (id) on delete cascade,
  title      text not null default 'Untitled document' check (char_length(title) between 1 and 200),
  content    text not null default '' check (char_length(content) <= 500000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index documents_owner_idx on public.documents (owner_id);

create table public.document_shares (
  document_id uuid not null references public.documents (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  role        text not null check (role in ('viewer', 'editor')),
  created_at  timestamptz not null default now(),
  primary key (document_id, user_id)
);
create index document_shares_user_idx on public.document_shares (user_id);

-- ---------------------------------------------------------------- helpers
-- SECURITY DEFINER helpers avoid recursive RLS between documents <-> shares.
create function public.doc_role(doc uuid)
returns text language sql stable security definer set search_path = '' as $$
  select case
    when d.owner_id = auth.uid() then 'owner'
    else (select s.role from public.document_shares s
          where s.document_id = d.id and s.user_id = auth.uid())
  end
  from public.documents d where d.id = doc;
$$;

create function public.shares_with_me(pid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.documents d
    join public.document_shares s on s.document_id = d.id
    where (d.owner_id = auth.uid() and s.user_id = pid)
       or (s.user_id = auth.uid() and d.owner_id = pid)
  );
$$;

-- Exact-match lookup used by the share dialog (no listing of users).
create function public.find_profile_by_email(p_email text)
returns table (id uuid, email text)
language sql stable security definer set search_path = '' as $$
  select p.id, p.email from public.profiles p
  where lower(p.email) = lower(p_email) and auth.uid() is not null;
$$;

-- ---------------------------------------------------------------- triggers
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email) values (new.id, lower(new.email))
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

insert into public.profiles (id, email)
select id, lower(email) from auth.users where email is not null
on conflict (id) do nothing;

create function public.documents_guard()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  if new.owner_id <> old.owner_id then
    raise exception 'owner_id is immutable';
  end if;
  return new;
end $$;
create trigger documents_guard before update on public.documents
  for each row execute function public.documents_guard();

-- --------------------------------------------------------------------- RLS
alter table public.profiles        enable row level security;
alter table public.documents       enable row level security;
alter table public.document_shares enable row level security;

create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.shares_with_me(id));

create policy documents_select on public.documents for select to authenticated
  using (public.doc_role(id) is not null);
create policy documents_insert on public.documents for insert to authenticated
  with check (owner_id = auth.uid());
create policy documents_update on public.documents for update to authenticated
  using (public.doc_role(id) in ('owner', 'editor'))
  with check (public.doc_role(id) in ('owner', 'editor'));
create policy documents_delete on public.documents for delete to authenticated
  using (public.doc_role(id) = 'owner');

create policy shares_select on public.document_shares for select to authenticated
  using (user_id = auth.uid() or public.doc_role(document_id) = 'owner');
create policy shares_insert on public.document_shares for insert to authenticated
  with check (public.doc_role(document_id) = 'owner' and user_id <> auth.uid());
create policy shares_update on public.document_shares for update to authenticated
  using (public.doc_role(document_id) = 'owner')
  with check (public.doc_role(document_id) = 'owner' and user_id <> auth.uid());
create policy shares_delete on public.document_shares for delete to authenticated
  using (public.doc_role(document_id) = 'owner');

revoke all on public.profiles, public.documents, public.document_shares from anon;
grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.documents, public.document_shares to authenticated;
revoke execute on function public.doc_role, public.shares_with_me, public.find_profile_by_email from public, anon;
grant  execute on function public.doc_role, public.shares_with_me, public.find_profile_by_email to authenticated;
