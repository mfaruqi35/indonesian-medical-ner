import json
import os
import time
import google.generativeai as genai

from dotenv import load_dotenv
load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemma-3-27b-it")

PROMPT_TEMPLATE = """Kamu adalah sistem anotasi NER medis. Berikan anotasi entitas medis dari teks keluhan pasien berikut.

Label yang digunakan:
- GEJALA: keluhan atau gejala yang dirasakan
- PENYAKIT: nama penyakit atau kondisi medis
- OBAT: nama obat yang dikonsumsi
- DURASI: rentang waktu keluhan berlangsung
- LOKASI: bagian tubuh yang terdampak
- TINDAKAN: prosedur medis atau tindakan yang dilakukan

Ketentuan:
- Token harus sama persis dengan teks aslinya
- Satu token bisa terdiri dari beberapa kata jika membentuk satu entitas
- Hanya anotasi entitas yang benar-benar ada dalam teks
- Kalau tidak ada entitas yang ditemukan, kembalikan annotations sebagai array kosong

Output harus berupa JSON saja, tanpa penjelasan, tanpa markdown, tanpa teks tambahan apapun.

Format output:
{
  "text": "<teks asli>",
  "annotations": [
    {"token": "<token>", "label": "<label>"}
  ]
}

Teks:
"""

def annotate(text):
    try:
        response = model.generate_content(PROMPT_TEMPLATE + text)
        raw = response.text.strip()
        raw = raw.replace("```json", "").replace("```", "").strip()
        return json.loads(raw)
    except Exception as e:
        print(f"Error: {e}")
        return None

# load scraped data
with open("data/raw/scraped/alodokter.json", "r", encoding="utf-8") as f:
    scraped = json.load(f)

output_file = "data/processed/annotated.json"
os.makedirs("data/processed", exist_ok=True)

# load existing results kalau ada
if os.path.exists(output_file):
    with open(output_file, "r", encoding="utf-8") as f:
        results = json.load(f)
    annotated_urls = {r["url"] for r in results}
    print(f"Loaded {len(results)} existing annotations")
else:
    results = []
    annotated_urls = set()
    print("Starting fresh")

for i, item in enumerate(scraped):
    if item["url"] in annotated_urls:
        print(f"[{i+1}/{len(scraped)}] SKIP (already annotated)")
        continue

    result = annotate(item["text"])
    if result:
        result["url"] = item["url"]
        results.append(result)
        print(f"[{i+1}/{len(scraped)}] OK: {len(result['annotations'])} entities found")
    else:
        print(f"[{i+1}/{len(scraped)}] FAIL: {item['url'].split('/')[-1][:50]}")

    # save setiap 10 data
    if (i + 1) % 10 == 0:
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        print(f"--- Checkpoint saved: {len(results)} records ---")

    time.sleep(1)

# save final
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print(f"Done. Total annotated: {len(results)}")