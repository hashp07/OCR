import React, { useState } from 'react';
import ReactJson from '@microlink/react-json-view'

const ResultsEditor = ({ processedData, onSave }: { processedData: any; onSave: (data: any) => void }) => {
  const [editableData, setEditableData] = useState(processedData);

  const handleEdit = (edit: any) => {
    setEditableData(edit.updated_src);
  };

  const handleSave = () => {
    onSave(editableData);
  };

  return (
    <div className="w-full">
      <div className="w-full max-h-[55vh] overflow-auto rounded-md border bg-background p-2">
        <ReactJson
          src={editableData}
          name={false}
          theme="monokai"
          displayDataTypes={false}
          displayObjectSize={false}
          enableClipboard={true}
          collapsed={false}
          indentWidth={2}
          style={{ fontSize: '14px', lineHeight: '1.35' }}
          onEdit={handleEdit}
          onAdd={handleEdit}
          onDelete={handleEdit}
        />
      </div>

      <div className="mt-3 flex justify-end">
        <button
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
          onClick={handleSave}
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default ResultsEditor;