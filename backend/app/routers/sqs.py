"""SQS API endpoints"""
from fastapi import APIRouter, HTTPException
from app.services.sqs_service import SQSService
from app.models.sqs import SendMessageRequest, DeleteMessageRequest, CreateQueueRequest
import logging

# Configure logging
logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter()

# Initialize SQS service
sqs_service = SQSService()


@router.get("/queues")
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


@router.get("/queue/{queue_name}")
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


@router.post("/queue/{queue_name}/message")
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


@router.delete("/queue/{queue_name}/message")
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


@router.post("/queue")
async def create_queue(request: CreateQueueRequest):
    """
    Create a new SQS queue

    Args:
        request: CreateQueueRequest with queue name and optional attributes

    Returns:
        Queue URL and status
    """
    try:
        queue_url = sqs_service.create_queue(
            queue_name=request.queue_name,
            attributes=request.attributes
        )
        logger.info(f"Queue created: {request.queue_name}")
        return {
            "success": True,
            "queueUrl": queue_url,
            "queueName": request.queue_name
        }
    except Exception as e:
        logger.error(f"Error creating queue {request.queue_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/queue/{queue_name}")
async def delete_queue(queue_name: str):
    """
    Delete an SQS queue

    Args:
        queue_name: Name of the queue to delete

    Returns:
        Success status
    """
    try:
        sqs_service.delete_queue(queue_name)
        logger.info(f"Queue deleted: {queue_name}")
        return {"success": True, "message": f"Queue {queue_name} deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting queue {queue_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
