from fastapi import FastAPI
import uvicorn
from fastapi import Body
from pydantic import BaseModel
import json
import os

PREFERENCES_FILE = 'preferences.json'

class Preferences(BaseModel):
    telemetry: bool
    theme: str

def load_preferences():
    if os.path.exists(PREFERENCES_FILE):
        with open(PREFERENCES_FILE, 'r') as f:
            return Preferences(**json.load(f))
    return Preferences(telemetry=False, theme='light')

def save_preferences(prefs: Preferences):
    with open(PREFERENCES_FILE, 'w') as f:
        json.dump(prefs.dict(), f)

app = FastAPI()

@app.get("/health")
def health_check():
    return {"status": "ok"}
@app.get("/")
def root():
    return {"message": "Backend is running"}
@app.post("/onboarding")
def onboarding(data: Preferences = Body(...)):
    save_preferences(data)
    return {"status": "saved"}

@app.get("/preferences")
def get_preferences():
    prefs = load_preferences()
    return prefs.dict()

@app.post("/preferences")
def set_preferences(prefs: Preferences = Body(...)):
    save_preferences(prefs)
    return {"status": "updated"}

# Telemetry endpoint
class TelemetryData(BaseModel):
    event: str
    details: dict = {}

@app.post("/telemetry")
def submit_telemetry(data: TelemetryData = Body(...)):
    # For privacy, just log to a local file; in a real app, this could be more sophisticated
    with open("telemetry.log", "a") as f:
        f.write(json.dumps(data.dict()) + "\n")
    return {"status": "received"}


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=5002) # Changed port to 5002
