import os
import pickle
import numpy as np
import tensorflow as tf
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List

# ─── Paths ──────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
_parent = os.path.join(BASE_DIR, "..")
# Works both locally (programs/ siblings to backend/) and on Render (all at repo root)
PROGRAMS_DIR = os.path.join(_parent, "programs") if os.path.isdir(os.path.join(_parent, "programs")) else os.path.join(BASE_DIR, "programs")
IMAGES_DIR   = os.path.join(_parent, "isl_images") if os.path.isdir(os.path.join(_parent, "isl_images")) else os.path.join(BASE_DIR, "isl_images")

# ─── Load model & label encoder ────────────────────────
model = tf.keras.models.load_model(os.path.join(PROGRAMS_DIR, "isl_model_36_signs.h5"))

with open(os.path.join(PROGRAMS_DIR, "label_encoder.pkl"), "rb") as f:
    label_encoder = pickle.load(f)

print(f"✅ Model loaded. Classes: {list(label_encoder.classes_)}")

# ─── FastAPI app ────────────────────────────────────────
app = FastAPI(title="SaigaiOli API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Schemas ────────────────────────────────────────────
class PredictRequest(BaseModel):
    landmarks: List[float]

class PredictResponse(BaseModel):
    sign: str
    confidence: float

# ─── Routes ─────────────────────────────────────────────
@app.get("/")
def root():
    return {"message": "ISL Recognition API is running 🤟"}


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    """
    Receives 84 landmark floats (2 hands × 21 landmarks × 2 coords),
    runs model inference, returns predicted sign and confidence.
    """
    landmarks = req.landmarks
    max_len = 84

    # Pad or trim to 84 features
    if len(landmarks) < max_len:
        landmarks += [0.0] * (max_len - len(landmarks))
    else:
        landmarks = landmarks[:max_len]

    data = np.array([landmarks])
    prediction = model.predict(data, verbose=0)
    class_id = int(np.argmax(prediction))
    confidence = float(np.max(prediction))

    if confidence > 0.60:
        sign = label_encoder.inverse_transform([class_id])[0]
    else:
        sign = "?"

    return PredictResponse(sign=sign, confidence=round(confidence, 4))


@app.get("/signs")
def get_signs():
    """Returns all 36 sign labels (A-Z, 0-9)."""
    signs = sorted(list(label_encoder.classes_))
    return {"signs": signs}


@app.get("/isl-images/{sign}")
def get_isl_image(sign: str):
    """
    Serves one representative ISL reference image for the given sign.
    Uses the first image file from isl_images/<sign>/ folder.
    """
    sign = sign.upper()
    sign_dir = os.path.join(IMAGES_DIR, sign)

    if not os.path.isdir(sign_dir):
        raise HTTPException(status_code=404, detail=f"No images found for sign: {sign}")

    # Get first image alphabetically
    images = sorted([f for f in os.listdir(sign_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))])
    if not images:
        raise HTTPException(status_code=404, detail=f"No image files in folder for sign: {sign}")

    img_path = os.path.join(sign_dir, images[0])
    ext = images[0].rsplit('.', 1)[-1].lower()
    mime = "image/png" if ext == "png" else "image/jpeg"

    return FileResponse(
        img_path,
        media_type=mime,
        headers={
            "Cache-Control": "public, max-age=86400",
            "Access-Control-Allow-Origin": "*",
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
