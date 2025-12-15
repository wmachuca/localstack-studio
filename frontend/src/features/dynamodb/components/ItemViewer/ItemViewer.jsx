import { useState, useEffect } from 'react';
import { useApp } from '../../../../context/AppContext';
import { QueryBuilder } from '../QueryBuilder/QueryBuilder';
import './ItemViewer.css';

/**
 * Component to display items from a specific DynamoDB table
 */
export const ItemViewer = ({ tableName, onAddItem, onEditItem }) => {
  const { backendUrl } = useApp();
  const [mode, setMode] = useState('scan'); // 'scan' or 'query'
  const [items, setItems] = useState([]);
  const [tableInfo, setTableInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedItem, setExpandedItem] = useState(null);
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [scanLimit, setScanLimit] = useState(50);
  const [showQueryBuilder, setShowQueryBuilder] = useState(false);
  const [currentQuery, setCurrentQuery] = useState(null);

  // Fetch table info (schema, keys, etc.)
  const fetchTableInfo = async () => {
    try {
      const response = await fetch(`${backendUrl}/dynamodb/tables/${tableName}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch table info: ${response.statusText}`);
      }
      const data = await response.json();
      setTableInfo(data);
    } catch (err) {
      console.error('Error fetching table info:', err);
      setError(err.message);
    }
  };

  // Fetch items using scan
  const fetchItems = async (startKey = null) => {
    try {
      setIsLoading(true);
      setError(null);

      const body = {
        limit: scanLimit,
        exclusive_start_key: startKey
      };

      const response = await fetch(`${backendUrl}/dynamodb/tables/${tableName}/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`Failed to scan table: ${response.statusText}`);
      }

      const data = await response.json();

      if (startKey) {
        // Append to existing items (pagination)
        setItems(prev => [...prev, ...(data.items || [])]);
      } else {
        // Replace items (new scan)
        setItems(data.items || []);
      }

      setLastEvaluatedKey(data.lastEvaluatedKey || null);
      setHasMore(!!data.lastEvaluatedKey);
    } catch (err) {
      console.error('Error scanning table:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch items using query
  const fetchQuery = async (queryParams, startKey = null) => {
    try {
      setIsLoading(true);
      setError(null);

      const body = {
        key_condition_expression: queryParams.keyConditionExpression,
        expression_attribute_values: queryParams.expressionAttributeValues,
        index_name: queryParams.indexName,
        limit: scanLimit,
        exclusive_start_key: startKey
      };

      const response = await fetch(`${backendUrl}/dynamodb/tables/${tableName}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to query table: ${response.statusText}`);
      }

      const data = await response.json();

      if (startKey) {
        // Append to existing items (pagination)
        setItems(prev => [...prev, ...(data.items || [])]);
      } else {
        // Replace items (new query)
        setItems(data.items || []);
      }

      setLastEvaluatedKey(data.lastEvaluatedKey || null);
      setHasMore(!!data.lastEvaluatedKey);
    } catch (err) {
      console.error('Error querying table:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle query execution
  const handleQuery = (queryParams) => {
    setCurrentQuery(queryParams);
    setShowQueryBuilder(false);
    setLastEvaluatedKey(null);
    setHasMore(false);
    fetchQuery(queryParams);
  };

  // Handle query cancel
  const handleCancelQuery = () => {
    setShowQueryBuilder(false);
  };

  // Load more items (pagination)
  const loadMore = () => {
    if (hasMore && lastEvaluatedKey) {
      if (mode === 'query' && currentQuery) {
        fetchQuery(currentQuery, lastEvaluatedKey);
      } else {
        fetchItems(lastEvaluatedKey);
      }
    }
  };

  // Refresh items
  const handleRefresh = () => {
    setLastEvaluatedKey(null);
    setHasMore(false);
    if (mode === 'query' && currentQuery) {
      fetchQuery(currentQuery);
    } else {
      fetchItems();
    }
  };

  // Handle mode change
  const handleModeChange = (newMode) => {
    setMode(newMode);
    setItems([]);
    setLastEvaluatedKey(null);
    setHasMore(false);
    setError(null);

    if (newMode === 'query') {
      setShowQueryBuilder(true);
      setCurrentQuery(null);
    } else {
      setShowQueryBuilder(false);
      setCurrentQuery(null);
      fetchItems();
    }
  };

  // Initial load when table changes
  useEffect(() => {
    if (tableName) {
      setItems([]);
      setLastEvaluatedKey(null);
      setHasMore(false);
      setExpandedItem(null);
      fetchTableInfo();
      fetchItems();
    }
  }, [tableName]);

  // Reload when scan limit changes
  useEffect(() => {
    if (tableName) {
      handleRefresh();
    }
  }, [scanLimit]);

  const toggleItemExpand = (itemKey) => {
    setExpandedItem(expandedItem === itemKey ? null : itemKey);
  };

  const formatJSON = (obj) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  const getItemKey = (item, index) => {
    // Try to use primary key, fallback to index
    if (tableInfo?.keySchema) {
      const keyAttrs = tableInfo.keySchema.map(k => k.attributeName);
      const keyValues = keyAttrs.map(attr => item[attr]).filter(v => v !== undefined);
      if (keyValues.length > 0) {
        return JSON.stringify(keyValues);
      }
    }
    return `item-${index}`;
  };

  const handleDeleteItem = async (item) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      // Extract key attributes from item
      const keyAttrs = tableInfo?.keySchema?.map(k => k.attributeName) || [];
      const key = {};
      keyAttrs.forEach(attr => {
        if (item[attr] !== undefined) {
          key[attr] = item[attr];
        }
      });

      const response = await fetch(`${backendUrl}/dynamodb/tables/${tableName}/items`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key })
      });

      if (!response.ok) {
        throw new Error(`Failed to delete item: ${response.statusText}`);
      }

      console.log('Item deleted successfully');

      // Refresh the item list
      handleRefresh();
    } catch (err) {
      console.error('Error deleting item:', err);
      alert(`Error deleting item: ${err.message}`);
    }
  };

  if (!tableName) {
    return (
      <div className="item-viewer">
        <div className="empty-viewer">
          <div className="empty-icon">📊</div>
          <h3>Select a table to view items</h3>
          <p>Choose a DynamoDB table from the list on the left to start viewing items</p>
        </div>
      </div>
    );
  }

  return (
    <div className="item-viewer">
      <div className="viewer-header">
        <div className="header-left">
          <h2>{tableName}</h2>
          {tableInfo && (
            <span className="table-info">
              {tableInfo.itemCount} items · {(tableInfo.sizeBytes / 1024 / 1024).toFixed(2)} MB
            </span>
          )}
        </div>
        <div className="header-right">
          <select
            className="limit-select"
            value={scanLimit}
            onChange={(e) => setScanLimit(Number(e.target.value))}
            title="Items per query/scan"
          >
            <option value={25}>25 items</option>
            <option value={50}>50 items</option>
            <option value={100}>100 items</option>
            <option value={500}>500 items</option>
          </select>
          {mode === 'query' && currentQuery && !showQueryBuilder && (
            <button className="add-btn" onClick={() => setShowQueryBuilder(true)}>
              ↻ New Query
            </button>
          )}
          <button className="add-btn" onClick={onAddItem}>
            + Add Item
          </button>
          <button className="refresh-btn" onClick={handleRefresh} disabled={isLoading || (mode === 'query' && !currentQuery)}>
            {isLoading ? '⏳' : '↻'}
          </button>
        </div>
      </div>

      <div className="mode-tabs">
        <button
          className={`tab ${mode === 'scan' ? 'active' : ''}`}
          onClick={() => handleModeChange('scan')}
          title="Scan: Reads all items in the table sequentially"
        >
          Scan
        </button>
        <button
          className={`tab ${mode === 'query' ? 'active' : ''}`}
          onClick={() => handleModeChange('query')}
          title="Query: Search items using partition key and sort key (more efficient than Scan)"
        >
          Query
        </button>
      </div>

      {mode === 'query' && showQueryBuilder && tableInfo && (
        <QueryBuilder
          tableInfo={tableInfo}
          onQuery={handleQuery}
          onCancel={handleCancelQuery}
        />
      )}

      {error && (
        <div className="error-banner">
          ⚠ {error}
        </div>
      )}

      <div className="items-container">
        {isLoading && items.length === 0 ? (
          <div className="loading-items">
            <div className="spinner"></div>
            <h3>Loading items...</h3>
            <p>{mode === 'query' ? 'Querying' : 'Scanning'} <strong>{tableName}</strong></p>
          </div>
        ) : items.length === 0 && !showQueryBuilder ? (
          <div className="no-items">
            <div className="no-items-icon">📭</div>
            <h3>No items found</h3>
            {mode === 'query' && currentQuery ? (
              <>
                <p>No items match your query criteria</p>
                <button className="add-first-btn" onClick={() => setShowQueryBuilder(true)}>
                  ↻ New Query
                </button>
              </>
            ) : mode === 'query' ? (
              <p>Configure your query to search for items</p>
            ) : (
              <>
                <p>This table appears to be empty</p>
                <button className="add-first-btn" onClick={onAddItem}>
                  + Add First Item
                </button>
              </>
            )}
          </div>
        ) : !showQueryBuilder ? (
          <div className="item-list">
            {items.map((item, index) => {
              const itemKey = getItemKey(item, index);
              const isExpanded = expandedItem === itemKey;

              return (
                <div
                  key={itemKey}
                  className="item-card"
                >
                  <div
                    className="item-header"
                    onClick={() => toggleItemExpand(itemKey)}
                  >
                    <div className="item-preview">
                      {Object.entries(item).slice(0, 3).map(([key, value]) => (
                        <span key={key} className="preview-field">
                          <strong>{key}:</strong> {String(value).substring(0, 50)}
                        </span>
                      ))}
                    </div>
                    <div className="item-header-actions">
                      <button
                        className="edit-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditItem(item);
                        }}
                        title="Edit item"
                      >
                        ✏️
                      </button>
                      <button
                        className="delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(item);
                        }}
                        title="Delete item"
                      >
                        🗑️
                      </button>
                      <button className="expand-btn">
                        {isExpanded ? '−' : '+'}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="item-details">
                      <pre>{formatJSON(item)}</pre>
                    </div>
                  )}
                </div>
              );
            })}

            {hasMore && (
              <div className="load-more-container">
                <button
                  className="load-more-btn"
                  onClick={loadMore}
                  disabled={isLoading}
                >
                  {isLoading ? 'Loading...' : 'Load More'}
                </button>
                <small className="pagination-info">
                  Showing {items.length} items
                </small>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};
