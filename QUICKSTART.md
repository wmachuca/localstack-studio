# Quick Start Guide

Get LocalStack Studio up and running in 5 minutes!

## Prerequisites

Make sure you have installed:
- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

> **Note:** This project uses [LocalStack v4.11+](https://github.com/localstack/localstack) which will be automatically pulled via Docker.

## Step 1: Clone and Start

```bash
# Clone the repository
git clone https://github.com/yourusername/localstack-studio.git
cd localstack-studio

# Start all services (full stack with LocalStack)
make up
```

This will start three services:
- **LocalStack** (port 4566) - AWS services emulator
- **Backend** (port 8000) - FastAPI + WebSockets
- **Frontend** (port 3000) - React web interface

### Alternative 1: Using External LocalStack (Local/Docker Desktop)

If you have LocalStack running locally or via Docker Desktop:

```bash
# Configure connection to external LocalStack
cp .env.example .env
# Edit .env and set: SQS_ENDPOINT=http://host.docker.internal:4566

# Start only backend and frontend
make up-no-localstack
```

### Alternative 2: Connect to LocalStack in Another Docker Network

If LocalStack is running in a different Docker network (e.g., another docker-compose project):

```bash
# 1. Find your LocalStack network and container name
make network-info

# 2. Configure .env with the network and container information
cp .env.example .env
# Edit .env and set:
#   LOCALSTACK_NETWORK_NAME=myproject_default
#   LOCALSTACK_CONTAINER_NAME=localstack
#   SQS_ENDPOINT=http://localstack:4566

# 3. Start backend and frontend on the external network
make up-external-localstack
```

## Step 2: Create Sample Data

Wait about 10 seconds for services to start, then create sample queues:

```bash
# Install CLI dependencies
cd scripts
pip install -r requirements.txt

# Create sample queues with test messages
python create_sample_queues.py
```

## Step 3: Open the Web Interface

Open your browser and navigate to:

```
http://localhost:3000
```

You should see:
- **Left sidebar**: List of available queues
- **Main panel**: Message viewer (empty until you select a queue)

## Step 4: Monitor Messages

1. Click on any queue in the sidebar (e.g., "user-events")
2. Watch as messages appear in real-time
3. Click the **+** button on any message to see full details

## Step 5: Send Custom Messages

Send your own messages using the CLI tool:

```bash
# Basic message
python publish_message.py user-events '{"user": "test", "action": "click"}'

# Message with delay
python publish_message.py order-processing '{"orderId": "ORD-999"}' --delay 5

# Create a new queue
python publish_message.py my-new-queue '{"data": "test"}' --create-queue
```

Messages will appear in the web interface instantly!

## Useful Commands

```bash
# View logs from all services
make logs
# or: docker-compose logs -f

# Stop all services
make down

# Stop and remove all data
make clean

# Restart a specific service
docker-compose restart backend
docker-compose restart frontend

# Run with Makefile
make up                 # Full stack with LocalStack
make up-no-localstack   # Without LocalStack (use external)
make test-message       # Send test messages to queue
```

## Troubleshooting

### Services won't start

```bash
# Check if ports are already in use
lsof -i :3000  # Frontend
lsof -i :8000  # Backend
lsof -i :4566  # LocalStack

# Force remove old containers
docker-compose down -v
docker-compose up -d
```

### No queues showing up

1. Verify LocalStack is running:
```bash
curl http://localhost:4566/_localstack/health
```

2. Check backend logs:
```bash
docker-compose logs backend
```

### Messages not appearing

1. Check WebSocket connection in browser console (F12)
2. Verify backend is running:
```bash
curl http://localhost:8000/queues
```

### Using external LocalStack

1. Verify your external LocalStack is running:
```bash
curl http://localhost:4566/_localstack/health
```

2. Make sure SQS service is enabled in your LocalStack configuration

3. If using Docker for backend/frontend, use `host.docker.internal` instead of `localhost` in `.env`:
```bash
SQS_ENDPOINT=http://host.docker.internal:4566
```

### Cannot connect to LocalStack in another Docker network

1. Use `make network-info` to verify:
   - The Docker network exists
   - The LocalStack container is running
   - The network name matches your `.env` configuration

2. Ensure your `.env` file has the correct settings:
```bash
LOCALSTACK_NETWORK_NAME=your-actual-network-name
LOCALSTACK_CONTAINER_NAME=your-actual-container-name
SQS_ENDPOINT=http://your-actual-container-name:4566
```

3. Verify the network is external (not internal to another compose project):
```bash
docker network inspect your-network-name
```

4. If the LocalStack container is in a docker-compose project, you may need to make its network external:
```yaml
# In your LocalStack's docker-compose.yml
networks:
  your-network:
    name: your-network-name
    # This makes it accessible from other compose projects
```

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check [CONTRIBUTING.md](CONTRIBUTING.md) to contribute
- Explore the API at http://localhost:8000/docs

## Example Workflow

Here's a complete example workflow:

```bash
# 1. Start services
docker-compose up -d

# 2. Wait for services to be ready (check logs)
docker-compose logs -f

# 3. Create a queue and send messages
cd scripts
pip install -r requirements.txt
python publish_message.py demo-queue "Hello LocalStack!" --create-queue
python publish_message.py demo-queue '{"timestamp": "2025-01-10", "event": "test"}'

# 4. Open browser to http://localhost:3000
# 5. Select "demo-queue" from the sidebar
# 6. Watch messages appear in real-time!
```

Enjoy using LocalStack Studio! 🚀
