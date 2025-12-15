import { useState } from 'react';
import { TableList } from './components/TableList/TableList';
import { ItemViewer } from './components/ItemViewer/ItemViewer';
import { ItemEditor } from './components/ItemEditor/ItemEditor';
import './DynamoDBService.css';

/**
 * Main DynamoDB service container
 * Manages the table selection and item editing state
 */
export const DynamoDBService = () => {
  const [selectedTable, setSelectedTable] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [tableInfo, setTableInfo] = useState(null);

  const handleSelectTable = (tableName) => {
    setSelectedTable(tableName);
  };

  const handleAddItem = () => {
    setCurrentItem(null);
    setIsEditorOpen(true);
  };

  const handleEditItem = (item) => {
    setCurrentItem(item);
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setCurrentItem(null);
  };

  return (
    <div className="dynamodb-service">
      <div className="dynamodb-layout">
        <div className="table-list-panel">
          <TableList
            selectedTable={selectedTable}
            onSelectTable={handleSelectTable}
          />
        </div>

        <div className="item-viewer-panel">
          <ItemViewer
            tableName={selectedTable}
            onAddItem={handleAddItem}
            onEditItem={handleEditItem}
          />
        </div>
      </div>

      <ItemEditor
        isOpen={isEditorOpen}
        onClose={handleCloseEditor}
        tableName={selectedTable}
        item={currentItem}
        tableInfo={tableInfo}
      />
    </div>
  );
};
