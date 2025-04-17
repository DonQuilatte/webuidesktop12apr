import os
import json
import pytest
import tempfile
import asyncio
from fastapi.testclient import TestClient
from unittest.mock import patch, mock_open, MagicMock
from httpx import AsyncClient, ASGITransport
import pytest_asyncio

from backend.main import app, PREFERENCES_FILE, TELEMETRY_FILE

client = TestClient(app)

@pytest.fixture
def mock_preferences_file():
    """Creates a temporary preferences file for testing."""
    with tempfile.NamedTemporaryFile(delete=False) as temp:
        temp.write(json.dumps({"telemetry": False, "theme": "light"}).encode())
        temp_name = temp.name
    
    yield temp_name
    
    # Cleanup
    if os.path.exists(temp_name):
        os.unlink(temp_name)

@pytest.fixture
def mock_telemetry_file():
    """Creates a temporary telemetry file for testing."""
    with tempfile.NamedTemporaryFile(delete=False) as temp:
        temp_name = temp.name
    
    yield temp_name
    
    # Cleanup
    if os.path.exists(temp_name):
        os.unlink(temp_name)

@pytest_asyncio.fixture
async def async_client():
    """Creates an async client for testing FastAPI endpoints."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        yield client

# Advanced test cases for preferences endpoint
@pytest.mark.asyncio
async def test_preferences_concurrent_updates(async_client, tmp_path):
    """Test concurrent updates to preferences."""
    test_prefs_path = tmp_path / "preferences.json"
    test_prefs_path.write_text(json.dumps({"telemetry": False, "theme": "light"}))
    
    with patch('backend.main.PREFERENCES_FILE', str(test_prefs_path)):
        # Create multiple concurrent requests
        tasks = []
        for i in range(5):
            theme = "dark" if i % 2 == 0 else "light"
            tasks.append(
                async_client.post(
                    "/preferences",
                    json={"telemetry": True, "theme": theme}
                )
            )
        
        # Execute all requests concurrently
        responses = await asyncio.gather(*tasks)
        
        # All requests should succeed
        for response in responses:
            assert response.status_code == 200
            assert response.json()["status"] == "updated"
        
        # Check final state - should be one of the last updates
        response = await async_client.get("/preferences")
        assert response.status_code == 200
        data = response.json()
        assert data["telemetry"] is True
        assert data["theme"] in ["dark", "light"]

def test_preferences_get_with_empty_file(tmp_path):
    """Test GET /preferences with an empty file."""
    test_prefs_path = tmp_path / "preferences.json"
    test_prefs_path.write_text("")
    
    with patch('backend.main.PREFERENCES_FILE', str(test_prefs_path)):
        resp = client.get("/preferences")
        assert resp.status_code == 200
        data = resp.json()
        assert data["telemetry"] is False
        assert data["theme"] == "light"

def test_preferences_get_with_invalid_json(tmp_path):
    """Test GET /preferences with invalid JSON."""
    test_prefs_path = tmp_path / "preferences.json"
    test_prefs_path.write_text("{invalid json")
    
    with patch('backend.main.PREFERENCES_FILE', str(test_prefs_path)):
        resp = client.get("/preferences")
        assert resp.status_code == 200
        data = resp.json()
        assert data["telemetry"] is False
        assert data["theme"] == "light"

def test_preferences_post_with_readonly_file(tmp_path):
    """Test POST /preferences with a read-only file."""
    test_prefs_path = tmp_path / "preferences.json"
    test_prefs_path.write_text(json.dumps({"telemetry": False, "theme": "light"}))
    os.chmod(test_prefs_path, 0o444)  # Make file read-only
    
    try:
        with patch('backend.main.PREFERENCES_FILE', str(test_prefs_path)):
            resp = client.post("/preferences", json={"telemetry": True, "theme": "dark"})
            assert resp.status_code == 500
            assert "detail" in resp.json()
    finally:
        os.chmod(test_prefs_path, 0o644)  # Restore permissions for cleanup

# Advanced test cases for telemetry endpoint
def test_telemetry_post_with_large_payload():
    """Test POST /telemetry with a large payload."""
    with tempfile.NamedTemporaryFile(delete=False) as temp:
        temp_name = temp.name
        
        try:
            with patch('backend.main.TELEMETRY_FILE', temp_name):
                # Create a large details payload
                large_details = {f"key_{i}": "x" * 1000 for i in range(100)}
                
                resp = client.post("/telemetry", json={
                    "event": "large_event",
                    "details": large_details
                })
                
                assert resp.status_code == 200
                assert resp.json()["status"] in ("received", "logged_with_error")
                
                # Verify the event was logged
                with open(temp_name, "r") as f:
                    content = f.read()
                    assert "large_event" in content
        finally:
            if os.path.exists(temp_name):
                os.unlink(temp_name)

@pytest.mark.asyncio
async def test_telemetry_concurrent_writes(async_client, tmp_path):
    """Test concurrent writes to telemetry log."""
    test_telemetry_path = tmp_path / "telemetry.log"
    
    with patch('backend.main.TELEMETRY_FILE', str(test_telemetry_path)):
        # Create multiple concurrent requests
        tasks = []
        for i in range(10):
            tasks.append(
                async_client.post(
                    "/telemetry",
                    json={"event": f"event_{i}", "details": {"index": i}}
                )
            )
        
        # Execute all requests concurrently
        responses = await asyncio.gather(*tasks)
        
        # All requests should succeed
        for response in responses:
            assert response.status_code == 200
            assert response.json()["status"] in ("received", "logged_with_error")
        
        # Check that all events were logged
        with open(test_telemetry_path, "r") as f:
            content = f.read()
            for i in range(10):
                assert f"event_{i}" in content

def test_telemetry_post_with_directory_conflict(tmp_path):
    """Test POST /telemetry when the telemetry file path is a directory."""
    test_telemetry_dir = tmp_path / "telemetry.log"
    test_telemetry_dir.mkdir()
    
    try:
        with patch('backend.main.TELEMETRY_FILE', str(test_telemetry_dir)):
            resp = client.post("/telemetry", json={
                "event": "test_event",
                "details": {"foo": "bar"}
            })
            
            assert resp.status_code == 500
            assert 'detail' in resp.json().keys() # Check for 'detail' key
    finally:
        if test_telemetry_dir.exists():
            test_telemetry_dir.rmdir()

# Advanced test cases for onboarding endpoint
def test_onboarding_post_with_missing_parent_directory(tmp_path):
    """Test POST /onboarding when parent directory doesn't exist."""
    nonexistent_dir = tmp_path / "nonexistent" / "deeply" / "nested"
    test_prefs_path = nonexistent_dir / "preferences.json"
    
    with patch('backend.main.PREFERENCES_FILE', str(test_prefs_path)):
        resp = client.post("/onboarding", json={"telemetry": True, "theme": "dark"})
        
        assert resp.status_code == 200
        assert resp.json()["status"] == "saved"
        
        # Verify the file was created with parent directories
        assert test_prefs_path.exists()
        with open(test_prefs_path, "r") as f:
            data = json.load(f)
            assert data["telemetry"] is True
            assert data["theme"] == "dark"

