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
│   └── indonesian-medical-ner.ipynb # Fine-tuning model notebook
├── src/                      # Research/Training Pipeline Scripts
│   ├── annotate.py           # Semi-supervised dataset annotator
│   ├── scraper.py            # Scraper utility for Alodokter
│   ├── preprocess.py         # Scraping cleaning scripts
│   ├── convert_bio.py        # Tokenizer BIO format converter
│   └── train.py              # IndoBERT training script
├── .env                      # Environment configurations
├── .gitignore                # Git untracked pattern file
├── requirements.txt          # Python packages dependency list
└── run.py                    # Server startup script
```

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
