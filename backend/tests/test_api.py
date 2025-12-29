import sys
import os
from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Ensure the backend package is importable when running tests from this file
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database import Base, get_db  # noqa: E402
from main import app  # noqa: E402
from models import Habit  # noqa: E402

TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def reset_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture()
def client():
    return TestClient(app)


def create_habit(client, name="Read Book", category="Growth"):
    response = client.post("/habits", json={"name": name, "category": category})
    assert response.status_code == 201
    return response.json()


def test_create_and_list_habits(client):
    created = create_habit(client, name="Exercise", category="Health")
    assert created["name"] == "Exercise"
    assert created["category"] == "Health"
    assert created["streak"] == 0
    assert created["last_completed"] is None

    list_response = client.get("/habits")
    assert list_response.status_code == 200
    habits = list_response.json()
    assert len(habits) == 1
    assert habits[0]["name"] == "Exercise"
    assert habits[0]["completions"] == []


def test_get_habit_by_id(client):
    habit = create_habit(client, name="Meditate", category="Wellness")

    get_response = client.get(f"/habits/{habit['id']}")
    assert get_response.status_code == 200
    payload = get_response.json()
    assert payload["name"] == "Meditate"
    assert payload["id"] == habit["id"]
    assert payload["completions"] == []


def test_update_habit(client):
    habit = create_habit(client)

    update_response = client.put(
        f"/habits/{habit['id']}",
        json={"name": "Read Fiction", "category": "Leisure"},
    )
    assert update_response.status_code == 200
    payload = update_response.json()
    assert payload["name"] == "Read Fiction"
    assert payload["category"] == "Leisure"


def test_delete_habit_removes_it_from_listing(client):
    habit = create_habit(client)

    delete_response = client.delete(f"/habits/{habit['id']}")
    assert delete_response.status_code == 204

    list_response = client.get("/habits")
    assert list_response.status_code == 200
    assert list_response.json() == []


def test_complete_habit_updates_streak_and_last_completed(client):
    habit = create_habit(client, name="Code", category="Work")

    today = date.today()
    yesterday = today - timedelta(days=1)

    first_completion = client.post(
        f"/habits/{habit['id']}/complete",
        json={"note": "Started new feature", "date": yesterday.isoformat()},
    )
    assert first_completion.status_code == 201

    second_completion = client.post(
        f"/habits/{habit['id']}/complete",
        json={"note": "Continued work", "date": today.isoformat()},
    )
    assert second_completion.status_code == 201

    habit_response = client.get(f"/habits/{habit['id']}")
    assert habit_response.status_code == 200
    payload = habit_response.json()
    assert payload["streak"] == 2
    assert payload["last_completed"] == today.isoformat()
    assert len(payload["completions"]) == 2


def test_get_completions_for_habit(client):
    habit = create_habit(client, name="Journal", category="Reflection")

    client.post(f"/habits/{habit['id']}/complete", json={"note": "Morning entry"})

    completions_response = client.get(f"/habits/{habit['id']}/completions")
    assert completions_response.status_code == 200
    completions = completions_response.json()
    assert len(completions) == 1
    assert completions[0]["note"] == "Morning entry"


def test_validation_errors_for_blank_fields(client):
    invalid_response = client.post("/habits", json={"name": "", "category": ""})
    assert invalid_response.status_code == 422

    habit = create_habit(client, name="Walk", category="Fitness")
    update_response = client.put(
        f"/habits/{habit['id']}", json={"name": "", "category": " "}
    )
    assert update_response.status_code == 422


def test_complete_nonexistent_habit_returns_404(client):
    response = client.post("/habits/999/complete", json={"note": "Should fail"})
    assert response.status_code == 404
