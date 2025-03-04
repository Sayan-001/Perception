from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()

class Database:
    client: AsyncIOMotorClient = None
    
    def get_db(self):
        if not self.client:
            self.client = AsyncIOMotorClient(os.getenv("MONGODB_URI"))
        return self.client.core

db = Database()
association = db.get_db().association
question_papers = db.get_db().question_papers
types = db.get_db().types

async def init_db():
    """
    Initialize the database connection
    
    Returns:
    bool: True if the connection was successful, False otherwise
    """
    try:
        await db.get_db().command('ping')
        print("Successfully connected to MongoDB!")
        return True
    except Exception as e:
        print(f"Failed to initialize database: {str(e)}")
        return False