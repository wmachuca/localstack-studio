import { useState, useEffect } from 'react';
import { useApp } from '../../../../context/AppContext';
import { usePoll } from '../../../../hooks/usePoll';
import { CreateTableModal } from '../CreateTableModal/CreateTableModal';
import './TableList.css';

/**
 * Component to display list of available DynamoDB tables
 */
export const TableList = ({ onSelectTable, selectedTable }) => {
  const { backendUrl } = useApp();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deletingTable, setDeletingTable] = useState(null);

  const fetchTables = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${backendUrl}/dynamodb/tables`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setTables(data.tables || []);
    } catch (err) {
      console.error('Error fetching tables:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, [backendUrl]);

  // Auto-refresh every 10 seconds
  usePoll(fetchTables, 10000);

  const handleDeleteTable = async (tableName, e) => {
    e.stopPropagation();

    if (!window.confirm(`Are you sure you want to delete table "${tableName}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingTable(tableName);

    try {
      const response = await fetch(`${backendUrl}/dynamodb/tables/${tableName}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Failed to delete table: ${response.statusText}`);
      }

      console.log('Table deleted successfully');

      // Refresh table list
      await fetchTables();

      // If deleted table was selected, clear selection
      if (selectedTable === tableName) {
        onSelectTable(null);
      }
    } catch (err) {
      console.error('Error deleting table:', err);
      alert(`Error deleting table: ${err.message}`);
    } finally {
      setDeletingTable(null);
    }
  };

  const handleTableCreated = () => {
    fetchTables();
  };

  const formatNumber = (num) => {
    if (num === 0) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(2)} GB`;
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(2)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${bytes} B`;
  };

  if (loading && tables.length === 0) {
    return (
      <div className="table-list">
        <div className="table-list-header">
          <h2>DynamoDB Tables</h2>
        </div>
        <div className="loading">Loading tables...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="table-list">
        <div className="table-list-header">
          <h2>DynamoDB Tables</h2>
        </div>
        <div className="error">
          <p>Error loading tables: {error}</p>
          <button onClick={fetchTables}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="table-list">
      <div className="table-list-header">
        <h2>DynamoDB Tables</h2>
        <div className="header-actions">
          <button className="create-btn" onClick={() => setIsCreateModalOpen(true)} title="Create Table">
            +
          </button>
          <button className="refresh-btn" onClick={fetchTables} title="Refresh">
            ↻
          </button>
        </div>
      </div>

      {tables.length === 0 ? (
        <div className="empty-state">
          <p>No tables found</p>
          <small>Create a table to get started</small>
          <button className="create-first-btn" onClick={() => setIsCreateModalOpen(true)}>
            + Create Table
          </button>
        </div>
      ) : (
        <ul className="table-items">
          {tables.map((table) => (
            <li
              key={table.name}
              className={`table-item ${selectedTable === table.name ? 'active' : ''}`}
            >
              <div className="table-content" onClick={() => onSelectTable(table.name)}>
                <div className="table-name">{table.name}</div>
                <div className="table-meta">
                  <span className="table-stat" title="Item count">
                    📊 {formatNumber(table.itemCount)}
                  </span>
                  <span className="table-stat" title="Size">
                    💾 {formatBytes(table.sizeBytes)}
                  </span>
                </div>
              </div>
              <button
                className="delete-table-btn"
                onClick={(e) => handleDeleteTable(table.name, e)}
                disabled={deletingTable === table.name}
                title="Delete table"
              >
                {deletingTable === table.name ? '⏳' : '🗑️'}
              </button>
            </li>
          ))}
        </ul>
      )}

      <CreateTableModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onTableCreated={handleTableCreated}
      />
    </div>
  );
};
