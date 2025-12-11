import { useState } from 'react';
import { QueueList } from './QueueList';
import { QueueViewer } from './QueueViewer';
import './SQSService.css';

/**
 * SQS Service component - manages the entire SQS viewing experience
 * Includes queue list and queue viewer
 */
export const SQSService = ({ backendUrl }) => {
  const [selectedQueue, setSelectedQueue] = useState(null);

  return (
    <div className="sqs-service">
      <aside className="sqs-sidebar">
        <QueueList
          onSelectQueue={setSelectedQueue}
          selectedQueue={selectedQueue}
          backendUrl={backendUrl}
        />
      </aside>

      <main className="sqs-main">
        <QueueViewer
          queueName={selectedQueue}
          backendUrl={backendUrl}
        />
      </main>
    </div>
  );
};
