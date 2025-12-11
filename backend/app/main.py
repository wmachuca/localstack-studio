"""FastAPI Backend for LocalStack Studio"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.sqs_service import SQSService
from app.websocket_manager import manager
import logging
from typing import Optional, Dict, Any

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


# Pydantic models for request/response
class SendMessageRequest(BaseModel):
    """Request model for sending a message"""
    message_body: str
    message_attributes: Optional[Dict[str, Any]] = None
    delay_seconds: int = 0


class DeleteMessageRequest(BaseModel):
    """Request model for deleting a message"""
    receipt_handle: str


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


@app.post("/queue/{queue_name}/message")
async def send_message(queue_name: str, request: SendMessageRequest):
    """
    Send a message to a specific queue

    Args:
        queue_name: Name of the queue
        request: SendMessageRequest with message details

    Returns:
        Message ID and metadata
    """
    try:
        result = sqs_service.send_message(
            queue_name=queue_name,
            message_body=request.message_body,
            message_attributes=request.message_attributes,
            delay_seconds=request.delay_seconds
        )
        logger.info(f"Message sent to {queue_name}: {result['messageId']}")
        return {
            "success": True,
            "messageId": result["messageId"],
            "md5OfMessageBody": result["md5OfMessageBody"]
        }
    except Exception as e:
        logger.error(f"Error sending message to {queue_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/queue/{queue_name}/message")
async def delete_message(queue_name: str, request: DeleteMessageRequest):
    """
    Delete a message from a specific queue

    Args:
        queue_name: Name of the queue
        request: DeleteMessageRequest with receipt handle

    Returns:
        Success status
    """
    try:
        sqs_service.delete_message(
            queue_name=queue_name,
            receipt_handle=request.receipt_handle
        )
        logger.info(f"Message deleted from {queue_name}")
        return {"success": True, "message": "Message deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting message from {queue_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


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
