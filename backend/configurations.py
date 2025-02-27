from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()

uri = os.getenv("MONGODB_URI")

client = AsyncIOMotorClient(uri)
db = client.core 
association = db.association
question_papers = db.question_papers
types = db.types

async def init_db():
    """
    Verification of the connection to the MongoDB database.
    """
    try:
        await client.admin.command('ping')
        print("Successfully connected to MongoDB!")
        
        return True
    
    except Exception as e:
        print(f"Failed to initialize database: {str(e)}")
        return False