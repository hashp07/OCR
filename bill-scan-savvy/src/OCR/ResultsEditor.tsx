import React, { useState } from 'react';
import ReactJson from 'react-json-view';

const ResultsEditor = ({ processedData, onSave }: { processedData: any; onSave: (data: any) => void }) => {
  const [editableData, setEditableData] = useState(processedData);

  const handleEdit = (edit: any) => {
    setEditableData(edit.updated_src);
  };

  const handleSave = () => {
    onSave(editableData);
  };

  return (
    <div>
      <ReactJson src={editableData} onEdit={handleEdit} onAdd={handleEdit} onDelete={handleEdit} />
      <button onClick={handleSave}>Save</button>
    </div>
  );
};

export default ResultsEditor;