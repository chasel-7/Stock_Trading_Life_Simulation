from sqlmodel import SQLModel, create_engine, Session
from app.core.config import settings

connect_args = {"check_same_thread": False}
engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)

def init_db():
    from app.models.user import User
    from app.models.game_record import GameRecord
    SQLModel.metadata.create_all(engine)
    
    from sqlalchemy import text, inspect
    inspector = inspect(engine)
    columns = [col['name'] for col in inspector.get_columns('game_records')]
    if 'is_practice' not in columns:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE game_records ADD COLUMN is_practice BOOLEAN DEFAULT 0"))
            conn.commit()

def get_db():
    with Session(engine) as session:
        yield session
