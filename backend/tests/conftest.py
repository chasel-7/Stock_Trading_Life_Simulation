import pytest
from sqlmodel import SQLModel, create_engine, Session
from fastapi.testclient import TestClient
from app.database.db import get_db
from app.models.user import User
from app.models.game_record import GameRecord
from main import app

from sqlalchemy.pool import StaticPool

@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session

@pytest.fixture(name="client")
def client_fixture(session):
    def get_db_override():
        yield session
    app.dependency_overrides[get_db] = get_db_override
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()

