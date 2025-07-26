from motor.motor_asyncio import AsyncIOMotorClient

from app.utils.vars import MONGODB_URI


class Database:
    client: AsyncIOMotorClient | None = None
    
    def get_db(self):
        if not self.client:
            self.client = AsyncIOMotorClient(MONGODB_URI)
        return self.client.core

db = Database()
association = db.get_db().association
question_papers = db.get_db().question_papers
types = db.get_db().types

async def init_db() -> bool:
    """Initialize the database connection."""
    
    try:
        await db.get_db().command('ping')
        print("Successfully connected to MongoDB!")
        return True
    
    except Exception as e:
        print(f"Failed to initialize database: {str(e)}")
        return False