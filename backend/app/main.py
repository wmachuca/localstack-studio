"""FastAPI Backend for LocalStack Studio"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.sqs_service import SQSService
from app.websocket_manager import manager
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="LocalStack Studio API",
    description="Backend API for monitoring LocalStack SQS queues",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize SQS service
sqs_service = SQSService()


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "LocalStack Studio API",
        "status": "running",
        "version": "0.1.0"
    }


@app.get("/queues")
async def list_queues():
    """
    Get list of all available SQS queues

    Returns:
        List of queue information
    """
    try:
        queues = sqs_service.list_queues()
        return {
            "queues": queues,
            "count": len(queues)
        }
    except Exception as e:
        logger.error(f"Error listing queues: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/queue/{queue_name}")
async def get_queue_info(queue_name: str):
    """
    Get detailed information about a specific queue

    Args:
        queue_name: Name of the queue

    Returns:
        Queue attributes and metadata
    """
    try:
        attributes = sqs_service.get_queue_attributes(queue_name)
        return attributes
    except Exception as e:
        logger.error(f"Error getting queue info for {queue_name}: {e}")
        raise HTTPException(status_code=404, detail=f"Queue {queue_name} not found")


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
