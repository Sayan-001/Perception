from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database.connections import init_db

from app.routes import association, papers, evaluation, types
from app.utils.routelogger import print_route_db

import uvicorn

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

def create_app():
    app = FastAPI(lifespan=lifespan)
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    return app

app = create_app()

app.include_router(types.router)
app.include_router(association.router)
app.include_router(papers.router)
app.include_router(evaluation.router)

print_route_db()