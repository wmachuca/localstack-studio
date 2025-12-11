import { useState, useEffect } from 'react';
import './QueueList.css';

/**
 * Component to display list of available SQS queues
 */
export const QueueList = ({ onSelectQueue, selectedQueue, backendUrl = 'http://localhost:8000' }) => {
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchQueues = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${backendUrl}/queues`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setQueues(data.queues || []);
    } catch (err) {
      console.error('Error fetching queues:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueues();

    // Refresh queue list every 10 seconds
    const interval = setInterval(fetchQueues, 10000);
    return () => clearInterval(interval);
  }, [backendUrl]);

  if (loading && queues.length === 0) {
    return (
      <div className="queue-list">
        <div className="queue-list-header">
          <h2>SQS Queues</h2>
        </div>
        <div className="loading">Loading queues...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="queue-list">
        <div className="queue-list-header">
          <h2>SQS Queues</h2>
        </div>
        <div className="error">
          <p>Error loading queues: {error}</p>
          <button onClick={fetchQueues}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="queue-list">
      <div className="queue-list-header">
        <h2>SQS Queues</h2>
        <button className="refresh-btn" onClick={fetchQueues} title="Refresh">
          ↻
        </button>
      </div>

      {queues.length === 0 ? (
        <div className="empty-state">
          <p>No queues found</p>
          <small>Create a queue in LocalStack to get started</small>
        </div>
      ) : (
        <ul className="queue-items">
          {queues.map((queue) => (
            <li
              key={queue.name}
              className={`queue-item ${selectedQueue === queue.name ? 'active' : ''}`}
              onClick={() => onSelectQueue(queue.name)}
            >
              <div className="queue-name">{queue.name}</div>
              <div className="queue-arrow">→</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
