import { useState } from 'react';
import { useApp } from '../../../../context/AppContext';
import './CreateQueueModal.css';

/**
 * Modal component for creating a new SQS queue
 */
export const CreateQueueModal = ({ isOpen, onClose, onQueueCreated }) => {
  const { backendUrl } = useApp();
  const [queueName, setQueueName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsCreating(true);

    try {
      // Validate queue name
      if (!queueName.trim()) {
        throw new Error('Queue name is required');
      }

      if (!/^[a-zA-Z0-9_-]+$/.test(queueName)) {
        throw new Error('Queue name can only contain alphanumeric characters, hyphens, and underscores');
      }

      const response = await fetch(`${backendUrl}/queue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          queue_name: queueName
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to create queue: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Queue created:', result);

      // Notify parent and close
      if (onQueueCreated) {
        onQueueCreated(queueName);
      }

      setQueueName('');
      onClose();
    } catch (err) {
      console.error('Error creating queue:', err);
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setQueueName('');
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create New Queue</h3>
          <button className="modal-close" onClick={handleClose} disabled={isCreating}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && (
            <div className="modal-error">
              ⚠ {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="queueName">Queue Name</label>
            <input
              id="queueName"
              type="text"
              className="queue-name-input"
              value={queueName}
              onChange={(e) => setQueueName(e.target.value)}
              placeholder="my-new-queue"
              required
              disabled={isCreating}
              autoFocus
            />
            <small className="form-hint">
              Only alphanumeric characters, hyphens (-), and underscores (_) are allowed.
            </small>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isCreating || !queueName.trim()}
            >
              {isCreating ? 'Creating...' : 'Create Queue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
