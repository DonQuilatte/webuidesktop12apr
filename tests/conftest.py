import logging
import pytest
import os

@pytest.fixture(scope="session", autouse=True)
def setup_environment():
    os.environ['TELEMETRY_FILE'] = '/path/to/your/telemetry.log'
    yield
    if os.path.exists(os.environ['TELEMETRY_FILE']):
        os.remove(os.environ['TELEMETRY_FILE']) 

@pytest.fixture
def temp_files(tmp_path):
    telemetry_file = tmp_path / "telemetry.log"
    os.environ['TELEMETRY_FILE'] = str(telemetry_file)
    yield telemetry_file

@pytest.fixture(autouse=True)
def suppress_warnings(caplog):
    with caplog.at_level(logging.WARNING):
        yield caplog

# Add any additional fixtures as needed.
