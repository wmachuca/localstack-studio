# LocalStack Studio

A modern web-based management tool for visualizing and interacting with AWS services running on [LocalStack](https://localstack.cloud/). Features real-time SQS message streaming via WebSockets and comprehensive DynamoDB table management with a clean, responsive interface.

**Compatible with LocalStack v4.11+** | [LocalStack GitHub Repository](https://github.com/localstack/localstack)

![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)
![Python](https://img.shields.io/badge/python-3.11+-blue.svg)
![React](https://img.shields.io/badge/react-18.3-blue.svg)

## Features

- **Multi-Service Support**: Navigate between different AWS services with an intuitive service menu
- **Real-time SQS Monitoring**: Monitor SQS queues with live updates via WebSockets
- **DynamoDB Management**: Full CRUD operations on DynamoDB tables with scan and pagination
- **Non-destructive SQS Reading**: Messages are read using long polling without deletion
- **Modern UI**: Clean, responsive interface built with React and Vite
- **Easy Setup**: Fully containerized with Docker Compose
- **CLI Tool**: Publish messages to queues from the command line
- **Extensible Architecture**: Modular, feature-based design makes it easy to add new AWS services

### Currently Supported Services

- ✅ **SQS (Simple Queue Service)** - Real-time message streaming, send/delete messages
- ✅ **DynamoDB** - List tables, view items, create/edit/delete items, scan with pagination
- 🚧 **S3, Lambda, SNS, Kinesis, EventBridge, Step Functions** - Coming soon

Want to add a new service? Check out [ADDING_SERVICES.md](ADDING_SERVICES.md)!

## Architecture

### System Overview

```
┌─────────────────┐
│  Frontend       │  React + Vite
│  (Port 3000)    │  Context API + Custom Hooks
└────────┬────────┘
         │
         │ HTTP/WebSocket
         ▼
┌─────────────────┐
│  Backend        │  FastAPI (Modular Architecture)
│  (Port 8000)    │  Routers + Services + Models
└────────┬────────┘
         │
         │ AWS SDK (boto3)
         ▼
┌─────────────────┐
│  LocalStack     │  AWS Service Emulator
│  (Port 4566)    │  SQS + DynamoDB + More
└─────────────────┘
```

### Frontend Architecture

The frontend uses a **feature-based organization** with React Context API and custom hooks:

```
- Context API (AppContext) → Global state management
- Custom Hooks (useApi, usePoll) → Reusable logic
- Feature Modules (features/sqs, features/dynamodb) → Self-contained service UIs
- Shared Components (ServiceMenu, ComingSoon) → Cross-feature components
```

**Benefits:**
- No props drilling (Context API)
- Reusable API patterns (custom hooks)
- Clear separation by service (feature modules)
- Easy to add new services

### Backend Architecture

The backend follows a **modular FastAPI pattern** with clear separation of concerns:

```
- Routers → HTTP endpoints and request/response handling
- Services → Business logic and AWS SDK interactions
- Models → Request/response validation (Pydantic)
- WebSocket Manager → Real-time message streaming
```

**Benefits:**
- Clean separation of concerns
- Easy to test individual components
- Scalable for adding new services
- Standard FastAPI best practices

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
# DYNAMODB_ENDPOINT=http://host.docker.internal:4566
```

2. Start only backend and frontend:
```bash
make up-no-localstack
```

3. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

**Note:** Make sure your external LocalStack instance has SQS and DynamoDB services enabled.

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
DYNAMODB_ENDPOINT=http://your-container-name:4566
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
DYNAMODB_ENDPOINT=http://localstack:4566
```

---

### Testing the Application

#### SQS (Simple Queue Service)

1. Create a test queue and send messages:
```bash
# Install CLI dependencies
cd scripts
pip install -r requirements.txt

# Create a queue and send a message
python publish_message.py test-queue '{"message": "Hello World"}' --create-queue

# Send more messages
python publish_message.py test-queue '{"user": "alice", "action": "login"}'
python publish_message.py test-queue '{"event": "test"}' --delay 5
```

2. Open http://localhost:3000 in your browser
3. Select **SQS** from the service menu
4. Click on `test-queue` to see real-time messages!

#### DynamoDB

1. Create a test table with items:
```bash
# Create table
aws dynamodb create-table \
  --endpoint-url http://localhost:4566 \
  --table-name users \
  --key-schema AttributeName=userId,KeyType=HASH \
  --attribute-definitions AttributeName=userId,AttributeType=S \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1

# Add items
aws dynamodb put-item \
  --endpoint-url http://localhost:4566 \
  --table-name users \
  --item '{"userId": {"S": "user1"}, "name": {"S": "Alice"}, "email": {"S": "alice@example.com"}}' \
  --region us-east-1
```

2. Open http://localhost:3000 in your browser
3. Select **DynamoDB** from the service menu
4. Click on `users` table to view items
5. Try the features:
   - **Scan items** with configurable limits (25/50/100/500)
   - **Add new items** with the "+ Add Item" button
   - **Edit items** by clicking the ✏️ icon
   - **Delete items** by clicking the 🗑️ icon
   - **Load more** for pagination

## Project Structure

```
localstack-studio/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── main.py            # FastAPI app configuration + router registration
│   │   ├── core/
│   │   │   └── config.py      # Environment configuration
│   │   ├── models/            # Pydantic models for request/response
│   │   │   ├── sqs.py
│   │   │   └── dynamodb.py
│   │   ├── services/          # Business logic and AWS SDK interactions
│   │   │   ├── sqs_service.py
│   │   │   └── dynamodb_service.py
│   │   ├── routers/           # HTTP endpoints
│   │   │   ├── sqs.py
│   │   │   └── dynamodb.py
│   │   └── websocket/
│   │       └── manager.py     # WebSocket handling for real-time updates
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── context/           # Global state management
│   │   │   └── AppContext.jsx # Backend URL, WebSocket URL
│   │   ├── hooks/             # Reusable custom hooks
│   │   │   ├── useApi.js      # API calls with loading/error states
│   │   │   └── usePoll.js     # Auto-refresh functionality
│   │   ├── components/        # Shared components
│   │   │   ├── ServiceMenu.jsx
│   │   │   └── ComingSoon.jsx
│   │   ├── features/          # Feature-based modules
│   │   │   ├── sqs/          # SQS module
│   │   │   │   ├── SQSService.jsx
│   │   │   │   ├── components/
│   │   │   │   │   ├── QueueList/
│   │   │   │   │   ├── QueueViewer/
│   │   │   │   │   └── SendMessageModal/
│   │   │   │   ├── hooks/
│   │   │   │   │   └── useQueueMessages.js
│   │   │   │   └── index.js
│   │   │   └── dynamodb/     # DynamoDB module
│   │   │       ├── DynamoDBService.jsx
│   │   │       ├── components/
│   │   │       │   ├── TableList/
│   │   │       │   ├── ItemViewer/
│   │   │       │   └── ItemEditor/
│   │   │       └── index.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── scripts/                   # CLI tools
│   ├── publish_message.py    # Message publisher
│   └── requirements.txt
│
├── docker-compose.yml                      # Full stack orchestration
├── docker-compose.external-localstack.yml  # External LocalStack config
├── Makefile                                # Development commands
├── CONTRIBUTING.md                         # Contribution guidelines
├── QUICKSTART.md                           # Quick start guide
├── LICENSE                                 # Apache 2.0
└── README.md
```

## API Documentation

### Backend Endpoints

#### SQS Endpoints

- `GET /queues` - List all SQS queues
  ```json
  {
    "queues": [
      {
        "name": "test-queue",
        "url": "http://localhost:4566/000000000000/test-queue",
        "attributes": {...}
      }
    ]
  }
  ```

- `GET /queue/{queue_name}` - Get queue details and attributes
- `POST /queue/{queue_name}/message` - Send message to queue
  ```json
  {
    "message_body": "{\"key\": \"value\"}",
    "delay_seconds": 0
  }
  ```

- `DELETE /queue/{queue_name}/message` - Delete message from queue
  ```json
  {
    "receipt_handle": "abc123..."
  }
  ```

#### DynamoDB Endpoints

- `GET /dynamodb/tables` - List all DynamoDB tables
  ```json
  {
    "tables": [
      {
        "name": "users",
        "itemCount": 3,
        "sizeBytes": 161,
        "status": "ACTIVE",
        "creationDateTime": "2025-12-13T21:47:35"
      }
    ],
    "count": 1
  }
  ```

- `GET /dynamodb/tables/{table_name}` - Describe table schema
  ```json
  {
    "name": "users",
    "status": "ACTIVE",
    "itemCount": 3,
    "keySchema": [
      {"attributeName": "userId", "keyType": "HASH"}
    ],
    "attributeDefinitions": [
      {"attributeName": "userId", "attributeType": "S"}
    ]
  }
  ```

- `POST /dynamodb/tables/{table_name}/scan` - Scan table items with pagination
  ```json
  {
    "limit": 50,
    "exclusive_start_key": null
  }
  ```

- `POST /dynamodb/tables/{table_name}/query` - Query table items (coming soon)
- `GET /dynamodb/tables/{table_name}/items` - Get single item
- `POST /dynamodb/tables/{table_name}/items` - Create/update item
  ```json
  {
    "item": {
      "userId": "user1",
      "name": "Alice",
      "email": "alice@example.com"
    }
  }
  ```

- `DELETE /dynamodb/tables/{table_name}/items` - Delete item
  ```json
  {
    "key": {
      "userId": "user1"
    }
  }
  ```

#### WebSocket

- `WS /ws/messages/{queue_name}` - Real-time SQS message stream

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

### Interactive API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

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
export DYNAMODB_ENDPOINT=http://localhost:4566
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
- `DYNAMODB_ENDPOINT` - LocalStack DynamoDB endpoint (same options as above)
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

### SQS Message Polling Strategy

The backend uses **long polling** to efficiently monitor SQS queues:

1. Client connects to WebSocket endpoint: `/ws/messages/{queue_name}`
2. Backend starts polling loop with:
   - `WaitTimeSeconds=10` (long polling)
   - `VisibilityTimeout=1` (messages quickly reappear)
   - `MaxNumberOfMessages=10`
3. Each received message is broadcast to all connected WebSocket clients
4. Messages are **never deleted** automatically (manual deletion available)

This approach ensures:
- Real-time updates with minimal latency
- Low resource usage (long polling reduces API calls)
- Non-destructive monitoring (messages remain in queue)

### DynamoDB Item Management

The DynamoDB service provides comprehensive table management:

1. **List Tables**: Auto-refreshes every 10 seconds to show all tables with metadata
2. **Scan Items**:
   - Configurable limits (25/50/100/500 items per scan)
   - Pagination support with `lastEvaluatedKey`
   - "Load More" button for additional pages
3. **CRUD Operations**:
   - Create: JSON editor with required key validation
   - Read: Expandable item cards with full JSON view
   - Update: Edit items in place with JSON editor
   - Delete: One-click deletion with confirmation
4. **Schema Awareness**: Automatically detects and validates key attributes

## Future Enhancements

This project is designed to be extensible. Planned features include:

### SQS Enhancements
- Message filtering and search
- Queue metrics and statistics
- Dead Letter Queue (DLQ) management
- Batch operations

### DynamoDB Enhancements
- Query builder with index selection
- Filter expressions
- Batch import/export (CSV, JSON)
- Table creation from UI
- Global Secondary Index (GSI) management

### New Services
- **S3** - Bucket browsing, file upload/download
- **Lambda** - Function invocation and log viewing
- **SNS** - Topic management and subscription
- **Kinesis** - Stream monitoring
- **EventBridge** - Event rule management
- **Step Functions** - Workflow visualization

### General Improvements
- Authentication and multi-user support
- Role-based access control (RBAC)
- Dark mode
- Export/Import configurations
- Service health monitoring

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
2. Review the [Quick Start guide](#quick-start)
3. Search existing [issues](https://github.com/yourusername/localstack-studio/issues)
4. Create a new issue with detailed information

---

Built with ❤️ for the LocalStack community
