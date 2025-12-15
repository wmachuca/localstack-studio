import { useState, useEffect } from 'react';
import './QueryBuilder.css';

/**
 * Component to build DynamoDB query expressions
 */
export const QueryBuilder = ({ tableInfo, onQuery, onCancel }) => {
  const [selectedIndex, setSelectedIndex] = useState('PRIMARY');
  const [partitionKeyValue, setPartitionKeyValue] = useState('');
  const [hasSortKey, setHasSortKey] = useState(false);
  const [sortKeyOperator, setSortKeyOperator] = useState('=');
  const [sortKeyValue, setSortKeyValue] = useState('');
  const [sortKeyValue2, setSortKeyValue2] = useState(''); // For BETWEEN operator

  // Get available indexes (Primary + GSIs)
  const getIndexes = () => {
    const indexes = [
      { name: 'PRIMARY', label: 'Primary Index', keySchema: tableInfo.keySchema }
    ];

    if (tableInfo.globalSecondaryIndexes) {
      tableInfo.globalSecondaryIndexes.forEach(gsi => {
        indexes.push({
          name: gsi.indexName,
          label: `GSI: ${gsi.indexName}`,
          keySchema: gsi.keySchema
        });
      });
    }

    return indexes;
  };

  // Get key schema for selected index
  const getKeySchema = () => {
    const indexes = getIndexes();
    const index = indexes.find(idx => idx.name === selectedIndex);
    return index ? index.keySchema : [];
  };

  // Get partition key attribute name
  const getPartitionKey = () => {
    const keySchema = getKeySchema();
    const partitionKey = keySchema.find(k => k.keyType === 'HASH');
    return partitionKey ? partitionKey.attributeName : null;
  };

  // Get sort key attribute name
  const getSortKey = () => {
    const keySchema = getKeySchema();
    const sortKey = keySchema.find(k => k.keyType === 'RANGE');
    return sortKey ? sortKey.attributeName : null;
  };

  // Get attribute type for a given attribute name
  const getAttributeType = (attributeName) => {
    const attr = tableInfo.attributeDefinitions?.find(a => a.attributeName === attributeName);
    return attr ? attr.attributeType : 'S';
  };

  // Build expression attribute values
  const buildExpressionAttributeValues = () => {
    const values = {};
    const partitionKeyAttr = getPartitionKey();
    const sortKeyAttr = getSortKey();
    const partitionKeyType = getAttributeType(partitionKeyAttr);

    // Partition key value
    values[':pk'] = formatValue(partitionKeyValue, partitionKeyType);

    // Sort key value(s)
    if (hasSortKey && sortKeyValue) {
      const sortKeyType = getAttributeType(sortKeyAttr);

      if (sortKeyOperator === 'between') {
        values[':sk1'] = formatValue(sortKeyValue, sortKeyType);
        values[':sk2'] = formatValue(sortKeyValue2, sortKeyType);
      } else {
        values[':sk'] = formatValue(sortKeyValue, sortKeyType);
      }
    }

    return values;
  };

  // Format value based on DynamoDB type
  const formatValue = (value, type) => {
    if (type === 'N') {
      return { N: String(value) };
    } else if (type === 'B') {
      return { B: value };
    } else {
      return { S: String(value) };
    }
  };

  // Build key condition expression
  const buildKeyConditionExpression = () => {
    const partitionKeyAttr = getPartitionKey();
    const sortKeyAttr = getSortKey();

    let expression = `${partitionKeyAttr} = :pk`;

    if (hasSortKey && sortKeyValue && sortKeyAttr) {
      switch (sortKeyOperator) {
        case '=':
          expression += ` AND ${sortKeyAttr} = :sk`;
          break;
        case '<':
          expression += ` AND ${sortKeyAttr} < :sk`;
          break;
        case '<=':
          expression += ` AND ${sortKeyAttr} <= :sk`;
          break;
        case '>':
          expression += ` AND ${sortKeyAttr} > :sk`;
          break;
        case '>=':
          expression += ` AND ${sortKeyAttr} >= :sk`;
          break;
        case 'begins_with':
          expression += ` AND begins_with(${sortKeyAttr}, :sk)`;
          break;
        case 'between':
          expression += ` AND ${sortKeyAttr} BETWEEN :sk1 AND :sk2`;
          break;
        default:
          break;
      }
    }

    return expression;
  };

  // Handle query execution
  const handleQuery = () => {
    if (!partitionKeyValue) {
      alert('Partition key value is required');
      return;
    }

    if (hasSortKey && !sortKeyValue) {
      alert('Sort key value is required when sort key condition is enabled');
      return;
    }

    if (sortKeyOperator === 'between' && (!sortKeyValue || !sortKeyValue2)) {
      alert('Both sort key values are required for BETWEEN operator');
      return;
    }

    const queryParams = {
      keyConditionExpression: buildKeyConditionExpression(),
      expressionAttributeValues: buildExpressionAttributeValues(),
      indexName: selectedIndex === 'PRIMARY' ? undefined : selectedIndex
    };

    onQuery(queryParams);
  };

  // Reset form when index changes
  useEffect(() => {
    setPartitionKeyValue('');
    setHasSortKey(false);
    setSortKeyValue('');
    setSortKeyValue2('');
    setSortKeyOperator('=');
  }, [selectedIndex]);

  const indexes = getIndexes();
  const partitionKeyAttr = getPartitionKey();
  const sortKeyAttr = getSortKey();
  const canQuery = partitionKeyValue.trim() !== '';

  return (
    <div className="query-builder">
      <div className="query-form">
        <div className="query-info">
          <strong>Query</strong> retrieves items using partition key and optional sort key conditions.
          This is more efficient than Scan.
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="index-select">Index</label>
            <select
              id="index-select"
              className="query-select"
              value={selectedIndex}
              onChange={(e) => setSelectedIndex(e.target.value)}
            >
              {indexes.map(idx => (
                <option key={idx.name} value={idx.name}>
                  {idx.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="partition-key-value">
              {partitionKeyAttr} (Partition Key)
            </label>
            <input
              id="partition-key-value"
              type="text"
              className="query-input"
              value={partitionKeyValue}
              onChange={(e) => setPartitionKeyValue(e.target.value)}
              placeholder={`Enter ${partitionKeyAttr} value`}
              required
            />
          </div>
        </div>

        {sortKeyAttr && (
          <>
            {!hasSortKey && (
              <button
                className="add-sort-btn"
                onClick={() => setHasSortKey(true)}
              >
                + Add Sort Key Condition
              </button>
            )}

            {hasSortKey && (
              <div className="form-row">
                <div className="form-field" style={{ maxWidth: '150px' }}>
                  <label htmlFor="sort-key-operator">Operator</label>
                  <select
                    id="sort-key-operator"
                    className="query-select"
                    value={sortKeyOperator}
                    onChange={(e) => setSortKeyOperator(e.target.value)}
                  >
                    <option value="=">=</option>
                    <option value="<">&lt;</option>
                    <option value="<=">&lt;=</option>
                    <option value=">">&gt;</option>
                    <option value=">=">&gt;=</option>
                    <option value="begins_with">begins with</option>
                    <option value="between">between</option>
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="sort-key-value">
                    {sortKeyAttr} (Sort Key)
                  </label>
                  <input
                    id="sort-key-value"
                    type="text"
                    className="query-input"
                    value={sortKeyValue}
                    onChange={(e) => setSortKeyValue(e.target.value)}
                    placeholder={`Enter ${sortKeyAttr} value`}
                  />
                </div>

                {sortKeyOperator === 'between' && (
                  <div className="form-field">
                    <label htmlFor="sort-key-value-2">And</label>
                    <input
                      id="sort-key-value-2"
                      type="text"
                      className="query-input"
                      value={sortKeyValue2}
                      onChange={(e) => setSortKeyValue2(e.target.value)}
                      placeholder="Second value"
                    />
                  </div>
                )}

                <button
                  className="remove-sort-btn"
                  onClick={() => {
                    setHasSortKey(false);
                    setSortKeyValue('');
                    setSortKeyValue2('');
                  }}
                  title="Remove sort key condition"
                >
                  ✕
                </button>
              </div>
            )}
          </>
        )}

        <div className="query-actions">
          <button
            className="query-btn query-btn-secondary"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="query-btn query-btn-primary"
            onClick={handleQuery}
            disabled={!canQuery}
          >
            Run Query
          </button>
        </div>
      </div>
    </div>
  );
};
