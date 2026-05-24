from __future__ import annotations

from app.database import DB_PATH
from app.seed import insert_seed_data


def reset_demo_data() -> None:
    if DB_PATH.exists():
        DB_PATH.unlink()
    insert_seed_data()


if __name__ == "__main__":
    reset_demo_data()
    print("Reset local STOA demo database")
