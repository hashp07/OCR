import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import '../OCR/BillScanner.css';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  preview?: string;
  file?: File;
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  ocrResult?: any;
}

interface FileUploadProps {
  files: UploadedFile[];
  setFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
  processingFile: UploadedFile | null;
  countdown: number;
  processFileWithAPI: (file: UploadedFile) => void;
  COUNTDOWN_SECS: number;
}

export function FileUpload({ files, setFiles, processingFile, countdown, processFileWithAPI, COUNTDOWN_SECS }: FileUploadProps) {
  const { toast } = useToast();
  const [isDragOver, setIsDragOver] = useState(false);
  const CIRC = 326.73; // 2π × 52



  const handleFileSelect = useCallback((selectedFiles: FileList) => {
    const newFiles: UploadedFile[] = Array.from(selectedFiles).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      file: file,
      status: 'idle' as const,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      progress: 0
    }));

    if (newFiles.length > 0) {
      const file = newFiles[0];
      setFiles([file]);
      // The user must click "Analyze Bill" to process
    }
  }, []);

  const startAnalyze = () => {
    if (files.length > 0 && files[0].file) {
      processFileWithAPI(files[0]);
    }
  };



  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      const validFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      if (validFiles.length > 0) {
        // Create a new FileList-like object
        const dt = new DataTransfer();
        validFiles.forEach(f => dt.items.add(f));
        handleFileSelect(dt.files);
      } else {
        toast({
          title: "Invalid File",
          description: "Please upload an image file (PNG, JPG, WEBP)",
          variant: "destructive"
        });
      }
    }
  }, [handleFileSelect, toast]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  // Compute countdown svg properties
  const pct = countdown / COUNTDOWN_SECS;
  const strokeDashoffset = CIRC * pct;
  let strokeColor = 'var(--accent2)';
  if (pct > .5) {
    strokeColor = 'var(--accent)';
  } else if (pct > .25) {
    strokeColor = 'var(--warn)';
  }

  if (processingFile?.status === 'processing') {
    return (
      <div className="bill-scanner-container">
        <div className="processing-panel visible">
          <div className="proc-header">
            <div className="proc-title">
              <div className="proc-spinner"></div>
              Processing your document…
            </div>
            <div className="badge-success" style={{background:'rgba(255,184,79,.1)',color:'var(--warn)',borderColor:'rgba(255,184,79,.25)'}}>
              AI Running
            </div>
          </div>

          <div className="countdown-box">
            <div className="countdown-ring">
              <svg viewBox="0 0 120 120" width="120" height="120">
                <circle className="ring-track" cx="60" cy="60" r="52"/>
                <circle className="ring-fill" cx="60" cy="60" r="52" style={{
                  strokeDashoffset,
                  stroke: strokeColor
                }}/>
              </svg>
              <div className="countdown-num">
                <span className="countdown-secs">{countdown}</span>
                <span className="countdown-label">seconds</span>
              </div>
            </div>
            <div className="proc-status">Model is reading your bill — <span>please wait</span></div>
          </div>

          <div className="prog-bar-wrap">
            <div className="prog-bar-fill" style={{ width: `${(1 - pct) * 100}%` }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (processingFile?.status === 'completed') {
    return null;
  }

  return (
    <div className="bill-scanner-container w-full max-w-[860px] mx-auto flex flex-col gap-[28px]">
      <div 
        className={cn("upload-zone", files.length > 0 && files[0].preview ? "has-image" : "", isDragOver ? "dragover" : "")}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.tagName !== 'INPUT') {
            const input = document.getElementById('fileInputHidden') as HTMLInputElement;
            if (input) input.click();
          }
        }}
      >
        <span className="upload-icon">📄</span>
        <div className="upload-label">Drop your bill image here</div>
        <div className="upload-hint">or click to browse — PNG, JPG, WEBP supported</div>
        <input 
          type="file" 
          id="fileInputHidden" 
          accept="image/*" 
          className="hidden" 
          onChange={(e) => {
            if (e.target.files) {
              handleFileSelect(e.target.files);
            }
          }} 
        />
        
        <div className={cn("preview-wrap", files.length > 0 && files[0].preview ? "visible" : "")}>
          {files.length > 0 && files[0].preview && (
            <>
              <img className="preview-img" src={files[0].preview} alt="Preview" />
              <span className="file-name">{files[0].name}</span>
            </>
          )}
        </div>
      </div>

      <button 
        className="btn-analyze" 
        disabled={files.length === 0} 
        onClick={startAnalyze}
      >
        <span>🔍</span> Analyze Bill
      </button>

      {processingFile?.status === 'error' && (
        <div className="error-box visible" style={{display:'block', background:'rgba(255,111,145,.08)', border:'1px solid rgba(255,111,145,.25)', borderRadius:'14px', padding:'20px 24px', fontFamily:'var(--mono)', fontSize:'.82rem', color:'var(--accent2)', animation:'fadeUp .3s ease'}}>
          ⚠ Failed to process image. Please try again.
        </div>
      )}
    </div>
  );
}