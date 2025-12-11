"""SQS Service module for interacting with LocalStack SQS"""
import boto3
import os
from typing import List, Dict, Any
from botocore.exceptions import ClientError


class SQSService:
    """Service class for SQS operations"""

    def __init__(self):
        """Initialize SQS client with LocalStack configuration"""
        self.endpoint_url = os.getenv("SQS_ENDPOINT", "http://localhost:4566")
        self.region = os.getenv("AWS_REGION", "us-east-1")

        self.client = boto3.client(
            "sqs",
            endpoint_url=self.endpoint_url,
            region_name=self.region,
            aws_access_key_id="test",
            aws_secret_access_key="test",
        )

    def list_queues(self) -> List[Dict[str, str]]:
        """
        List all available SQS queues, sorted by creation timestamp

        Returns:
            List of queue information dictionaries, ordered by creation date
        """
        try:
            response = self.client.list_queues()
            queue_urls = response.get("QueueUrls", [])

            queues = []
            for url in queue_urls:
                queue_name = url.split("/")[-1]

                # Get queue attributes to fetch creation timestamp
                try:
                    attrs_response = self.client.get_queue_attributes(
                        QueueUrl=url,
                        AttributeNames=["CreatedTimestamp"]
                    )
                    created_timestamp = attrs_response.get("Attributes", {}).get("CreatedTimestamp", "0")
                except ClientError:
                    # If we can't get attributes, use 0 as fallback
                    created_timestamp = "0"

                queues.append({
                    "name": queue_name,
                    "url": url,
                    "createdTimestamp": created_timestamp
                })

            # Sort by creation timestamp (ascending - oldest first)
            queues.sort(key=lambda q: int(q["createdTimestamp"]))

            return queues
        except ClientError as e:
            print(f"Error listing queues: {e}")
            return []

    def get_queue_url(self, queue_name: str) -> str:
        """
        Get queue URL by name

        Args:
            queue_name: Name of the queue

        Returns:
            Queue URL
        """
        try:
            response = self.client.get_queue_url(QueueName=queue_name)
            return response["QueueUrl"]
        except ClientError as e:
            print(f"Error getting queue URL for {queue_name}: {e}")
            raise

    def get_queue_attributes(self, queue_name: str) -> Dict[str, Any]:
        """
        Get attributes for a specific queue

        Args:
            queue_name: Name of the queue

        Returns:
            Dictionary with queue attributes
        """
        try:
            queue_url = self.get_queue_url(queue_name)
            response = self.client.get_queue_attributes(
                QueueUrl=queue_url,
                AttributeNames=["All"]
            )

            attributes = response.get("Attributes", {})
            return {
                "name": queue_name,
                "url": queue_url,
                "approximateNumberOfMessages": attributes.get("ApproximateNumberOfMessages", "0"),
                "approximateNumberOfMessagesNotVisible": attributes.get("ApproximateNumberOfMessagesNotVisible", "0"),
                "approximateNumberOfMessagesDelayed": attributes.get("ApproximateNumberOfMessagesDelayed", "0"),
                "createdTimestamp": attributes.get("CreatedTimestamp", ""),
                "lastModifiedTimestamp": attributes.get("LastModifiedTimestamp", ""),
                "visibilityTimeout": attributes.get("VisibilityTimeout", "30"),
                "messageRetentionPeriod": attributes.get("MessageRetentionPeriod", "345600"),
                "delaySeconds": attributes.get("DelaySeconds", "0"),
                "receiveMessageWaitTimeSeconds": attributes.get("ReceiveMessageWaitTimeSeconds", "0"),
            }
        except ClientError as e:
            print(f"Error getting attributes for queue {queue_name}: {e}")
            raise

    def receive_messages(
        self,
        queue_name: str,
        max_messages: int = 10,
        wait_time: int = 10,
        visibility_timeout: int = 1
    ) -> List[Dict[str, Any]]:
        """
        Receive messages from queue using long polling

        Args:
            queue_name: Name of the queue
            max_messages: Maximum number of messages to receive (1-10)
            wait_time: Long polling wait time in seconds
            visibility_timeout: Visibility timeout for received messages

        Returns:
            List of messages
        """
        try:
            queue_url = self.get_queue_url(queue_name)
            response = self.client.receive_message(
                QueueUrl=queue_url,
                MaxNumberOfMessages=max_messages,
                WaitTimeSeconds=wait_time,
                VisibilityTimeout=visibility_timeout,
                AttributeNames=["All"],
                MessageAttributeNames=["All"]
            )

            messages = []
            for msg in response.get("Messages", []):
                messages.append({
                    "messageId": msg.get("MessageId"),
                    "receiptHandle": msg.get("ReceiptHandle"),
                    "body": msg.get("Body"),
                    "attributes": msg.get("Attributes", {}),
                    "messageAttributes": msg.get("MessageAttributes", {}),
                })

            return messages
        except ClientError as e:
            print(f"Error receiving messages from {queue_name}: {e}")
            return []

    def send_message(
        self,
        queue_name: str,
        message_body: str,
        message_attributes: Dict[str, Any] = None,
        delay_seconds: int = 0
    ) -> Dict[str, Any]:
        """
        Send a message to a queue

        Args:
            queue_name: Name of the queue
            message_body: Message body (string or JSON)
            message_attributes: Optional message attributes
            delay_seconds: Delay before message becomes available (0-900)

        Returns:
            Dictionary with message ID and other metadata
        """
        try:
            queue_url = self.get_queue_url(queue_name)

            params = {
                "QueueUrl": queue_url,
                "MessageBody": message_body,
                "DelaySeconds": delay_seconds
            }

            if message_attributes:
                params["MessageAttributes"] = message_attributes

            response = self.client.send_message(**params)

            return {
                "messageId": response.get("MessageId"),
                "md5OfMessageBody": response.get("MD5OfMessageBody"),
                "sequenceNumber": response.get("SequenceNumber"),
            }
        except ClientError as e:
            print(f"Error sending message to {queue_name}: {e}")
            raise

    def delete_message(self, queue_name: str, receipt_handle: str) -> bool:
        """
        Delete a message from a queue

        Args:
            queue_name: Name of the queue
            receipt_handle: Receipt handle of the message to delete

        Returns:
            True if successful, False otherwise
        """
        try:
            queue_url = self.get_queue_url(queue_name)
            self.client.delete_message(
                QueueUrl=queue_url,
                ReceiptHandle=receipt_handle
            )
            return True
        except ClientError as e:
            print(f"Error deleting message from {queue_name}: {e}")
            raise
