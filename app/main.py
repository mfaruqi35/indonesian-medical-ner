from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.services.ner import predict_entities

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="app/static"), name="static")

class PredictionRequest(BaseModel):
    text: str


@app.get("/")
def root():
    return FileResponse("app/templates/index.html")


@app.post("/predict")
def predict(request: PredictionRequest):
    entities = predict_entities(request.text)

    return {
        "text": request.text,
        "entities": entities
    }