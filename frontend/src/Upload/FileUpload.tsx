import React, { useState } from 'react';

const FileUpload = ({ onProcessImage }: { onProcessImage: (file: File) => void }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      onProcessImage(selectedFile);
    }
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={!selectedFile}>
        Upload and Process
      </button>
    </div>
  );
};

export default FileUpload;