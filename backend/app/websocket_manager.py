"""WebSocket Manager for handling real-time message streaming"""
import asyncio
import json
from typing import Set
from fastapi import WebSocket
from app.sqs_service import SQSService


class ConnectionManager:
    """Manages WebSocket connections and message broadcasting"""

    def __init__(self):
        """Initialize connection manager"""
        self.active_connections: Set[WebSocket] = set()
        self.sqs_service = SQSService()
        self.polling_tasks = {}

    async def connect(self, websocket: WebSocket, queue_name: str):
        """
        Accept and register a new WebSocket connection

        Args:
            websocket: WebSocket connection
            queue_name: Name of the queue to monitor
        """
        await websocket.accept()
        self.active_connections.add(websocket)

        # Start polling task for this connection if not already running
        if queue_name not in self.polling_tasks:
            task = asyncio.create_task(self._poll_queue(queue_name))
            self.polling_tasks[queue_name] = task

    def disconnect(self, websocket: WebSocket):
        """
        Remove a WebSocket connection

        Args:
            websocket: WebSocket connection to remove
        """
        self.active_connections.discard(websocket)

    async def broadcast(self, message: dict, queue_name: str):
        """
        Broadcast a message to all connected clients

        Args:
            message: Message to broadcast
            queue_name: Queue name for context
        """
        disconnected = set()

        for connection in self.active_connections:
            try:
                await connection.send_json({
                    "queue": queue_name,
                    "message": message
                })
            except Exception as e:
                print(f"Error sending message to client: {e}")
                disconnected.add(connection)

        # Remove disconnected clients
        for conn in disconnected:
            self.disconnect(conn)

    async def _poll_queue(self, queue_name: str):
        """
        Continuously poll SQS queue for new messages

        Args:
            queue_name: Name of the queue to poll
        """
        print(f"Started polling queue: {queue_name}")

        while True:
            try:
                # If no active connections, stop polling
                if not self.active_connections:
                    print(f"No active connections, stopping polling for {queue_name}")
                    del self.polling_tasks[queue_name]
                    break

                # Receive messages with long polling
                messages = await asyncio.to_thread(
                    self.sqs_service.receive_messages,
                    queue_name=queue_name,
                    max_messages=10,
                    wait_time=10,
                    visibility_timeout=1
                )

                # Broadcast each message to connected clients
                for msg in messages:
                    await self.broadcast(msg, queue_name)

                # Small delay to prevent overwhelming the system
                await asyncio.sleep(0.1)

            except Exception as e:
                print(f"Error polling queue {queue_name}: {e}")
                await asyncio.sleep(5)  # Wait before retrying on error


# Global connection manager instance
manager = ConnectionManager()
