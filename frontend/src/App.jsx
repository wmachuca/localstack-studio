import { useState } from 'react';
import { ServiceMenu, LOCALSTACK_SERVICES } from './components/ServiceMenu';
import { SQSService } from './components/SQSService';
import { ComingSoon } from './components/ComingSoon';
import './App.css';

function App() {
  // Start with SQS as the default service
  const [selectedService, setSelectedService] = useState('sqs');

  // Get backend URL from environment or use default
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  // Get the current service info
  const currentService = LOCALSTACK_SERVICES.find(s => s.id === selectedService);

  // Render the appropriate service component
  const renderServiceContent = () => {
    switch (selectedService) {
      case 'sqs':
        return <SQSService backendUrl={backendUrl} />;

      default:
        // Show "Coming Soon" for services not yet implemented
        return (
          <ComingSoon
            serviceName={currentService?.fullName || 'Service'}
            serviceIcon={currentService?.icon || '🚧'}
            serviceDescription={currentService?.description || 'AWS Service'}
          />
        );
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-main">
            <h1>LocalStack Studio</h1>
            <p>Real-time AWS Service Monitoring & Management</p>
          </div>
          {currentService && (
            <div className="current-service-badge">
              <span className="service-icon-small">{currentService.icon}</span>
              <span className="service-name-small">{currentService.name}</span>
            </div>
          )}
        </div>
      </header>

      <div className="app-content">
        <aside className="service-sidebar">
          <ServiceMenu
            selectedService={selectedService}
            onSelectService={setSelectedService}
          />
        </aside>

        <main className="main-content">
          {renderServiceContent()}
        </main>
      </div>
    </div>
  );
}

export default App;
