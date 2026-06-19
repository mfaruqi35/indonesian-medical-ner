# Indonesian Medical NER

Dataset: https://huggingface.co/datasets/mfaruqi/indonesian-medical-ner
Model: https://huggingface.co/mfaruqi/indonesian-medical-ner

```
indonesian-medical-ner/
│
├── app/                         # aplikasi web
│   ├── main.py
│   │
│   ├── services/
│   │   └── ner.py              # load model + inference
│   │
│   ├── templates/
│   │   └── index.html
│   │
│   ├── static/
│   │   ├── css/
│   │   │   └── style.css
│   │   └── js/
│   │       └── app.js
│   │
│   └── utils/
│       └── postprocess.py
│
├── data/
│   ├── processed/
│   │   ├── bio/
│   │   └── id_medical_ner.json
│   │
│   └── raw/
│       └── scraped/
│           └── alodokter.json
│
├── notebook/
│   └── indonesian-medical-ner.ipynb
│
├── src/                        # pipeline research/training
│   ├── annotate.py
│   ├── scraper.py
│   ├── preprocess.py
│   ├── convert_bio.py
│   └── train.py
│
├── .env
├── .gitignore
├── README.md
├── requirements.txt
└── run.py

```
