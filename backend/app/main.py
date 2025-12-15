"""FastAPI Backend for LocalStack Studio"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.routers import sqs, dynamodb
from app.websocket.manager import manager
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="LocalStack Studio API",
    description="Backend API for monitoring LocalStack services",
    version="0.2.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(sqs.router, tags=["SQS"])
app.include_router(dynamodb.router, prefix="/dynamodb", tags=["DynamoDB"])


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "LocalStack Studio API",
        "status": "running",
        "version": "0.2.0"
    }


@app.websocket("/ws/messages/{queue_name}")
async def websocket_endpoint(websocket: WebSocket, queue_name: str):
    """
    WebSocket endpoint for real-time message streaming

    Args:
        websocket: WebSocket connection
        queue_name: Name of the queue to monitor
    """
    await manager.connect(websocket, queue_name)
    logger.info(f"Client connected to queue: {queue_name}")

    try:
        # Keep connection alive and handle incoming messages
        while True:
            # Wait for any client messages (for keep-alive)
            data = await websocket.receive_text()
            logger.debug(f"Received from client: {data}")

    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info(f"Client disconnected from queue: {queue_name}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
