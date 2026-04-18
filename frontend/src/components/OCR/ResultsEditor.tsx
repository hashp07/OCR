import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import './BillScanner.css';

export interface OCRSavePayload {
  fileName: string;
  rawJson: unknown;
}

interface ResultsEditorProps {
  ocrResult: any;
  fileName: string;
  previewUrl?: string;
  onSave: (payload: OCRSavePayload) => void | Promise<void>;
  isSaving?: boolean;
  onNewScan?: () => void;
}

export function ResultsEditor({ ocrResult, fileName, previewUrl, onSave, isSaving, onNewScan }: ResultsEditorProps) {
  const { toast } = useToast();
  const [jsonContent, setJsonContent] = useState(JSON.stringify(ocrResult, null, 2));
  const [isValidJson, setIsValidJson] = useState(true);
  const [parsedJson, setParsedJson] = useState(ocrResult);

  useEffect(() => {
    setJsonContent(JSON.stringify(ocrResult, null, 2));
    setParsedJson(ocrResult);
    setIsValidJson(true);
  }, [ocrResult]);

  const handleJsonChange = (value: string) => {
    setJsonContent(value);
    try {
      const parsed = JSON.parse(value);
      setParsedJson(parsed);
      setIsValidJson(true);
    } catch {
      setIsValidJson(false);
    }
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(jsonContent);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = jsonContent;
        textArea.style.position = "absolute";
        textArea.style.left = "-999999px";
        document.body.prepend(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
        } catch (error) {
          console.error(error);
        } finally {
          textArea.remove();
        }
      }
      toast({
        title: "Copied to clipboard",
        description: "JSON content copied successfully",
      });
    } catch (err) {
      console.error('Failed to copy', err);
      toast({
        title: "Copy Failed",
        description: "Could not copy JSON content automatically.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isValidJson || isSaving) return;
    await Promise.resolve(onSave({ fileName, rawJson: parsedJson }));
  };

  const handleNewScanClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setJsonContent('');
    setIsValidJson(true);
    setParsedJson({});
    if (onNewScan) onNewScan();
  };

  return (
    <div className="bill-scanner-container w-full max-w-[1200px] mx-auto">
      <div className="result-panel visible" id="resultPanel">
        <div className="result-header">
          <div className="result-title">
            ✅ Extraction Complete
            <span className="badge-success">SUCCESS</span>
          </div>
          <div className="result-actions">
            <button className="btn-sm-action btn-copy" onClick={handleCopy}>📋 Copy JSON</button>
            <button
              className="btn-sm-action btn-save"
              type="button"
              onClick={handleSave}
              disabled={!isValidJson || !!isSaving}
            >
              {isSaving ? '⏳ Saving…' : '💾 Save JSON'}
            </button>
            <button className="btn-sm-action btn-reset" onClick={handleNewScanClick}>↩ New Scan</button>
          </div>
        </div>

        <div className="result-split-view">
          {previewUrl && (
            <div className="result-image-wrap">
              <img src={previewUrl} alt="Original Invoice" />
            </div>
          )}
          <div className="json-editor-wrap">
            <div className="json-toolbar">
              <div className="json-dots">
                <span></span><span></span><span></span>
              </div>
              <span>{fileName || 'result.json'} — editable</span>
              <span style={{color: isValidJson ? 'var(--success)' : 'var(--accent2)'}}>
                {isValidJson ? '✓ valid JSON' : '✗ invalid JSON'}
              </span>
            </div>
            <textarea 
              className="json-textarea" 
              spellCheck="false"
              value={jsonContent}
              onChange={(e) => handleJsonChange(e.target.value)}
            ></textarea>
            <div className={`json-error ${!isValidJson ? 'visible' : ''}`}>
              ⚠ Invalid JSON — fix before saving
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}