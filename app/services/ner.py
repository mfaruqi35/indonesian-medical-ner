from transformers import pipeline

ner_pipeline = pipeline(
    "token-classification",
    model="mfaruqi/indonesian-medical-ner",
    aggregation_strategy="simple"
)

def predict_entities(text: str):
    results = ner_pipeline(text)

    entities = []

    for item in results:
        entities.append({
            "text": item["word"],
            "label": item["entity_group"],
            "score": round(float(item["score"]), 4),
            "start": int(item["start"]),
            "end": int(item["end"])
        })

    return entities