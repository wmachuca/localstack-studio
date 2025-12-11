.PHONY: help up up-full up-no-localstack up-external-localstack down down-external logs clean install test-message dev-backend dev-frontend network-info

help:
	@echo "LocalStack Studio - Available Commands"
	@echo "======================================"
	@echo "Docker Compose:"
	@echo "  make up                      - Start all services (full stack)"
	@echo "  make up-full                 - Start all services including LocalStack"
	@echo "  make up-no-localstack        - Start only backend and frontend (use external LocalStack)"
	@echo "  make up-external-localstack  - Connect to existing LocalStack container in another network"
	@echo "  make down                    - Stop all services"
	@echo "  make down-external           - Stop services started with up-external-localstack"
	@echo "  make logs                    - View logs from all services"
	@echo "  make clean                   - Remove containers and volumes"
	@echo ""
	@echo "Network Tools:"
	@echo "  make network-info            - Show available Docker networks and LocalStack containers"
	@echo ""
	@echo "Development:"
	@echo "  make install                 - Install dependencies for local development"
	@echo "  make dev-backend             - Run backend in development mode"
	@echo "  make dev-frontend            - Run frontend in development mode"
	@echo ""
	@echo "Testing:"
	@echo "  make test-message            - Send a test message to a sample queue"

up:
	docker-compose up -d

up-full:
	docker-compose up -d

up-no-localstack:
	@echo "Starting backend and frontend (without LocalStack)..."
	docker-compose up -d backend frontend

up-external-localstack:
	@echo "Connecting to external LocalStack container..."
	@echo "Make sure to configure .env with:"
	@echo "  - LOCALSTACK_NETWORK_NAME=your-network-name"
	@echo "  - LOCALSTACK_CONTAINER_NAME=your-container-name"
	@echo "  - SQS_ENDPOINT=http://your-container-name:4566"
	@if [ ! -f .env ]; then \
		echo ""; \
		echo "⚠️  Warning: .env file not found. Creating from .env.example..."; \
		cp .env.example .env; \
		echo "📝 Please edit .env and set the required variables, then run this command again."; \
		exit 1; \
	fi
	docker-compose -f docker-compose.external-localstack.yml up -d

down-external:
	docker-compose -f docker-compose.external-localstack.yml down

network-info:
	@echo "=== Available Docker Networks ==="
	@docker network ls --format "table {{.Name}}\t{{.Driver}}\t{{.Scope}}"
	@echo ""
	@echo "=== Running LocalStack Containers ==="
	@docker ps --filter "name=localstack" --format "table {{.Names}}\t{{.Networks}}\t{{.Ports}}" || echo "No LocalStack containers found"
	@echo ""
	@echo "To connect to an external LocalStack:"
	@echo "1. Note the network name from above"
	@echo "2. Note the container name"
	@echo "3. Update .env with these values"
	@echo "4. Run: make up-external-localstack"

down:
	docker-compose down

logs:
	docker-compose logs -f

clean:
	docker-compose down -v
	rm -rf localstack-data/

install:
	@echo "Installing backend dependencies..."
	cd backend && pip install -r requirements.txt
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "Installing CLI dependencies..."
	cd scripts && pip install -r requirements.txt
	@echo "✓ All dependencies installed"

test-message:
	@echo "Creating test queue and sending messages..."
	cd scripts && python publish_message.py test-queue '{"message": "Hello from LocalStack Studio!", "timestamp": "2025-01-10"}' --create-queue
	cd scripts && python publish_message.py test-queue '{"user": "alice", "action": "login", "status": "success"}'
	cd scripts && python publish_message.py test-queue '{"user": "bob", "action": "purchase", "amount": 99.99}'
	@echo "✓ Test messages sent to 'test-queue'"

dev-backend:
	@echo "Starting backend in development mode..."
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend:
	@echo "Starting frontend in development mode..."
	cd frontend && npm run dev
