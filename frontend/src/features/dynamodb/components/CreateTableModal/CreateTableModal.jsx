import { useState } from 'react';
import { useApp } from '../../../../context/AppContext';
import './CreateTableModal.css';

/**
 * Modal component for creating a new DynamoDB table
 */
export const CreateTableModal = ({ isOpen, onClose, onTableCreated }) => {
  const { backendUrl } = useApp();
  const [tableName, setTableName] = useState('');
  const [partitionKey, setPartitionKey] = useState('');
  const [partitionKeyType, setPartitionKeyType] = useState('S');
  const [hasSortKey, setHasSortKey] = useState(false);
  const [sortKey, setSortKey] = useState('');
  const [sortKeyType, setSortKeyType] = useState('S');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsCreating(true);

    try {
      // Validate inputs
      if (!tableName.trim() || !partitionKey.trim()) {
        throw new Error('Table name and partition key are required');
      }

      if (hasSortKey && !sortKey.trim()) {
        throw new Error('Sort key name is required when enabled');
      }

      // Build key schema
      const keySchema = [
        { AttributeName: partitionKey, KeyType: 'HASH' }
      ];

      const attributeDefinitions = [
        { AttributeName: partitionKey, AttributeType: partitionKeyType }
      ];

      if (hasSortKey) {
        keySchema.push({ AttributeName: sortKey, KeyType: 'RANGE' });
        attributeDefinitions.push({ AttributeName: sortKey, AttributeType: sortKeyType });
      }

      const response = await fetch(`${backendUrl}/dynamodb/tables`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          table_name: tableName,
          key_schema: keySchema,
          attribute_definitions: attributeDefinitions,
          billing_mode: 'PAY_PER_REQUEST'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to create table: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Table created:', result);

      // Notify parent and close
      if (onTableCreated) {
        onTableCreated(tableName);
      }

      // Reset form
      setTableName('');
      setPartitionKey('');
      setPartitionKeyType('S');
      setHasSortKey(false);
      setSortKey('');
      setSortKeyType('S');
      onClose();
    } catch (err) {
      console.error('Error creating table:', err);
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setTableName('');
      setPartitionKey('');
      setPartitionKeyType('S');
      setHasSortKey(false);
      setSortKey('');
      setSortKeyType('S');
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content create-table-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create New Table</h3>
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
            <label htmlFor="tableName">Table Name</label>
            <input
              id="tableName"
              type="text"
              className="table-input"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="users"
              required
              disabled={isCreating}
              autoFocus
            />
          </div>

          <div className="form-section">
            <h4>Partition Key (Required)</h4>
            <div className="key-row">
              <div className="form-group flex-1">
                <label htmlFor="partitionKey">Attribute Name</label>
                <input
                  id="partitionKey"
                  type="text"
                  className="table-input"
                  value={partitionKey}
                  onChange={(e) => setPartitionKey(e.target.value)}
                  placeholder="id"
                  required
                  disabled={isCreating}
                />
              </div>
              <div className="form-group">
                <label htmlFor="partitionKeyType">Type</label>
                <select
                  id="partitionKeyType"
                  className="type-select"
                  value={partitionKeyType}
                  onChange={(e) => setPartitionKeyType(e.target.value)}
                  disabled={isCreating}
                >
                  <option value="S">String</option>
                  <option value="N">Number</option>
                  <option value="B">Binary</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="section-header">
              <h4>Sort Key (Optional)</h4>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={hasSortKey}
                  onChange={(e) => setHasSortKey(e.target.checked)}
                  disabled={isCreating}
                />
                <span>Enable Sort Key</span>
              </label>
            </div>

            {hasSortKey && (
              <div className="key-row">
                <div className="form-group flex-1">
                  <label htmlFor="sortKey">Attribute Name</label>
                  <input
                    id="sortKey"
                    type="text"
                    className="table-input"
                    value={sortKey}
                    onChange={(e) => setSortKey(e.target.value)}
                    placeholder="timestamp"
                    required={hasSortKey}
                    disabled={isCreating}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="sortKeyType">Type</label>
                  <select
                    id="sortKeyType"
                    className="type-select"
                    value={sortKeyType}
                    onChange={(e) => setSortKeyType(e.target.value)}
                    disabled={isCreating}
                  >
                    <option value="S">String</option>
                    <option value="N">Number</option>
                    <option value="B">Binary</option>
                  </select>
                </div>
              </div>
            )}
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
              disabled={isCreating || !tableName.trim() || !partitionKey.trim()}
            >
              {isCreating ? 'Creating...' : 'Create Table'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
