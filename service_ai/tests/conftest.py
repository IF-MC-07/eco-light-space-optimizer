import pytest
import os
import sys

# Ensure app is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../')))

# Set testing environment variables globally
@pytest.fixture(autouse=True)
def env_setup(monkeypatch):
    monkeypatch.setenv("TESTING", "true")
    monkeypatch.setenv("DELAY_ON_LIGHT_SECONDS", "5")
    monkeypatch.setenv("DELAY_ON_AC_MINUTES", "1")
    monkeypatch.setenv("DELAY_OFF_MINUTES", "1")
    monkeypatch.setenv("COMPRESSOR_PROTECTION_SECONDS", "180")
