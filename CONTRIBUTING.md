# Contributing to LocalStack Studio

Thank you for your interest in contributing to LocalStack Studio! This document provides guidelines and instructions for contributing.

## Code of Conduct

This project adheres to a code of conduct that all contributors are expected to follow. Please be respectful and constructive in all interactions.

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Python 3.11+
- Node.js 20+
- Git

### Development Setup

1. Fork and clone the repository:
```bash
git clone https://github.com/yourusername/localstack-studio.git
cd localstack-studio
```

2. Install dependencies:
```bash
make install
```

3. Start LocalStack:
```bash
docker-compose up -d localstack
```

4. Run backend in development mode:
```bash
make dev-backend
```

5. In a separate terminal, run frontend in development mode:
```bash
make dev-frontend
```

## Project Structure

- `backend/` - FastAPI application with WebSocket support
- `frontend/` - React + Vite application
- `scripts/` - CLI tools and utilities
- `docs/` - Additional documentation

## Development Workflow

### Backend Development

The backend is built with FastAPI and uses:
- **boto3** for AWS SDK interactions
- **WebSockets** for real-time message streaming
- **uvicorn** as the ASGI server

Key files:
- `backend/app/main.py` - FastAPI application and routes
- `backend/app/sqs_service.py` - SQS client wrapper
- `backend/app/websocket_manager.py` - WebSocket connection management

To add a new endpoint:
1. Add route handler in `main.py`
2. Add business logic in appropriate service file
3. Update API documentation in README

### Frontend Development

The frontend uses React with functional components and hooks:
- **Vite** for fast development and building
- **WebSocket API** for real-time updates
- **CSS Modules** for styling

Key files:
- `frontend/src/App.jsx` - Main application component
- `frontend/src/components/QueueList.jsx` - Queue selection sidebar
- `frontend/src/components/QueueViewer.jsx` - Message display component
- `frontend/src/components/useQueueMessages.js` - WebSocket hook

To add a new component:
1. Create component file in `src/components/`
2. Create corresponding CSS file
3. Import and use in parent component

### Code Style

#### Python
- Follow PEP 8 style guide
- Use type hints where appropriate
- Add docstrings to functions and classes
- Maximum line length: 100 characters

#### JavaScript/React
- Use functional components with hooks
- Use descriptive variable names
- Add JSDoc comments for complex functions
- Use consistent formatting (2-space indentation)

### Testing

Currently, the project focuses on manual testing. Automated tests are welcome contributions!

To test manually:
1. Start all services with `make up`
2. Create test queues with `python scripts/create_sample_queues.py`
3. Verify functionality in browser at http://localhost:3000

## Pull Request Process

1. Create a feature branch from `main`:
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes following the code style guidelines

3. Test your changes thoroughly:
```bash
# Start services
make up

# Test manually or run automated tests (when available)
```

4. Commit your changes with clear, descriptive messages:
```bash
git commit -m "Add feature: description of what you added"
```

5. Push to your fork:
```bash
git push origin feature/your-feature-name
```

6. Open a Pull Request with:
   - Clear title describing the change
   - Description of what changed and why
   - Any relevant issue numbers
   - Screenshots for UI changes

### PR Guidelines

- Keep PRs focused on a single feature or fix
- Update documentation as needed
- Ensure code follows style guidelines
- Add comments for complex logic
- Update README if adding new features

## Adding Support for New AWS Services

To extend LocalStack Studio to support services beyond SQS:

1. **Backend Changes:**
   - Create a new service file (e.g., `dynamodb_service.py`)
   - Add REST endpoints in `main.py`
   - Add WebSocket endpoints if real-time updates are needed

2. **Frontend Changes:**
   - Create new components for the service
   - Add navigation/routing if needed
   - Update UI to show new service

3. **Documentation:**
   - Update README with new features
   - Add examples and usage instructions

## Ideas for Contributions

Here are some areas where contributions would be valuable:

### Features
- Add support for more LocalStack services (DynamoDB, S3, Lambda, etc.)
- Implement message search and filtering
- Add queue metrics and statistics dashboard
- Create message composer/sender in UI
- Add authentication and user management
- Implement export functionality (CSV, JSON)

### Improvements
- Add automated tests (unit, integration, e2e)
- Improve error handling and user feedback
- Add loading states and skeleton screens
- Implement dark mode
- Add keyboard shortcuts
- Improve accessibility (ARIA labels, keyboard navigation)

### Documentation
- Add API documentation with examples
- Create tutorial videos or GIFs
- Write blog posts about use cases
- Improve code comments

### DevOps
- Add CI/CD pipeline
- Create Kubernetes deployment files
- Add monitoring and observability
- Optimize Docker images

## Questions?

If you have questions about contributing:
1. Check existing documentation
2. Search closed issues and PRs
3. Open a new issue with the "question" label

## License

By contributing, you agree that your contributions will be licensed under the Apache License 2.0.
