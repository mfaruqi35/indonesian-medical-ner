import sys
import os

# Add root folder to sys.path to resolve imports correctly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.main import app

if __name__ == '__main__':
    print("Running Indonesian Medical NER Demo on http://127.0.0.1:5000/")
    app.run(debug=True, port=5000)
