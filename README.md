# Indonesian Medical Named Entity Recognition (NER)

An end-to-end Machine Learning web application designed to identify and extract medical entity categories from raw Indonesian patient complaints. The underlying token classification model is fine-tuned from `indobenchmark/indobert-base-p1` on a scraped and annotated corpus of inquiries from Alodokter.com. 

The model classifies text tokens into 5 clinical entity categories:
*   **GEJALA** (Symptoms)
*   **LOKASI** (Anatomy/Location of complaints)
*   **PENYAKIT** (Diseases/Illnesses)
*   **OBAT** (Medication/Drugs)
*   **TINDAKAN** (Clinical Actions/Procedures)

---

## Simple Tech Stack

*   **Frontend**: HTML5 (Semantic layout), Vanilla CSS3 (Custom design system, slide-out overlay drawer, white/blue toggle indicators), Vanilla JavaScript (ES6+ AJAX Fetch integration, character offset highlight parser).
*   **Backend**: FastAPI (Python ASGI framework), Pydantic (Request validation), Uvicorn (Server runtime).
*   **NLP & ML**: PyTorch, Hugging Face Transformers & Tokenizers.
*   **Data Pipeline**: BeautifulSoup/Selenium (Scrapers), Pandas, Jupyter Notebook.

---

## Directory Structure

```markdown
indonesian-medical-ner/
├── app/                      # Web Application Directory
│   ├── main.py               # FastAPI backend entrypoint & router
│   ├── services/
│   │   └── ner.py            # Model loader and inference service
│   ├── static/               # Static Web Assets
│   │   ├── css/
│   │   │   └── style.css     # Theme variables, responsive layouts, & overlays
│   │   ├── js/
│   │   │   └── app.js        # DOM events, API integration, & drawer toggles
│   │   └── cm.webp           # Model evaluation Confusion Matrix image
│   ├── templates/
│   │   └── index.html        # Main dashboard and settings drawer markup
│   └── utils/
│       └── postprocess.py    # Text segment markers and mapping helpers
├── data/                     # Scraped & Cleaned Data Files
│   ├── processed/
│   │   ├── bio/              # Token classification bio-tagged datasets
│   │   └── id_medical_ner.json
│   └── raw/
│       └── scraped/
│           └── alodokter.json # Raw scraped data from Alodokter.com
├── notebook/                 # Training Sandbox
│   └── indonesian-medical-ner.ipynb # Fine-tuning pipeline
├── src/                      # Research/Training Pipeline Scripts
│   ├── annotate.py           # Semi-supervised dataset annotator
│   └── scraper.py            # Scraper utility for Alodokter
│
├── .env                      # Environment configurations
├── .gitignore                # Git untracked pattern file
├── requirements.txt          # Python packages dependency list
└── run.py                    # Server startup script
```

---

## Installation & Running the Application

### 1. Prerequisites
Ensure you have **Python 3.8+** installed on your system.

### 2. Clone the Repository
```bash
git clone https://github.com/your-username/indonesian-medical-ner.git
cd indonesian-medical-ner
```

### 3. Setup Virtual Environment (Recommended)
Creating a virtual environment ensures that the project dependencies do not interfere with your global Python installation.

```bash
# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Linux/macOS:
source venv/bin/activate
# On Windows (Command Prompt):
venv\Scripts\activate
# On Windows (PowerShell):
venv\Scripts\Activate.ps1
```

### 4. Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

---

## Running the Web App

The application uses a **unified setup** where the backend (FastAPI) serves the frontend static pages (HTML, CSS, and JS) directly. There is no need to run a separate npm server or build process for the frontend.

To run both the frontend and backend:

#### Option A: Running with the startup script (Recommended)
Simply execute the preconfigured `run.py` script:
```bash
python run.py
```

#### Option B: Running with Uvicorn directly
Run the FastAPI application with Uvicorn:
```bash
uvicorn app.main:app --host 127.0.0.1 --port 5000 --reload
```

### Accessing the Application
Once the server starts:
*   **Frontend Dashboard**: Open your web browser and go to [http://127.0.0.1:5000/](http://127.0.0.1:5000/)
*   **Backend API Documentation (Swagger)**: Go to [http://127.0.0.1:5000/docs](http://127.0.0.1:5000/docs) to test the API endpoints interactively.

---

## API Documentation

### Analyze Complaint
Extracts medical entities from raw text.

*   **URL**: `/predict`
*   **Method**: `POST`
*   **Headers**: `Content-Type: application/json`

#### Request Payload
```json
{
  "text": "Saya mengalami nyeri perut dan sudah minum paracetamol"
}
```

#### Response Payload
```json
{
  "text": "Saya mengalami nyeri perut dan sudah minum paracetamol",
  "entities": [
    {
      "text": "nyeri",
      "label": "GEJALA",
      "score": 0.98,
      "start": 15,
      "end": 20
    },
    {
      "text": "perut",
      "label": "LOKASI",
      "score": 0.95,
      "start": 21,
      "end": 26
    },
    {
      "text": "paracetamol",
      "label": "OBAT",
      "score": 0.99,
      "start": 44,
      "end": 55
    }
  ]
}
```

---

## Hugging Face Resources

*   **Fine-tuned Model (IndoBERT-NER)**: [mfaruqi/indonesian-medical-ner](https://huggingface.co/mfaruqi/indonesian-medical-ner)
*   **Annotated Dataset (Clinical Corpus)**: [mfaruqi/indonesian-medical-ner Dataset](https://huggingface.co/datasets/mfaruqi/indonesian-medical-ner)