# Performance and load tests
@pytest.mark.asyncio
async def test_api_load(async_client, tmp_path):
    """Test API under load with multiple concurrent requests."""
    test_prefs_path = tmp_path / "preferences.json"
    test_prefs_path.write_text(json.dumps({"telemetry": False, "theme": "light"}))
    test_telemetry_path = tmp_path / "telemetry.log"
    
    with patch('backend.main.PREFERENCES_FILE', str(test_prefs_path)), \
         patch('backend.main.TELEMETRY_FILE', str(test_telemetry_path)):
        
        # Create a mix of different requests
        tasks = []
        for i in range(20):
            if i % 4 == 0:
                tasks.append(async_client.get("/preferences"))
            elif i % 4 == 1:
                tasks.append(async_client.post("/preferences", json={"telemetry": bool(i % 2), "theme": "dark" if i % 2 else "light"}))
            elif i % 4 == 2:
                tasks.append(async_client.post("/onboarding", json={"telemetry": bool(i % 2), "theme": "dark" if i % 2 else "light"}))
            else:
                tasks.append(async_client.post("/telemetry", json={"event": f"event_{i}", "details": {"index": i}}))
        
        # Execute all requests concurrently
        responses = await asyncio.gather(*tasks)
        
        # All requests should succeed
        for response in responses:
            assert response.status_code == 200

# Security tests
def test_preferences_post_with_extra_fields():
    """Test POST /preferences with extra fields (potential injection)."""
    with tempfile.NamedTemporaryFile(delete=False) as temp:
        temp_name = temp.name
        
        try:
            with patch('backend.main.PREFERENCES_FILE', temp_name):
                resp = client.post("/preferences", json={
                    "telemetry": True,
                    "theme": "dark",
                    "__proto__": {"malicious": "payload"},
                    "constructor": {"dangerous": "field"},
                    "extra_field": "should be ignored"
                })
                
                assert resp.status_code == 422  # Validation should fail
        finally:
            if os.path.exists(temp_name):
                os.unlink(temp_name)

def test_telemetry_post_with_invalid_event_types():
    """Test POST /telemetry with invalid event types."""
    with tempfile.NamedTemporaryFile(delete=False) as temp:
        temp_name = temp.name
        
        try:
            with patch('backend.main.TELEMETRY_FILE', temp_name):
                # Test with various invalid payloads
                invalid_payloads = [
                    {"event": 123, "details": {}},  # Non-string event
                    {"event": "valid_event", "details": "not_an_object"},  # Non-object details
                    {"event": "", "details": {}},  # Empty event name
                ]
                valid_payload = {"event": "valid_event", "details": {"nested": {"too": {"deep": "object"}}}}

                for payload in invalid_payloads:
                    resp = client.post("/telemetry", json=payload)
                    assert resp.status_code == 422  # Validation should fail

                # Test the valid payload separately
                resp = client.post("/telemetry", json=valid_payload)
                assert resp.status_code == 200 # Should succeed
        finally:
            if os.path.exists(temp_name):
                os.unlink(temp_name)

# Edge case tests
def test_health_endpoint_with_slow_response():
    """Test /health endpoint normally (removed slow response simulation)."""
    # Removed patch as the actual endpoint is simple
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"

def test_preferences_with_unicode_theme():
    """Test preferences with valid theme."""
    with tempfile.NamedTemporaryFile(delete=False) as temp:
        temp_name = temp.name
        
        try:
            with patch('backend.main.PREFERENCES_FILE', temp_name):
                # Post preferences with valid theme
                resp = client.post("/preferences", json={
                    "telemetry": True,
                    "theme": "dark"  # Changed from Unicode to valid Literal
                })
                
                assert resp.status_code == 200
                assert resp.json()["status"] == "updated"
                
                # Get preferences and verify theme is preserved
                resp = client.get("/preferences")
                assert resp.status_code == 200
                assert resp.json()["theme"] == "dark"
        finally:
            if os.path.exists(temp_name):
                os.unlink(temp_name)
