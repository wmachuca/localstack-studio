# Adding New Services to LocalStack Studio

This guide explains how to add support for additional AWS services to LocalStack Studio.

## Architecture Overview

LocalStack Studio uses a modular architecture where each AWS service has its own:
1. **Service Component** - React component for the service UI
2. **Backend Endpoints** - FastAPI endpoints to interact with LocalStack
3. **Service Definition** - Configuration in the service menu

## Current Services

- ✅ **SQS** - Fully implemented with real-time message streaming
- 🚧 **S3, DynamoDB, Lambda, SNS, etc.** - Coming soon

## How to Add a New Service

### Step 1: Update Service Menu

Edit `frontend/src/components/ServiceMenu.jsx` and add your service to the `LOCALSTACK_SERVICES` array:

```javascript
{
  id: 's3',                              // Unique identifier
  name: 'S3',                            // Short name
  fullName: 'Simple Storage Service',    // Full service name
  icon: '🪣',                            // Emoji icon
  enabled: true,                         // Set to true when ready
  description: 'Object storage service', // Brief description
  comingSoon: false                      // Remove when implemented
}
```

### Step 2: Create Service Component (Frontend)

Create a new component file: `frontend/src/components/S3Service.jsx`

```javascript
import { useState, useEffect } from 'react';
import './S3Service.css';

export const S3Service = ({ backendUrl }) => {
  const [buckets, setBuckets] = useState([]);
  const [selectedBucket, setSelectedBucket] = useState(null);

  useEffect(() => {
    // Fetch buckets from backend
    fetch(`${backendUrl}/s3/buckets`)
      .then(res => res.json())
      .then(data => setBuckets(data.buckets));
  }, [backendUrl]);

  return (
    <div className="s3-service">
      <aside className="s3-sidebar">
        {/* Bucket list component */}
      </aside>
      <main className="s3-main">
        {/* Bucket viewer component */}
      </main>
    </div>
  );
};
```

### Step 3: Add Service Route

Edit `frontend/src/App.jsx` and add your service to the switch statement:

```javascript
const renderServiceContent = () => {
  switch (selectedService) {
    case 'sqs':
      return <SQSService backendUrl={backendUrl} />;

    case 's3':  // Add your service here
      return <S3Service backendUrl={backendUrl} />;

    default:
      return <ComingSoon ... />;
  }
};
```

Don't forget to import your component:
```javascript
import { S3Service } from './components/S3Service';
```

### Step 4: Create Backend Endpoints

Create a new service file: `backend/app/s3_service.py`

```python
import boto3
from typing import List, Dict

class S3Service:
    def __init__(self, endpoint_url: str):
        self.client = boto3.client(
            's3',
            endpoint_url=endpoint_url,
            region_name='us-east-1',
            aws_access_key_id='test',
            aws_secret_access_key='test'
        )

    def list_buckets(self) -> List[Dict]:
        """List all S3 buckets"""
        response = self.client.list_buckets()
        return [{'name': bucket['Name']} for bucket in response.get('Buckets', [])]

    def list_objects(self, bucket_name: str) -> List[Dict]:
        """List objects in a bucket"""
        response = self.client.list_objects_v2(Bucket=bucket_name)
        return response.get('Contents', [])
```

### Step 5: Add API Routes

Edit `backend/app/main.py` and add routes for your service:

```python
from .s3_service import S3Service

# Initialize service
s3_service = S3Service(endpoint_url=SQS_ENDPOINT)

@app.get("/s3/buckets")
async def list_buckets():
    """Get list of all S3 buckets"""
    buckets = s3_service.list_buckets()
    return {"buckets": buckets}

@app.get("/s3/bucket/{bucket_name}")
async def get_bucket_objects(bucket_name: str):
    """Get objects in a specific bucket"""
    objects = s3_service.list_objects(bucket_name)
    return {"bucket": bucket_name, "objects": objects}
```

### Step 6: Add Styling

