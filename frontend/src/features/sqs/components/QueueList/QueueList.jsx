import { useState, useEffect } from 'react';
import { useApp } from '../../../../context/AppContext';
import { CreateQueueModal } from '../CreateQueueModal/CreateQueueModal';
import './QueueList.css';

/**
 * Component to display list of available SQS queues
 */
export const QueueList = ({ onSelectQueue, selectedQueue }) => {
  const { backendUrl } = useApp();
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deletingQueue, setDeletingQueue] = useState(null);

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

  const handleDeleteQueue = async (queueName, e) => {
    e.stopPropagation();

    if (!window.confirm(`Are you sure you want to delete queue "${queueName}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingQueue(queueName);

    try {
      const response = await fetch(`${backendUrl}/queue/${queueName}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Failed to delete queue: ${response.statusText}`);
      }

      console.log('Queue deleted successfully');

      // Refresh queue list
      await fetchQueues();

      // If deleted queue was selected, clear selection
      if (selectedQueue === queueName) {
        onSelectQueue(null);
      }
    } catch (err) {
      console.error('Error deleting queue:', err);
      alert(`Error deleting queue: ${err.message}`);
    } finally {
      setDeletingQueue(null);
    }
  };

  const handleQueueCreated = () => {
    fetchQueues();
  };

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
        <div className="header-actions">
          <button className="create-btn" onClick={() => setIsCreateModalOpen(true)} title="Create Queue">
            +
          </button>
          <button className="refresh-btn" onClick={fetchQueues} title="Refresh">
            ↻
          </button>
        </div>
      </div>

      {queues.length === 0 ? (
        <div className="empty-state">
          <p>No queues found</p>
          <small>Create a queue to get started</small>
          <button className="create-first-btn" onClick={() => setIsCreateModalOpen(true)}>
            + Create Queue
          </button>
        </div>
      ) : (
        <ul className="queue-items">
          {queues.map((queue) => (
            <li
              key={queue.name}
              className={`queue-item ${selectedQueue === queue.name ? 'active' : ''}`}
            >
              <div className="queue-name" onClick={() => onSelectQueue(queue.name)}>
                {queue.name}
              </div>
              <button
                className="delete-queue-btn"
                onClick={(e) => handleDeleteQueue(queue.name, e)}
                disabled={deletingQueue === queue.name}
                title="Delete queue"
              >
                {deletingQueue === queue.name ? '⏳' : '🗑️'}
              </button>
            </li>
          ))}
        </ul>
      )}

      <CreateQueueModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onQueueCreated={handleQueueCreated}
      />
    </div>
  );
};
