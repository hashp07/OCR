import React, { useState, useEffect } from "react";
import FileUpload from "../Upload/FileUpload";
import ResultsEditor from "../OCR/ResultsEditor";

const ImageProcessor = () => {
  const [processedData, setProcessedData] = useState(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState(300);

  const processImage = async (file: File) => {
    const formData = new FormData();
    formData.append("image", file);

    console.log("Uploading file:", file.name, file.type, file.size);

    setIsProcessing(true);
    setError(null);

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    try {
      const response = await fetch("https://jyotiradityachavan-document-ai-qwen-vl-2.hf.space/bill", {
        method: "POST",
        body: formData,
      });

      clearInterval(countdownInterval);
      setCountdown(300);
      setIsProcessing(false);

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        setError(`Failed to process image: ${response.status} ${response.statusText}. Details: ${errorText}`);
        return;
      }

      const data = await response.json();
      console.log("Processed data received:", data);
      setProcessedData(data);
      setError(null); // Clear any previous errors
    } catch (error) {
      clearInterval(countdownInterval);
      setCountdown(300);
      setIsProcessing(false);
      console.error("Unexpected Error:", error);
      setError("An unexpected error occurred while processing the image. Check the console for details.");
    }
  };

  const saveData = (data: any) => {
    console.log("Saved data:", data);
    // Implement save functionality (e.g., send to server or save locally)
  };

  return (
    <div>
      {error && <div style={{ color: "red" }}>{error}</div>}
      {isProcessing && (
        <div style={{ color: "blue" }}>
          Processing... Please wait. Time remaining: {countdown} seconds.
        </div>
      )}
      {!processedData && !isProcessing ? (
        <FileUpload onProcessImage={processImage} />
      ) : null}
      {processedData && !isProcessing ? (
        <ResultsEditor processedData={processedData} onSave={saveData} />
      ) : null}
    </div>
  );
};

export default ImageProcessor;