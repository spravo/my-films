begin;

create schema my_films;
create schema my_films_private;

create table my_films.person (
	id serial primary key,
  name text,
	create_at timestamp not null default now()
);

create table my_films_private.person_account (
	person_id integer primary key references my_films.person(id) on delete cascade,
	googleId text not null unique
);

create function my_films_private.register_person (googleId text, name text) returns my_films.person as $$
declare
person my_films.person;
begin
  insert into my_films.person (name) 
    values (name)
    returning * into person;
  insert into my_films_private.person_account (person_id, googleId)
    values (person.id, googleId);
  return person;	
end;
$$ language plpgsql strict security definer;

commit;
