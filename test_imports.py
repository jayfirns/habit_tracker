import sys
import os

# Add the project root to sys.path
# This script is in the root, so os.getcwd() is the project root
sys.path.insert(0, os.getcwd())

try:
    from backend.database import Base, engine
    from backend.models import Habit, Completion
    print("Successfully imported backend.database and backend.models.")
    # Optional: Try to do something with them to confirm they are functional
    # e.g., print(Base.metadata.tables.keys())
except ImportError as e:
    print(f"ImportError: {e}")
    print("sys.path:", sys.path)
except Exception as e:
    print(f"An unexpected error occurred: {e}")

