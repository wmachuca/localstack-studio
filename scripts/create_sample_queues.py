#!/usr/bin/env python3
"""
Script to create sample SQS queues and populate them with test messages

This is useful for testing and demonstrating LocalStack Studio
"""

import boto3
import json
import time
from datetime import datetime

# LocalStack configuration
ENDPOINT_URL = "http://localhost:4566"
REGION = "us-east-1"

# Sample queues to create
SAMPLE_QUEUES = [
    {
        "name": "user-events",
        "messages": [
            {"user": "alice", "event": "login", "timestamp": datetime.now().isoformat()},
            {"user": "bob", "event": "logout", "timestamp": datetime.now().isoformat()},
            {"user": "charlie", "event": "signup", "timestamp": datetime.now().isoformat()},
        ]
    },
    {
        "name": "order-processing",
        "messages": [
            {"orderId": "ORD-001", "status": "pending", "amount": 99.99},
            {"orderId": "ORD-002", "status": "processing", "amount": 149.50},
            {"orderId": "ORD-003", "status": "shipped", "amount": 299.00},
        ]
    },
    {
        "name": "notifications",
        "messages": [
            {"type": "email", "recipient": "user@example.com", "subject": "Welcome!"},
            {"type": "sms", "recipient": "+1234567890", "message": "Your code is 123456"},
            {"type": "push", "recipient": "device-token-xyz", "title": "New message"},
        ]
    },
]


def create_sqs_client():
    """Create and return SQS client"""
    return boto3.client(
        "sqs",
        endpoint_url=ENDPOINT_URL,
        region_name=REGION,
        aws_access_key_id="test",
        aws_secret_access_key="test",
    )


def create_queue(client, queue_name):
    """Create a queue"""
    try:
        response = client.create_queue(QueueName=queue_name)
        print(f"✓ Created queue: {queue_name}")
        return response["QueueUrl"]
    except Exception as e:
        print(f"✗ Error creating queue {queue_name}: {e}")
        return None


def send_messages(client, queue_url, messages):
    """Send messages to a queue"""
    for msg in messages:
        try:
            client.send_message(
                QueueUrl=queue_url,
                MessageBody=json.dumps(msg)
            )
            print(f"  → Sent message: {json.dumps(msg)[:60]}...")
            time.sleep(0.5)  # Small delay between messages
        except Exception as e:
            print(f"  ✗ Error sending message: {e}")


def main():
    """Main function"""
    print("=" * 60)
    print("LocalStack Studio - Sample Queue Creator")
    print("=" * 60)
    print()

    client = create_sqs_client()

    for queue_config in SAMPLE_QUEUES:
        queue_name = queue_config["name"]
        messages = queue_config["messages"]

        print(f"\n📬 Setting up queue: {queue_name}")
        queue_url = create_queue(client, queue_name)

        if queue_url:
            print(f"📤 Sending {len(messages)} messages...")
            send_messages(client, queue_url, messages)

    print("\n" + "=" * 60)
    print("✓ Setup complete!")
    print("=" * 60)
    print()
    print("Next steps:")
    print("1. Open http://localhost:3000 in your browser")
    print("2. Select a queue from the sidebar")
    print("3. Watch messages appear in real-time!")
    print()


if __name__ == "__main__":
    main()
