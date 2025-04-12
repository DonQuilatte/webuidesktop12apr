from fastapi import FastAPI, HTTPException
import uvicorn
from fastapi import Body
from pydantic import BaseModel, ConfigDict
from typing import Literal # Import Literal
import json
import os
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

PREFERENCES_FILE = 'preferences.json'
TELEMETRY_FILE = 'telemetry.log'

class Preferences(BaseModel):
    telemetry: bool
    theme: Literal["light", "dark"] # Use Literal for theme
    model_config = ConfigDict(extra='forbid') # Forbid extra fields

def load_preferences() -> Preferences:
    """Loads preferences from the JSON file, returning defaults if not found or invalid."""
    if os.path.exists(PREFERENCES_FILE):
        try:
            with open(PREFERENCES_FILE, 'r') as f:
                data = json.load(f)
                return Preferences(**data)
        except (json.JSONDecodeError, IOError, TypeError) as e:
            logger.error(f"Error loading preferences file '{PREFERENCES_FILE}': {e}. Returning defaults.")
            # Fall through to return defaults if file is corrupted or unreadable
    return Preferences(telemetry=False, theme='light')

def save_preferences(prefs: Preferences):
    """Saves preferences to the JSON file."""
    try:
        with open(PREFERENCES_FILE, 'w') as f:
            json.dump(prefs.model_dump(), f, indent=2) # Use model_dump() instead of dict()
    except IOError as e:
        logger.error(f"Error saving preferences file '{PREFERENCES_FILE}': {e}")
        raise HTTPException(status_code=500, detail="Failed to save preferences")

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

@app.get("/preferences", response_model=Preferences)
def get_preferences():
    """Retrieve current user preferences."""
    # load_preferences now handles potential errors internally and returns defaults
    prefs = load_preferences()
    return prefs

@app.post("/preferences")
def set_preferences(prefs: Preferences = Body(...)):
    """Update user preferences."""
    # save_preferences will raise HTTPException on failure
    save_preferences(prefs)
    return {"status": "updated"}

# Telemetry endpoint
class TelemetryData(BaseModel):
    event: str
    details: dict # Make details required by removing default
    model_config = ConfigDict(extra='forbid') # Forbid extra fields

@app.post("/telemetry")
def submit_telemetry(data: TelemetryData = Body(...)):
    """Receive and log telemetry data locally."""
    try:
        # For privacy, just log to a local file
        with open(TELEMETRY_FILE, "a") as f:
            f.write(json.dumps(data.model_dump()) + "\n") # Use model_dump() instead of dict()
        return {"status": "received"}
    except IOError as e:
        logger.error(f"Error writing to telemetry log '{TELEMETRY_FILE}': {e}")
        # Don't necessarily fail the request, but log the error
        return {"status": "logged_with_error"}


if __name__ == "__main__":
    logger.info("Starting backend server on port 5002")
    uvicorn.run(app, host="127.0.0.1", port=5002)
