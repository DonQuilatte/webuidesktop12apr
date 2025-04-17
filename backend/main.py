from fastapi import FastAPI, HTTPException
import uvicorn
from fastapi import Body
from pydantic import BaseModel, ConfigDict, field_validator # Import field_validator
from typing import Literal # Import Literal
import json
import os
import logging
from logging.handlers import RotatingFileHandler
import threading # Import threading
import platformdirs # Import platformdirs

# App identifiers for platformdirs
APP_NAME = "OpenWebUIOnboarding"
APP_AUTHOR = "OpenWebUI"

# Configuration (can be overridden by environment variables)
# Use platformdirs for standard locations
PREFERENCES_DIR = platformdirs.user_data_dir(APP_NAME, APP_AUTHOR)
LOG_DIR = platformdirs.user_log_dir(APP_NAME, APP_AUTHOR)

PREFERENCES_FILE = os.getenv('PREFERENCES_FILE_PATH', os.path.join(PREFERENCES_DIR, 'preferences.json'))
TELEMETRY_FILE = os.getenv('TELEMETRY_FILE_PATH', os.path.join(LOG_DIR, 'telemetry.log'))

# Ensure log and preferences directories exist
try:
    if not os.path.exists(PREFERENCES_DIR):
        os.makedirs(PREFERENCES_DIR)
    if not os.path.exists(LOG_DIR):
        os.makedirs(LOG_DIR)
except OSError as e:
    print(f"Warning: Could not create directories {PREFERENCES_DIR} or {LOG_DIR}: {e}")

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Lock for preferences file access
preferences_lock = threading.Lock()

class Preferences(BaseModel):
    telemetry: bool
    theme: Literal["light", "dark"] # Use Literal for theme
    model_config = ConfigDict(extra='forbid') # Forbid extra fields

def load_preferences() -> Preferences:
    """Loads preferences from the JSON file, returning defaults if it doesn't exist or is invalid."""
    with preferences_lock: # Acquire lock
        if os.path.exists(PREFERENCES_FILE):
            try:
                with open(PREFERENCES_FILE, 'r') as f:
                    data = json.load(f)
                    return Preferences(**data)
            except json.JSONDecodeError as e:
                # Handle JSONDecodeError specifically
                logger.error(f"Error decoding JSON from '{PREFERENCES_FILE}': {e}. Returning defaults.")
                return Preferences(telemetry=False, theme='light') # Return defaults
            except Exception as e:
                logger.error(f"Unexpected error loading preferences file '{PREFERENCES_FILE}': {e}. Returning defaults.")
                return Preferences(telemetry=False, theme='light') # Return defaults
        else:
            logger.info(f"Preferences file '{PREFERENCES_FILE}' not found. Returning defaults.")
            return Preferences(telemetry=False, theme='light') # Return defaults

def save_preferences(prefs: Preferences):
    """Saves preferences to the JSON file."""
    with preferences_lock: # Acquire lock
        try:
            with open(PREFERENCES_FILE, 'w') as f:
                json.dump(prefs.model_dump(), f, indent=2) # Use model_dump() instead of dict()
            logger.info(f"Preferences saved to '{PREFERENCES_FILE}'")
        except IOError as e:
            logger.error(f"Error writing preferences to '{PREFERENCES_FILE}': {e}")
            raise HTTPException(status_code=500, detail=f"Could not save preferences: {e}")
        except Exception as e:
            logger.error(f"Unexpected error saving preferences to '{PREFERENCES_FILE}': {e}")
            raise HTTPException(status_code=500, detail=f"An unexpected error occurred while saving preferences: {e}")

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
    details: dict
    model_config = ConfigDict(extra='forbid') # Keep extra='forbid'

    @field_validator('event')
    @classmethod
    def check_event_not_empty(cls, v: str): # Keep non-empty check
        # Basic check for non-empty string, type check moved to endpoint
        if not v:
            raise ValueError('event cannot be empty')
        return v

@app.post("/telemetry")
def submit_telemetry(data: TelemetryData = Body(...)):
    """Receive and log telemetry data locally."""
    # Explicit type checks within the endpoint
    if not isinstance(data.event, str):
        raise HTTPException(status_code=422, detail="Invalid type for 'event', expected string.")
    if not isinstance(data.details, dict):
        raise HTTPException(status_code=422, detail="Invalid type for 'details', expected dictionary.")

    try:
        # For privacy, just log to a local file
        with open(TELEMETRY_FILE, "a") as f:
            f.write(json.dumps(data.model_dump()) + "\n") # Use model_dump() instead of dict()
        return {"status": "received"}
    except IsADirectoryError as e:
        logger.error(f"Telemetry log path '{TELEMETRY_FILE}' is a directory: {e}")
        raise HTTPException(status_code=500, detail=f"Telemetry log path is a directory.")
    except IOError as e:
        logger.error(f"Error writing to telemetry log '{TELEMETRY_FILE}': {e}")
        # Don't necessarily fail the request, but log the error
        return {"status": "logged_with_error"}


if __name__ == "__main__":
    logger.info("Starting backend server on port 5002")
    uvicorn.run(app, host="127.0.0.1", port=5002)
