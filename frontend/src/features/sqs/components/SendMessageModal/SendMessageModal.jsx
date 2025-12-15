import { useState } from 'react';
import { useApp } from '../../../../context/AppContext';
import './SendMessageModal.css';

/**
 * Modal component for sending messages to a queue
 */
export const SendMessageModal = ({ isOpen, onClose, queueName }) => {
  const { backendUrl } = useApp();
  const [messageBody, setMessageBody] = useState('');
  const [delaySeconds, setDelaySeconds] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSending(true);

    try {
      // Validate JSON if it looks like JSON
      if (messageBody.trim().startsWith('{') || messageBody.trim().startsWith('[')) {
        JSON.parse(messageBody); // Validate JSON syntax
      }

      const response = await fetch(`${backendUrl}/queue/${queueName}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message_body: messageBody,
          delay_seconds: parseInt(delaySeconds, 10)
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Message sent:', result);

      setSuccess(true);
      setMessageBody('');
      setDelaySeconds(0);

      // Close modal after short delay
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);

    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    if (!isSending) {
      setMessageBody('');
      setDelaySeconds(0);
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Send Message to {queueName}</h3>
          <button className="modal-close" onClick={handleClose} disabled={isSending}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && (
            <div className="modal-error">
              ⚠ {error}
            </div>
          )}

          {success && (
            <div className="modal-success">
              ✓ Message sent successfully!
            </div>
          )}

          <div className="form-group">
            <label htmlFor="messageBody">Message Body</label>
            <textarea
              id="messageBody"
              className="message-input"
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              placeholder='{"key": "value"} or plain text'
              rows={10}
              required
              disabled={isSending}
            />
            <small className="form-hint">
              Enter JSON or plain text. JSON will be validated before sending.
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="delaySeconds">Delay (seconds)</label>
            <input
              id="delaySeconds"
              type="number"
              className="delay-input"
              value={delaySeconds}
              onChange={(e) => setDelaySeconds(e.target.value)}
              min="0"
              max="900"
              disabled={isSending}
            />
            <small className="form-hint">
              Delay before message becomes available (0-900 seconds)
            </small>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={isSending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSending || !messageBody.trim()}
            >
              {isSending ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