Create `frontend/src/components/S3Service.css`:

```css
.s3-service {
  display: flex;
  height: 100%;
  overflow: hidden;
}

.s3-sidebar {
  width: 320px;
  background: white;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}

.s3-main {
  flex: 1;
  overflow: hidden;
}
```

### Step 7: Update Documentation

Update the following files:
- `README.md` - Add service to features list
- `CONTRIBUTING.md` - Document any service-specific guidelines

## Testing Your Service

### Frontend Testing

```bash
cd frontend
npm run dev
```

Navigate to http://localhost:3000 and select your service from the menu.

### Backend Testing

```bash
cd backend
uvicorn app.main:app --reload
```

Test endpoints:
```bash
curl http://localhost:8000/s3/buckets
curl http://localhost:8000/s3/bucket/my-bucket
```

### Integration Testing

1. Start LocalStack with your service enabled:
```bash
SERVICES=s3,sqs docker-compose up -d
```

2. Create test data:
```bash
aws --endpoint-url=http://localhost:4566 s3 mb s3://test-bucket
aws --endpoint-url=http://localhost:4566 s3 cp file.txt s3://test-bucket/
```

3. Verify in LocalStack Studio UI

## Best Practices

### 1. Component Structure

Follow the SQS service pattern:
- Create a main service component (e.g., `S3Service.jsx`)
- Break down into smaller components (e.g., `BucketList.jsx`, `BucketViewer.jsx`)
- Keep components modular and reusable

### 2. State Management

- Use React hooks (`useState`, `useEffect`)
- Consider creating custom hooks for complex logic (see `useQueueMessages.js`)
- Handle loading, error, and empty states

### 3. Backend Services

- Create a dedicated service class for each AWS service
- Use boto3 for AWS SDK interactions
- Handle errors gracefully
- Add proper logging

### 4. Real-time Features

For real-time updates (like SQS), consider:
- WebSocket connections
- Polling with configurable intervals
- Proper cleanup on component unmount

### 5. Styling

- Use CSS modules or separate CSS files
- Follow the existing design system (colors, spacing, typography)
- Ensure responsive design (mobile, tablet, desktop)
- Use existing CSS variables and utilities

## Example: Full S3 Implementation Checklist

- [ ] Add S3 to service menu with `enabled: true`
- [ ] Create `S3Service.jsx` component
- [ ] Create `BucketList.jsx` component
- [ ] Create `BucketViewer.jsx` component
- [ ] Create `ObjectUploader.jsx` component
- [ ] Add S3 case to App.jsx switch
- [ ] Create `s3_service.py` backend service
- [ ] Add `/s3/buckets` endpoint
- [ ] Add `/s3/bucket/{name}` endpoint
- [ ] Add `/s3/upload` endpoint
- [ ] Add `/s3/download/{bucket}/{key}` endpoint
- [ ] Create S3Service.css
- [ ] Update README.md
- [ ] Add tests
- [ ] Update LocalStack docker-compose services

## Common Patterns

### Listing Resources

```javascript
const [resources, setResources] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchResources = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/service/resources`);
      const data = await response.json();
      setResources(data.resources);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  fetchResources();
  const interval = setInterval(fetchResources, 10000);
  return () => clearInterval(interval);
}, [backendUrl]);
```

### Error Handling

```javascript
const [error, setError] = useState(null);

try {
  // API call
} catch (err) {
  setError(err.message);
}

// In render:
{error && (
  <div className="error">
    <p>Error: {error}</p>
    <button onClick={retry}>Retry</button>
  </div>
)}
```

## Need Help?

- Check the SQS implementation as a reference
- Review the existing components in `frontend/src/components/`
- Look at the backend services in `backend/app/`
- Open an issue on GitHub for questions

## Contributing

We welcome contributions! Please:
1. Fork the repository
2. Create a feature branch
3. Implement your service following this guide
4. Add tests
5. Submit a pull request

---

**Happy coding!** 🚀
