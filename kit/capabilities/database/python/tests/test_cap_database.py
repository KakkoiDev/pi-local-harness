"""Database (a capability chosen in Project Start): the migrations are numbered and apply, once, to a fresh database."""
import re
import tempfile
import unittest
from pathlib import Path

from app.db import connect

ROOT = Path(__file__).resolve().parent.parent


class DatabaseTest(unittest.TestCase):
    def test_migrations_are_numbered_from_001_without_gaps(self) -> None:
        names = sorted(path.name for path in (ROOT / "migrations").glob("*.sql"))
        self.assertTrue(names, "migrations/ has no .sql file")
        numbers = [int(found.group(1)) for name in names if (found := re.match(r"(\d{3})-", name))]
        self.assertEqual(numbers, list(range(1, len(names) + 1)), f"name them 001-…, 002-…: {names}")

    def test_every_migration_applies_once_to_a_fresh_database(self) -> None:
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "test.sqlite3"
            connect(path).close()
            again = connect(path)  # opening it again applies nothing twice
            try:
                applied = [str(row[0]) for row in again.execute("select name from migrations order by name")]
                tables = [str(row[0]) for row in again.execute("select name from sqlite_master where type = 'table' and name != 'migrations'")]
            finally:
                again.close()
        self.assertEqual(applied, sorted(path.name for path in (ROOT / "migrations").glob("*.sql")))
        self.assertTrue(tables, "the migrations create no table")


if __name__ == "__main__":
    unittest.main()
