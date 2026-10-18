# Database for Pi (the card)

The project keeps its data in SQLite through `app/db.py`: `connect(path)` opens the file and applies every migration not
yet applied, in name order, recording each in the `migrations` table.

- A change to the data is a new file `migrations/NNN-what.sql` (the next number, three digits). Never edit a migration
  that already ran: add the next one (`alter table`, `create index`, a new table).
- One typed function per question in `app/db.py` (`notes(connection) -> list[Note]`), with parameters (`?`), never
  string formatting into SQL.
- Rules stay in `app/logic/` as pure functions; `app/db.py` only stores and reads.
- `tests/test_cap_database.py` checks the numbering and applies every migration to a fresh database: run it after each
  new migration (`python3 -m unittest tests.test_cap_database`).
