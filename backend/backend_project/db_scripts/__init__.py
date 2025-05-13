from .db_api import LibraryAPI
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, 'my_db.sqlite3')

library_api = LibraryAPI(DB_PATH)
