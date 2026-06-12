import json
import os
import time
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

PROMPT_TEMPLATE = """Tugas: anotasi NER medis pada teks keluhan pasien berbahasa Indonesia. Output HARUS berupa JSON saja, tidak ada teks lain sama sekali.

Label yang tersedia:
- GEJALA: keluhan atau gejala yang dirasakan pasien secara subjektif (contoh: nyeri, pusing, mual, gatal, sesak napas)
- PENYAKIT: nama penyakit atau kondisi medis yang didiagnosis atau disebutkan (contoh: diabetes, hipertensi, maag, ketombe)
- OBAT: nama obat atau suplemen yang dikonsumsi (contoh: paracetamol, ibuprofen, biotin, amlodipin)
- DURASI: rentang waktu keluhan berlangsung (contoh: tiga hari, sejak kemarin, beberapa minggu terakhir, akhir-akhir ini)
- LOKASI: bagian tubuh yang terdampak (contoh: perut, kepala, lutut, kulit kepala, tuba falopi)
- TINDAKAN: prosedur medis atau tindakan yang dilakukan atau disarankan (contoh: operasi, biopsi, HSG, vaksin, kemoterapi)

Aturan penting:
- Token harus sama persis dengan teks aslinya, tidak boleh diubah
- Satu token bisa terdiri dari beberapa kata jika membentuk satu entitas
- Hanya anotasi entitas yang benar-benar ada dan relevan dalam teks
- Jangan anotasi gejala yang disebutkan sebagai tidak ada (contoh: "tidak ada demam" -- demam tidak dianotasi)
- Jangan anotasi kekhawatiran hipotetis sebagai gejala (contoh: "takut sakit" -- sakit tidak dianotasi)
- Jangan duplikasi token yang sama, pilih yang paling spesifik
- Kalau tidak ada entitas yang relevan, kembalikan annotations sebagai array kosong
- Usia pasien bukan DURASI
- Fase kehamilan (trimester, bulan kehamilan) bukan DURASI

Format output (JSON saja, tanpa markdown, tanpa penjelasan):
{
  "text": "<teks asli>",
  "annotations": [
    {"token": "<token>", "label": "<label>"}
  ],
"url": "<url sumber keluhan>" 
}

Contoh:
Input: "Sudah tiga hari perut saya nyeri dan mual, sudah minum paracetamol tapi belum membaik."
Output: {"text": "Sudah tiga hari perut saya nyeri dan mual, sudah minum paracetamol tapi belum membaik.", "annotations": [{"token": "tiga hari", "label": "DURASI"}, {"token": "perut", "label": "LOKASI"}, {"token": "nyeri", "label": "GEJALA"}, {"token": "mual", "label": "GEJALA"}, {"token": "paracetamol", "label": "OBAT"}], "url": "url sumber keluhan"}

Sekarang anotasi teks berikut dan output JSON saja: 
"""

def annotate(text):
    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
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

total = len(scraped)
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

for i, item in enumerate(scraped):
    if item["url"] in annotated_urls:
        print(f"[{i+1}/{total}] SKIP (already annotated)")
        continue

    result = annotate(item["text"])
    if result:
        result["url"] = item["url"]
        results.append(result)
        print(f"[{i+1}/{total}] OK: {len(result['annotations'])} entities found")
    else:
        print(f"[{i+1}/{total}] FAIL: {item['url'].split('/')[-1][:50]}")

    if (i + 1) % 10 == 0:
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        print(f"--- Checkpoint saved: {len(results)} records ---")

    time.sleep(0.5)

with open(output_file, "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print(f"Done. Total annotated: {len(results)}")