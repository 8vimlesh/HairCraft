import sys
import os

# Add the backend directory to sys.path so 'app' can be imported
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# pyrefly: ignore [missing-import]
from app.main import app
