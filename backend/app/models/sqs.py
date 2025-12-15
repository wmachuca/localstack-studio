"""Pydantic models for SQS operations"""
from pydantic import BaseModel
from typing import Optional, Dict, Any


class SendMessageRequest(BaseModel):
    """Request model for sending a message"""
    message_body: str
    message_attributes: Optional[Dict[str, Any]] = None
    delay_seconds: int = 0


class DeleteMessageRequest(BaseModel):
    """Request model for deleting a message"""
    receipt_handle: str


class CreateQueueRequest(BaseModel):
    """Request model for creating a queue"""
    queue_name: str
    attributes: Optional[Dict[str, str]] = None
