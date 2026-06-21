import sys
import os
import uvicorn

# Add root folder to sys.path to resolve imports correctly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

if __name__ == '__main__':
    print("Running Indonesian Medical NER Demo on http://127.0.0.1:5000/")
    uvicorn.run("app.main:app", host="127.0.0.1", port=5000, reload=True)
