#!/usr/bin/env python3
"""
CLI script to publish messages to LocalStack SQS queues

Usage:
    python publish_message.py <queue-name> <message-body> [options]

Examples:
    python publish_message.py my-queue '{"foo": "bar"}'
    python publish_message.py my-queue '{"user": "john", "action": "login"}' --delay 5
    python publish_message.py my-queue 'Hello World' --create-queue
"""

import argparse
import json
import sys
import os
import boto3
from botocore.exceptions import ClientError


class SQSPublisher:
    """Helper class for publishing messages to SQS"""

    def __init__(self, endpoint_url: str = None, region: str = None):
        """
        Initialize SQS client

        Args:
            endpoint_url: SQS endpoint URL (defaults to LocalStack)
            region: AWS region (defaults to us-east-1)
        """
        self.endpoint_url = endpoint_url or os.getenv("SQS_ENDPOINT", "http://localhost:4566")
        self.region = region or os.getenv("AWS_REGION", "us-east-1")

        self.client = boto3.client(
            "sqs",
            endpoint_url=self.endpoint_url,
            region_name=self.region,
            aws_access_key_id="test",
            aws_secret_access_key="test",
        )

    def create_queue(self, queue_name: str) -> str:
        """
        Create a new SQS queue

        Args:
            queue_name: Name of the queue to create

        Returns:
            Queue URL
        """
        try:
            response = self.client.create_queue(QueueName=queue_name)
            queue_url = response["QueueUrl"]
            print(f"✓ Queue created: {queue_name}")
            return queue_url
        except ClientError as e:
            print(f"✗ Error creating queue: {e}")
            raise

    def get_queue_url(self, queue_name: str) -> str:
        """
        Get the URL of an existing queue

        Args:
            queue_name: Name of the queue

        Returns:
            Queue URL
        """
        try:
            response = self.client.get_queue_url(QueueName=queue_name)
            return response["QueueUrl"]
        except ClientError as e:
            if e.response["Error"]["Code"] == "AWS.SimpleQueueService.NonExistentQueue":
                raise ValueError(f"Queue '{queue_name}' does not exist")
            raise

    def send_message(
        self,
        queue_name: str,
        message_body: str,
        delay_seconds: int = 0,
        attributes: dict = None,
    ) -> dict:
        """
        Send a message to an SQS queue

        Args:
            queue_name: Name of the queue
            message_body: Message content
            delay_seconds: Delivery delay in seconds (0-900)
            attributes: Optional message attributes

        Returns:
            Response from SQS
        """
        try:
            queue_url = self.get_queue_url(queue_name)

            params = {
                "QueueUrl": queue_url,
                "MessageBody": message_body,
            }

            if delay_seconds > 0:
                params["DelaySeconds"] = delay_seconds

            if attributes:
                params["MessageAttributes"] = attributes

            response = self.client.send_message(**params)
            return response

        except ClientError as e:
            print(f"✗ Error sending message: {e}")
            raise


def validate_json(message: str) -> bool:
    """
    Check if message is valid JSON

    Args:
        message: Message string to validate

    Returns:
        True if valid JSON, False otherwise
    """
    try:
        json.loads(message)
        return True
    except json.JSONDecodeError:
        return False


def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(
        description="Publish messages to LocalStack SQS queues",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s my-queue '{"foo": "bar"}'
  %(prog)s my-queue '{"user": "john"}' --delay 5
  %(prog)s my-queue 'Hello' --create-queue
  %(prog)s my-queue '{"data": "test"}' --endpoint http://localhost:4566
        """,
    )

    parser.add_argument(
        "queue_name",
        help="Name of the SQS queue"
    )

    parser.add_argument(
        "message",
        help="Message body to send (JSON or plain text)"
    )

    parser.add_argument(
        "--endpoint",
        default="http://localhost:4566",
        help="LocalStack endpoint URL (default: http://localhost:4566)"
    )

    parser.add_argument(
        "--region",
        default="us-east-1",
        help="AWS region (default: us-east-1)"
    )

    parser.add_argument(
        "--delay",
        type=int,
        default=0,
        metavar="SECONDS",
        help="Delay message delivery by N seconds (0-900)"
    )

    parser.add_argument(
        "--create-queue",
        action="store_true",
        help="Create the queue if it doesn't exist"
    )

    parser.add_argument(
        "--validate-json",
        action="store_true",
        help="Validate that message is valid JSON before sending"
    )

    args = parser.parse_args()

    # Validate delay
    if args.delay < 0 or args.delay > 900:
        print("✗ Error: Delay must be between 0 and 900 seconds")
        sys.exit(1)

    # Validate JSON if requested
    if args.validate_json and not validate_json(args.message):
        print("✗ Error: Message is not valid JSON")
        sys.exit(1)

    # Initialize publisher
    try:
        publisher = SQSPublisher(endpoint_url=args.endpoint, region=args.region)
        print(f"📡 Connected to LocalStack at {args.endpoint}")
    except Exception as e:
        print(f"✗ Failed to connect to LocalStack: {e}")
        sys.exit(1)

    # Create queue if requested
    if args.create_queue:
        try:
            publisher.create_queue(args.queue_name)
        except Exception as e:
            print(f"✗ Failed to create queue: {e}")
            sys.exit(1)

    # Send message
    try:
        print(f"📤 Sending message to queue '{args.queue_name}'...")

        response = publisher.send_message(
            queue_name=args.queue_name,
            message_body=args.message,
            delay_seconds=args.delay
        )

        print(f"✓ Message sent successfully!")
        print(f"  Message ID: {response['MessageId']}")
        print(f"  MD5: {response['MD5OfMessageBody']}")

        if args.delay > 0:
            print(f"  Delivery delayed by: {args.delay} seconds")

    except ValueError as e:
        print(f"✗ {e}")
        print(f"  Hint: Use --create-queue to create the queue automatically")
        sys.exit(1)
    except Exception as e:
        print(f"✗ Failed to send message: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
