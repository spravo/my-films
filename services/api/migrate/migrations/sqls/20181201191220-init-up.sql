begin;

create schema private;

create table public.person (
	id serial primary key,
  name text,
	create_at timestamp not null default now()
);

create table private.person_account (
	person_id integer primary key references public.person(id) on delete cascade,
	googleId text not null unique
);

create function private.register_person (googleId text, name text) returns public.person as $$
declare
person public.person;
begin
  insert into public.person (name)
    values (name)
    returning * into person;
  insert into private.person_account (person_id, googleId)
    values (person.id, googleId);
  return person;	
end;
$$ language plpgsql strict security definer;


create table public.media (
  id serial primary key,
  tmdb_id integer not null
);

create table public.watch_status (
  id serial primary key,
  name text
);

insert into public.watch_status (name) values
('looked'),('will watch');

create table public.person_mapping_media (
  person_id integer references public.person(id) on delete cascade,
  media_id integer references public.media(id) on delete cascade,
  watch_id integer references public.watch_status(id) on delete cascade
);

create function public.get_user_media_by_watch_status_id (p_watch_status_id integer, p_person_id integer) returns public.media as $$
declare
  v_media public.media;
begin
  select media.* into v_media
  from public.media
    inner join public.person_mapping_media as mapping on mapping.media_id = media.id
  where mapping.watch_id = p_watch_status_id and mapping.person_id = p_person_id;

  return v_media;
end;
$$ language plpgsql strict security definer;

commit;
