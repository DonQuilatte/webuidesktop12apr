import pytest
from httpx import AsyncClient, ASGITransport
from backend.main import app, Preferences, TelemetryData, PREFERENCES_FILE
import os
import json

# Fixture to ensure a clean state before each test
@pytest.fixture(autouse=True)
def clean_preferences_file():
    if os.path.exists(PREFERENCES_FILE):
        os.remove(PREFERENCES_FILE)
    yield # Test runs here
    if os.path.exists(PREFERENCES_FILE):
        os.remove(PREFERENCES_FILE)

# Fixture to ensure telemetry log is clean
@pytest.fixture(autouse=True)
def clean_telemetry_log():
    log_file = "telemetry.log"
    if os.path.exists(log_file):
        os.remove(log_file)
    yield # Test runs here
    if os.path.exists(log_file):
        os.remove(log_file)


@pytest.mark.asyncio
async def test_get_default_preferences():
    async with AsyncClient(base_url="http://test", transport=ASGITransport(app=app)) as ac:
        response = await ac.get("/preferences")
    assert response.status_code == 200
    assert response.json() == {"telemetry": False, "theme": "light"}

@pytest.mark.asyncio
async def test_set_and_get_preferences():
    new_prefs = {"telemetry": True, "theme": "dark"}
    async with AsyncClient(base_url="http://test", transport=ASGITransport(app=app)) as ac:
        # Set preferences
        response_post = await ac.post("/preferences", json=new_prefs)
        assert response_post.status_code == 200
        assert response_post.json() == {"status": "updated"}

        # Get preferences
        response_get = await ac.get("/preferences")
        assert response_get.status_code == 200
        assert response_get.json() == new_prefs

        # Verify file content

@pytest.mark.asyncio
async def test_onboarding_saves_preferences():
    onboarding_data = {"telemetry": False, "theme": "dark"}
    async with AsyncClient(base_url="http://test", transport=ASGITransport(app=app)) as ac:
        response = await ac.post("/onboarding", json=onboarding_data)
    assert response.status_code == 200
    assert response.json() == {"status": "saved"}

    # Verify file content
    with open(PREFERENCES_FILE, 'r') as f:
        saved_prefs = json.load(f)
        assert saved_prefs == onboarding_data

@pytest.mark.asyncio
async def test_submit_telemetry():
    telemetry_payload = {"event": "app_started", "details": {"version": "0.1.0"}}
    async with AsyncClient(base_url="http://test", transport=ASGITransport(app=app)) as ac:
        response = await ac.post("/telemetry", json=telemetry_payload)
    assert response.status_code == 200
    assert response.json() == {"status": "received"}

    # Verify log file content
    log_file = "telemetry.log"
    assert os.path.exists(log_file)
    with open(log_file, 'r') as f:
        log_content = f.read()
        assert json.dumps(telemetry_payload) in log_content

        with open(PREFERENCES_FILE, 'r') as f:
            saved_prefs = json.load(f)
            assert saved_prefs == new_prefs

# TODO: Add tests for /preferences GET/POST, /onboarding POST, /telemetry POST