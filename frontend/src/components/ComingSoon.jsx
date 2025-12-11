import './ComingSoon.css';

/**
 * Placeholder component for services that are not yet implemented
 */
export const ComingSoon = ({ serviceName, serviceIcon, serviceDescription }) => {
  return (
    <div className="coming-soon">
      <div className="coming-soon-content">
        <div className="coming-soon-icon">{serviceIcon}</div>
        <h2>{serviceName}</h2>
        <p className="coming-soon-description">{serviceDescription}</p>

        <div className="coming-soon-message">
          <div className="construction-icon">🚧</div>
          <h3>Coming Soon</h3>
          <p>
            We're working on adding support for {serviceName}.<br />
            This feature will be available in a future release.
          </p>
        </div>

        <div className="contribute-section">
          <h4>Want to contribute?</h4>
          <p>
            LocalStack Studio is open source! Help us add support for more services.
          </p>
          <a
            href="https://github.com/yourusername/localstack-studio"
            target="_blank"
            rel="noopener noreferrer"
            className="contribute-btn"
          >
            View on GitHub →
          </a>
        </div>

        <div className="current-services">
          <small>Currently supported services:</small>
          <div className="service-badges">
            <span className="service-badge active">📬 SQS</span>
          </div>
        </div>
      </div>
    </div>
  );
};
