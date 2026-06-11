import json
import os
import time
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

PROMPT_TEMPLATE = """Tugas: anotasi NER medis. Output HARUS berupa JSON saja, tidak ada teks lain sama sekali.

Label:
- GEJALA: keluhan atau gejala yang dirasakan
- PENYAKIT: nama penyakit atau kondisi medis
- OBAT: nama obat yang dikonsumsi
- DURASI: rentang waktu keluhan berlangsung
- LOKASI: bagian tubuh yang terdampak
- TINDAKAN: prosedur medis atau tindakan yang dilakukan

Aturan:
- Token harus sama persis dengan teks aslinya
- Hanya anotasi entitas yang ada dalam teks
- Kalau tidak ada entitas, kembalikan annotations sebagai array kosong

Contoh output:
{"text": "Sudah tiga hari perut saya nyeri, minum paracetamol tapi belum membaik.", "annotations": [{"token": "tiga hari", "label": "DURASI"}, {"token": "perut", "label": "LOKASI"}, {"token": "nyeri", "label": "GEJALA"}, {"token": "paracetamol", "label": "OBAT"}]}

Sekarang anotasi teks ini dan output JSON saja:
"""

def annotate(text):
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": PROMPT_TEMPLATE + text}],
            temperature=0.1
        )
        raw = response.choices[0].message.content.strip()
        raw = raw.replace("```json", "").replace("```", "").strip()
        return json.loads(raw)
    except Exception as e:
        print(f"Error: {e}")
        return None

with open("data/raw/scraped/alodokter.json", "r", encoding="utf-8") as f:
    scraped = json.load(f)

output_file = "data/processed/annotated.json"
os.makedirs("data/processed", exist_ok=True)

if os.path.exists(output_file):
    with open(output_file, "r", encoding="utf-8") as f:
        results = json.load(f)
    annotated_urls = {r["url"] for r in results}
    print(f"Loaded {len(results)} existing annotations")
else:
    results = []
    annotated_urls = set()
    print("Starting fresh")

for i, item in enumerate(scraped[:750]):
    if item["url"] in annotated_urls:
        print(f"[{i+1}/750] SKIP (already annotated)")
        continue

    result = annotate(item["text"])
    if result:
        result["url"] = item["url"]
        results.append(result)
        print(f"[{i+1}/750] OK: {len(result['annotations'])} entities found")
    else:
        print(f"[{i+1}/750] FAIL: {item['url'].split('/')[-1][:50]}")

    if (i + 1) % 10 == 0:
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        print(f"--- Checkpoint saved: {len(results)} records ---")

    time.sleep(0.5)

with open(output_file, "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print(f"Done. Total annotated: {len(results)}")