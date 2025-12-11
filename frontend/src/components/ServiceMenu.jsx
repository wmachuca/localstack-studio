import './ServiceMenu.css';

/**
 * LocalStack services that are commonly used
 * Each service will have its own viewer component
 */
const LOCALSTACK_SERVICES = [
  {
    id: 'sqs',
    name: 'SQS',
    fullName: 'Simple Queue Service',
    icon: '📬',
    enabled: true,
    description: 'Message queuing service'
  },
  {
    id: 's3',
    name: 'S3',
    fullName: 'Simple Storage Service',
    icon: '🪣',
    enabled: false,
    description: 'Object storage service',
    comingSoon: true
  },
  {
    id: 'dynamodb',
    name: 'DynamoDB',
    fullName: 'DynamoDB',
    icon: '🗄️',
    enabled: false,
    description: 'NoSQL database service',
    comingSoon: true
  },
  {
    id: 'lambda',
    name: 'Lambda',
    fullName: 'Lambda Functions',
    icon: 'λ',
    enabled: false,
    description: 'Serverless compute',
    comingSoon: true
  },
  {
    id: 'sns',
    name: 'SNS',
    fullName: 'Simple Notification Service',
    icon: '📢',
    enabled: false,
    description: 'Pub/sub messaging',
    comingSoon: true
  },
  {
    id: 'kinesis',
    name: 'Kinesis',
    fullName: 'Kinesis Data Streams',
    icon: '🌊',
    enabled: false,
    description: 'Real-time data streaming',
    comingSoon: true
  },
  {
    id: 'eventbridge',
    name: 'EventBridge',
    fullName: 'EventBridge',
    icon: '🔗',
    enabled: false,
    description: 'Event bus service',
    comingSoon: true
  },
  {
    id: 'stepfunctions',
    name: 'Step Functions',
    fullName: 'Step Functions',
    icon: '⚙️',
    enabled: false,
    description: 'Workflow orchestration',
    comingSoon: true
  }
];

/**
 * Service navigation menu component
 * Allows users to switch between different LocalStack services
 */
export const ServiceMenu = ({ selectedService, onSelectService }) => {
  return (
    <div className="service-menu">
      <div className="service-menu-header">
        <h3>AWS Services</h3>
        <span className="service-count">{LOCALSTACK_SERVICES.filter(s => s.enabled).length} active</span>
      </div>

      <nav className="service-list">
        {LOCALSTACK_SERVICES.map((service) => (
          <button
            key={service.id}
            className={`service-item ${selectedService === service.id ? 'active' : ''} ${!service.enabled ? 'disabled' : ''}`}
            onClick={() => service.enabled && onSelectService(service.id)}
            disabled={!service.enabled}
            title={service.enabled ? service.fullName : `${service.fullName} - Coming Soon`}
          >
            <span className="service-icon">{service.icon}</span>
            <div className="service-info">
              <div className="service-name">
                {service.name}
                {service.comingSoon && <span className="badge">Soon</span>}
              </div>
              <div className="service-description">{service.description}</div>
            </div>
          </button>
        ))}
      </nav>

      <div className="service-menu-footer">
        <small>Powered by LocalStack</small>
      </div>
    </div>
  );
};

export { LOCALSTACK_SERVICES };
