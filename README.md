# LocalStack Studio

A modern web-based monitoring tool for visualizing and interacting with AWS SQS queues running on [LocalStack](https://localstack.cloud/). Features real-time message streaming via WebSockets with a clean, responsive interface.

**Compatible with LocalStack v4.11+** | [LocalStack GitHub Repository](https://github.com/localstack/localstack)

![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)
![Python](https://img.shields.io/badge/python-3.11+-blue.svg)
![React](https://img.shields.io/badge/react-18.3-blue.svg)

## Features

- **Multi-Service Support**: Navigate between different AWS services with an intuitive service menu
- **Real-time SQS Monitoring**: Monitor SQS queues with live updates via WebSockets
- **Non-destructive Reading**: Messages are read using long polling without deletion
- **Modern UI**: Clean, responsive interface built with React and Vite
- **Easy Setup**: Fully containerized with Docker Compose
- **CLI Tool**: Publish messages to queues from the command line
- **Extensible Architecture**: Modular design makes it easy to add new AWS services

### Currently Supported Services

- ✅ **SQS (Simple Queue Service)** - Real-time message streaming and monitoring
- 🚧 **S3, DynamoDB, Lambda, SNS, Kinesis, EventBridge, Step Functions** - Coming soon

Want to add a new service? Check out [ADDING_SERVICES.md](ADDING_SERVICES.md)!

## Architecture

```
┌─────────────────┐
│  Frontend       │  React + Vite
│  (Port 3000)    │  Real-time UI with WebSocket client
└────────┬────────┘
         │
         │ HTTP/WebSocket
         ▼
┌─────────────────┐
│  Backend        │  FastAPI + WebSockets
│  (Port 8000)    │  REST API + Real-time streaming
└────────┬────────┘
         │
         │ AWS SDK (boto3)
         ▼
┌─────────────────┐
│  LocalStack     │  AWS Service Emulator
│  (Port 4566)    │  SQS (+ future services)
└─────────────────┘
```

## Quick Start

### Prerequisites

- Docker and Docker Compose
- LocalStack v4.11+ (automatically pulled via Docker)
- Python 3.11+ (for CLI tool)
- Node.js 20+ (for local frontend development)

### Running with Docker Compose

#### Option 1: Full Stack (with LocalStack included)

1. Clone the repository:
```bash
git clone https://github.com/yourusername/localstack-studio.git
cd localstack-studio
```

2. Start all services:
```bash
make up
# or
docker-compose up -d
```

3. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- LocalStack: http://localhost:4566

#### Option 2: Using External LocalStack (Local or Docker Desktop)

If you have LocalStack running locally or via Docker Desktop (accessible via `localhost`):

1. Configure the endpoint in `.env` file:
```bash
cp .env.example .env
# Edit .env and set:
# SQS_ENDPOINT=http://host.docker.internal:4566
```

2. Start only backend and frontend:
```bash
make up-no-localstack
```

3. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

**Note:** Make sure your external LocalStack instance has SQS service enabled.

#### Option 3: Connecting to LocalStack in Another Docker Network

If you have LocalStack running in a different Docker container/network (e.g., part of another docker-compose project):

1. First, identify your LocalStack network and container:
```bash
make network-info
```

This will show you:
- Available Docker networks
- Running LocalStack containers and their networks

2. Configure the connection in `.env`:
```bash
cp .env.example .env
```

Edit `.env` and set:
```bash
LOCALSTACK_NETWORK_NAME=your-network-name    # e.g., myproject_default
LOCALSTACK_CONTAINER_NAME=your-container-name # e.g., localstack-main
SQS_ENDPOINT=http://your-container-name:4566
```

3. Start backend and frontend connected to the external network:
```bash
make up-external-localstack
```

4. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

**Example:** If you have LocalStack running via another docker-compose with network `myapp_default` and container name `localstack`:
```bash
# .env
LOCALSTACK_NETWORK_NAME=myapp_default
LOCALSTACK_CONTAINER_NAME=localstack
SQS_ENDPOINT=http://localstack:4566
```

---

4. Create a test queue and send messages:
```bash
# Install CLI dependencies
cd scripts
pip install -r requirements.txt

# Create a queue and send a message
python publish_message.py test-queue '{"message": "Hello World"}' --create-queue
```

5. Open the frontend in your browser and select the queue to see real-time messages!

## Project Structure

```
localstack-studio/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── main.py         # FastAPI application
│   │   ├── sqs_service.py  # SQS client wrapper
│   │   └── websocket_manager.py  # WebSocket handling
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ServiceMenu.jsx     # Service navigation menu
│   │   │   ├── SQSService.jsx      # SQS service container
│   │   │   ├── QueueList.jsx       # Queue selection sidebar
│   │   │   ├── QueueViewer.jsx     # Message viewer
│   │   │   ├── ComingSoon.jsx      # Placeholder for future services
│   │   │   └── useQueueMessages.js # WebSocket hook
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── scripts/               # CLI tools
│   ├── publish_message.py # Message publisher
│   └── requirements.txt
│
├── docker-compose.yml              # Service orchestration
├── docker-compose.external-localstack.yml  # External LocalStack config
├── Makefile                        # Development commands
├── ADDING_SERVICES.md              # Guide for adding new services
├── LICENSE                         # Apache 2.0
└── README.md
```

## API Documentation

### Backend Endpoints

#### REST API

- `GET /` - Health check
- `GET /queues` - List all SQS queues
- `GET /queue/{queue_name}` - Get queue details and attributes

#### WebSocket

- `WS /ws/messages/{queue_name}` - Real-time message stream

Example WebSocket message:
```json
{
  "queue": "test-queue",
  "message": {
    "messageId": "abc-123",
    "body": "{\"foo\": \"bar\"}",
    "attributes": {...},
    "messageAttributes": {...},
    "receivedAt": "2025-01-10T12:00:00.000Z"
  }
}
```

## CLI Usage

The `publish_message.py` script allows you to send messages to SQS queues:

```bash
# Basic usage
python scripts/publish_message.py <queue-name> <message-body>

# Examples
python scripts/publish_message.py my-queue '{"user": "john", "action": "login"}'
python scripts/publish_message.py my-queue '{"data": "test"}' --delay 5
python scripts/publish_message.py my-queue 'Hello' --create-queue

# Options
  --endpoint URL         LocalStack endpoint (default: http://localhost:4566)
  --region REGION        AWS region (default: us-east-1)
  --delay SECONDS        Delay delivery (0-900 seconds)
  --create-queue         Create queue if it doesn't exist
  --validate-json        Validate message is valid JSON
```

## Development

### Backend Development

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run development server
export SQS_ENDPOINT=http://localhost:4566
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Configuration

### Environment Variables

Copy `.env.example` to `.env` to customize your configuration:

```bash
cp .env.example .env
```

#### Backend
- `SQS_ENDPOINT` - LocalStack SQS endpoint
  - Containerized LocalStack: `http://localstack:4566`
  - External LocalStack (Docker): `http://host.docker.internal:4566`
  - Local development: `http://localhost:4566`
- `AWS_REGION` - AWS region (default: `us-east-1`)
- `AWS_ACCESS_KEY_ID` - AWS credentials (default: `test`)
- `AWS_SECRET_ACCESS_KEY` - AWS credentials (default: `test`)

#### Frontend
- `VITE_BACKEND_URL` - Backend API URL (default: `http://localhost:8000`)

### Makefile Commands

```bash
# Docker Compose
make up                      # Start all services (full stack)
make up-full                 # Start all services including LocalStack
make up-no-localstack        # Start only backend and frontend (use external LocalStack)
make up-external-localstack  # Connect to existing LocalStack container in another network
make down                    # Stop all services
make down-external           # Stop services started with up-external-localstack
make logs                    # View logs from all services
make clean                   # Remove containers and volumes

# Network Tools
make network-info            # Show available Docker networks and LocalStack containers

# Development
make install                 # Install dependencies for local development
make dev-backend             # Run backend in development mode
make dev-frontend            # Run frontend in development mode

# Testing
make test-message            # Send a test message to a sample queue
```

## How It Works

### Message Polling Strategy

The backend uses **long polling** to efficiently monitor SQS queues:

1. Client connects to WebSocket endpoint: `/ws/messages/{queue_name}`
2. Backend starts polling loop with:
   - `WaitTimeSeconds=10` (long polling)
   - `VisibilityTimeout=1` (messages quickly reappear)
   - `MaxNumberOfMessages=10`
3. Each received message is broadcast to all connected WebSocket clients
4. Messages are **never deleted** from the queue

This approach ensures:
- Real-time updates with minimal latency
- Low resource usage (long polling reduces API calls)
- Non-destructive monitoring (messages remain in queue)

## Future Enhancements

This project is designed to be extensible. Planned features include:

- Support for additional LocalStack services (DynamoDB, S3, Lambda, etc.)
- Message filtering and search
- Queue metrics and statistics
- Message replay and publishing from UI
- Dead Letter Queue (DLQ) management
- Authentication and multi-user support

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Adding New Services

Want to add support for more AWS services? Check out our comprehensive guide: [ADDING_SERVICES.md](ADDING_SERVICES.md)

This guide covers:
- Service architecture overview
- Step-by-step implementation guide
- Frontend and backend patterns
- Testing strategies
- Best practices

### General Contribution Flow

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [LocalStack](https://localstack.cloud/) - Local AWS cloud stack ([GitHub](https://github.com/localstack/localstack))
- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [React](https://react.dev/) - JavaScript library for building user interfaces
- [Vite](https://vitejs.dev/) - Next generation frontend tooling

## Support

If you encounter any issues or have questions:

1. Check the [documentation](#api-documentation)
2. Search existing [issues](https://github.com/yourusername/localstack-studio/issues)
3. Create a new issue with detailed information

---

Built with ❤️ for the LocalStack community
