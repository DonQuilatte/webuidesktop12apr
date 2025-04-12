import os
import json
import tempfile
import shutil
import pytest
from fastapi.testclient import TestClient

from backend.main import app, PREFERENCES_FILE, TELEMETRY_FILE

client = TestClient(app)

import backend.main # Import the module to monkeypatch

@pytest.fixture(autouse=True)
def patch_file_paths(monkeypatch, tmp_path):
    """Patches the file path constants in the main module for test isolation."""
    test_prefs_path = tmp_path / "preferences.json"
    test_telemetry_path = tmp_path / "telemetry.log"
    
    # Initialize preferences file with defaults for consistent starting state
    test_prefs_path.write_text(json.dumps({"telemetry": False, "theme": "light"}))
    # Ensure telemetry file exists for tests that might read it initially (though current tests don't)
    # test_telemetry_path.touch() # Let the API create it
    
    monkeypatch.setattr(backend.main, 'PREFERENCES_FILE', str(test_prefs_path))
    monkeypatch.setattr(backend.main, 'TELEMETRY_FILE', str(test_telemetry_path))
    
    # Yield the paths for potential direct use in tests if needed, though patching is preferred
    yield {
        "prefs_file": test_prefs_path,
        "telemetry_file": test_telemetry_path
    }
    # No explicit cleanup needed for tmp_path files, pytest handles it.
    # Monkeypatch automatically reverts changes after the test.

def test_preferences_get_and_post(): # Remove temp_files argument
    # Initial GET should return defaults
    resp = client.get("/preferences")
    assert resp.status_code == 200
    data = resp.json()
    assert data["telemetry"] is False
    assert data["theme"] == "light"

    # POST new preferences
    new_prefs = {"telemetry": True, "theme": "dark"}
    resp = client.post("/preferences", json=new_prefs)
    assert resp.status_code == 200
    assert resp.json()["status"] == "updated"

    # GET should return updated preferences
    resp = client.get("/preferences")
    assert resp.status_code == 200
    data = resp.json()
    assert data == new_prefs

def test_onboarding_post(): # Remove temp_files argument
    # POST onboarding data (same schema as preferences)
    onboarding_data = {"telemetry": True, "theme": "dark"}
    resp = client.post("/onboarding", json=onboarding_data)
    assert resp.status_code == 200
    assert resp.json()["status"] == "saved"

    # Should persist to preferences file
    resp = client.get("/preferences")
    assert resp.status_code == 200
    assert resp.json() == onboarding_data

def test_telemetry_post(tmp_path): # Add tmp_path argument
    # POST telemetry event
    telemetry = {"event": "test_event", "details": {"foo": "bar"}}
    resp = client.post("/telemetry", json=telemetry)
    assert resp.status_code == 200
    assert resp.json()["status"] in ("received", "logged_with_error")

    # Check that the event was logged
    # Get the patched path (monkeypatch handles this implicitly in main.py, but we need it for assertion)
    telemetry_file_path = tmp_path / "telemetry.log" 
    assert telemetry_file_path.exists(), f"Telemetry log file {telemetry_file_path} was not created"
    with open(telemetry_file_path, "r") as f:
        lines = f.readlines()
    assert any('"event": "test_event"' in line for line in lines)


@pytest.mark.parametrize(
    "invalid_prefs",
    [
        {"telemetry": "not-a-boolean", "theme": "light"},  # Invalid type for telemetry
        {"telemetry": False, "theme": "invalid-theme"},  # Invalid value for theme
        {"telemetry": True},  # Missing theme
        {"theme": "dark"},  # Missing telemetry
        {},  # Empty object
        {"telemetry": False, "theme": "light", "extra": "field"}, # Extra field (FastAPI might ignore this by default)
    ],
)
def test_preferences_post_invalid_data(invalid_prefs):
    """Tests POST /preferences with various invalid data payloads."""
    resp = client.post("/preferences", json=invalid_prefs)
    assert resp.status_code == 422  # Unprocessable Entity


@pytest.mark.parametrize(
    "invalid_data",
    [
        {"telemetry": "not-a-boolean", "theme": "light"},
        {"telemetry": False, "theme": "invalid-theme"},
        {"telemetry": True},
        {"theme": "dark"},
        {},
    ],
)
def test_onboarding_post_invalid_data(invalid_data):
    """Tests POST /onboarding with various invalid data payloads."""
    resp = client.post("/onboarding", json=invalid_data)
    assert resp.status_code == 422


@pytest.mark.parametrize(
    "invalid_telemetry",
    [
        {"event": "test"},  # Missing details
        {"details": {"a": 1}}, # Missing event
        {"event": 123, "details": {}}, # Invalid event type
        {"event": "test", "details": "not-a-dict"}, # Invalid details type
        {}, # Empty object
    ],
)
def test_telemetry_post_invalid_data(invalid_telemetry):
    """Tests POST /telemetry with various invalid data payloads."""
    resp = client.post("/telemetry", json=invalid_telemetry)
    assert resp.status_code == 422
