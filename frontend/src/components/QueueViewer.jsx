import { useState } from 'react';
import { useQueueMessages } from './useQueueMessages';
import './QueueViewer.css';

/**
 * Component to display messages from a specific queue in real-time
 */
export const QueueViewer = ({ queueName, backendUrl = 'http://localhost:8000' }) => {
  const wsUrl = backendUrl.replace('http://', 'ws://').replace('https://', 'wss://');
  const { messages, isConnected, error, clearMessages } = useQueueMessages(queueName, wsUrl);
  const [expandedMessage, setExpandedMessage] = useState(null);

  if (!queueName) {
    return (
      <div className="queue-viewer">
        <div className="empty-viewer">
          <div className="empty-icon">📬</div>
          <h3>Select a queue to view messages</h3>
          <p>Choose a queue from the list on the left to start monitoring messages in real-time</p>
        </div>
      </div>
    );
  }

  const toggleMessageExpand = (messageId) => {
    setExpandedMessage(expandedMessage === messageId ? null : messageId);
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString() + '.' + date.getMilliseconds();
  };

  const formatJSON = (obj) => {
    try {
      if (typeof obj === 'string') {
        return JSON.stringify(JSON.parse(obj), null, 2);
      }
      return JSON.stringify(obj, null, 2);
    } catch {
      return obj;
    }
  };

  return (
    <div className="queue-viewer">
      <div className="viewer-header">
        <div className="header-left">
          <h2>{queueName}</h2>
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '● Live' : '○ Disconnected'}
          </span>
        </div>
        <div className="header-right">
          <span className="message-count">{messages.length} messages</span>
          <button className="clear-btn" onClick={clearMessages}>
            Clear
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          ⚠ {error}
        </div>
      )}

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="no-messages">
            <div className="no-messages-icon">📭</div>
            <h3>No messages yet</h3>
            <p>Waiting for messages from <strong>{queueName}</strong>...</p>
            {isConnected && (
              <small className="polling-info">
                Long polling active - messages will appear here in real-time
              </small>
            )}
          </div>
        ) : (
          <div className="message-list">
            {messages.map((msg, index) => (
              <div key={`${msg.messageId}-${index}`} className="message-card">
                <div
                  className="message-header"
                  onClick={() => toggleMessageExpand(msg.messageId)}
                >
                  <div className="message-info">
                    <span className="message-time">
                      {formatDate(msg.receivedAt)}
                    </span>
                    <span className="message-id" title={msg.messageId}>
                      ID: {msg.messageId?.substring(0, 20)}...
                    </span>
                  </div>
                  <button className="expand-btn">
                    {expandedMessage === msg.messageId ? '−' : '+'}
                  </button>
                </div>

                <div className="message-body">
                  <pre>{formatJSON(msg.body)}</pre>
                </div>

                {expandedMessage === msg.messageId && (
                  <div className="message-details">
                    {msg.attributes && Object.keys(msg.attributes).length > 0 && (
                      <div className="detail-section">
                        <h4>Attributes</h4>
                        <pre>{formatJSON(msg.attributes)}</pre>
                      </div>
                    )}

                    {msg.messageAttributes && Object.keys(msg.messageAttributes).length > 0 && (
                      <div className="detail-section">
                        <h4>Message Attributes</h4>
                        <pre>{formatJSON(msg.messageAttributes)}</pre>
                      </div>
                    )}

                    <div className="detail-section">
                      <h4>Receipt Handle</h4>
                      <pre className="receipt-handle">{msg.receiptHandle}</pre>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
