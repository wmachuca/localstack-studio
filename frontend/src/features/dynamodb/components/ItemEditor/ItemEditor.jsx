import { useState, useEffect } from 'react';
import { useApp } from '../../../../context/AppContext';
import './ItemEditor.css';

/**
 * Modal component for creating and editing DynamoDB items
 */
export const ItemEditor = ({ isOpen, onClose, tableName, item, tableInfo }) => {
  const { backendUrl } = useApp();
  const [itemData, setItemData] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const isEditMode = !!item;

  // Initialize item data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (item) {
        // Edit mode - load existing item
        setItemData(JSON.stringify(item, null, 2));
      } else {
        // Create mode - generate template with required keys
        const template = {};

        if (tableInfo?.keySchema) {
          tableInfo.keySchema.forEach(keyDef => {
            const attrName = keyDef.attributeName;
            const attrDef = tableInfo.attributeDefinitions?.find(a => a.attributeName === attrName);

            if (attrDef) {
              switch (attrDef.attributeType) {
                case 'S':
                  template[attrName] = '';
                  break;
                case 'N':
                  template[attrName] = 0;
                  break;
                case 'B':
                  template[attrName] = '';
                  break;
                default:
                  template[attrName] = '';
              }
            }
          });
        }

        setItemData(JSON.stringify(template, null, 2));
      }
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, item, tableInfo]);

  const validateItem = (parsedItem) => {
    // Check that all key attributes are present
    if (tableInfo?.keySchema) {
      for (const keyDef of tableInfo.keySchema) {
        const attrName = keyDef.attributeName;
        if (!(attrName in parsedItem)) {
          throw new Error(`Required key attribute "${attrName}" is missing`);
        }

        // Check that value is not empty
        const value = parsedItem[attrName];
        if (value === '' || value === null || value === undefined) {
          throw new Error(`Required key attribute "${attrName}" cannot be empty`);
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSaving(true);

    try {
      // Parse and validate JSON
      let parsedItem;
      try {
        parsedItem = JSON.parse(itemData);
      } catch (err) {
        throw new Error('Invalid JSON format');
      }

      // Validate required keys
      validateItem(parsedItem);

      // Send to backend
      const response = await fetch(`${backendUrl}/dynamodb/tables/${tableName}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ item: parsedItem })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to save item: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Item saved:', result);

      setSuccess(true);

      // Close modal after short delay
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);

    } catch (err) {
      console.error('Error saving item:', err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      setItemData('');
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(itemData);
      setItemData(JSON.stringify(parsed, null, 2));
      setError(null);
    } catch (err) {
      setError('Invalid JSON - cannot format');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content item-editor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEditMode ? 'Edit Item' : 'Add Item'} - {tableName}</h3>
          <button className="modal-close" onClick={handleClose} disabled={isSaving}>
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
              ✓ Item {isEditMode ? 'updated' : 'created'} successfully!
            </div>
          )}

          {tableInfo?.keySchema && (
            <div className="key-info">
              <strong>Required keys:</strong>{' '}
              {tableInfo.keySchema.map(k => k.attributeName).join(', ')}
            </div>
          )}

          <div className="form-group">
            <div className="label-row">
              <label htmlFor="itemData">Item Data (JSON)</label>
              <button
                type="button"
                className="format-btn"
                onClick={handleFormat}
                disabled={isSaving}
              >
                Format JSON
              </button>
            </div>
            <textarea
              id="itemData"
              className="item-input"
              value={itemData}
              onChange={(e) => setItemData(e.target.value)}
              placeholder='{"id": "123", "name": "Example"}'
              rows={15}
              required
              disabled={isSaving}
              spellCheck={false}
            />
            <small className="form-hint">
              Enter item as JSON object. All key attributes are required.
            </small>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSaving || !itemData.trim()}
            >
              {isSaving ? 'Saving...' : (isEditMode ? 'Update Item' : 'Create Item')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
