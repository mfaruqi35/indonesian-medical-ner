from fastapi import FastAPI
from pydantic import BaseModel

from app.services.ner import predict_entities

app = FastAPI()


class PredictionRequest(BaseModel):
    text: str


@app.get("/")
def root():
    return {
        "message": "Indonesian Medical NER API"
    }


@app.post("/predict")
def predict(request: PredictionRequest):
    entities = predict_entities(request.text)

    return {
        "text": request.text,
        "entities": entities
    }