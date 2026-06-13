import requests
from bs4 import BeautifulSoup
import time
import json
import html
import os

os.makedirs("data/raw/scraped", exist_ok=True)

output_file = "data/raw/scraped/alodokter2.json"

if os.path.exists(output_file):
    with open(output_file, "r", encoding="utf-8") as f:
        results = json.load(f)
    print(f"Loaded {len(results)} existing records")
else:
    results = []
    print("Starting fresh")


BASE_URL = "https://www.alodokter.com/komunitas/diskusi/penyakit"
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}

def get_discussion_links(page):
    url = BASE_URL if page == 1 else f"{BASE_URL}/page/{page}"
    res = requests.get(url, headers=HEADERS)
    soup = BeautifulSoup(res.text, "html.parser")
    cards = soup.find_all("card-topic")
    return ["https://www.alodokter.com" + card.get("href") for card in cards if card.get("href")]

def get_complaint_text(url):
    res = requests.get(url, headers=HEADERS)
    soup = BeautifulSoup(res.text, "html.parser")
    detail = soup.find("detail-topic")
    if not detail:
        return None
    raw = detail.get("member-topic-content")
    if not raw:
        return None
    raw = raw.strip('"')
    raw = raw.encode('utf-8').decode('unicode_escape').encode('latin-1').decode('utf-8')

    decoded = html.unescape(raw)
    text = BeautifulSoup(decoded, "html.parser").get_text(separator=" ", strip=True)

    text = text.replace("Â", "").strip()
    return text if text else None

results = []

for page in range(102, 201):
    links = get_discussion_links(page)
    print(f"Page {page}: found {len(links)} links")
    if not links:
        print(f"No more links found at page {page}, stopping.")
        break
    for i, link in enumerate(links):
        text = get_complaint_text(link)
        if text:
            results.append({"url": link, "text": text})
            print(f"  [{i+1}/{len(links)}] OK: {link.split('/')[-1][:50]}")
        else:
            print(f"  [{i+1}/{len(links)}] SKIP: {link.split('/')[-1][:50]}")
        time.sleep(1)
    print(f"Page {page} done, total collected: {len(results)}")
    time.sleep(2)

with open(output_file, "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print(f"Saved {len(results)} records to {output_file}")