import logging
import pytest
import os

# Removed problematic setup_environment fixture

@pytest.fixture
def temp_files(tmp_path):
    telemetry_file = tmp_path / "telemetry.log"
    # Set env var for tests that might still expect it (though patching in test_api is better)
    # Note: If main.py uses the env var, this fixture becomes more relevant
    os.environ['TELEMETRY_FILE_PATH'] = str(telemetry_file)
    yield telemetry_file
    # Cleanup env var if needed
    # del os.environ['TELEMETRY_FILE_PATH']

@pytest.fixture(autouse=True)
def suppress_warnings(caplog):
    with caplog.at_level(logging.WARNING):
        yield caplog

# Add any additional fixtures as needed.
