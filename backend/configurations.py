from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
from bson import ObjectId
from groq import Groq
from system_params import system_prompt_eval
import json

load_dotenv()

uri = os.getenv("MONGODB_URI")
groqclient = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Create a new client and connect to the server
client = AsyncIOMotorClient(uri)
db = client.core 
association = db.association
question_papers = db.question_papers
types = db.types

async def init_db():
    try:
        # Verify database connection
        await client.admin.command('ping')
        print("Successfully connected to MongoDB!")
        
        return True
    
    except Exception as e:
        print(f"Failed to initialize database: {str(e)}")
        return False