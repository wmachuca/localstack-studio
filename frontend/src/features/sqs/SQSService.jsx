import { useState } from 'react';
import { QueueList } from './components/QueueList';
import { QueueViewer } from './components/QueueViewer';
import './SQSService.css';

/**
 * SQS Service component - manages the entire SQS viewing experience
 * Includes queue list and queue viewer
 */
export const SQSService = () => {
  const [selectedQueue, setSelectedQueue] = useState(null);

  return (
    <div className="sqs-service">
      <aside className="sqs-sidebar">
        <QueueList
          onSelectQueue={setSelectedQueue}
          selectedQueue={selectedQueue}
        />
      </aside>

      <main className="sqs-main">
        <QueueViewer
          queueName={selectedQueue}
        />
      </main>
    </div>
  );
};
