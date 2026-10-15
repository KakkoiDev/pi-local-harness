create table notes (
  id integer primary key,
  title text not null,
  created text not null default (datetime('now'))
);
