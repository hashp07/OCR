import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Sidebar } from '@/components/Layout/Sidebar';
import { Dashboard } from '@/components/Dashboard/Dashboard';
import { FileUpload } from '@/components/Upload/FileUpload';
import { ResultsEditor } from '@/components/OCR/ResultsEditor';
import { CustomerManagement } from '@/components/Customers/CustomerManagement';
import { Card } from '@/components/ui/card';
import { Search, Settings, FileText } from 'lucide-react';

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

function deriveExtractedText(rawJson: unknown): string {
  if (rawJson && typeof rawJson === 'object' && !Array.isArray(rawJson)) {
    const o = rawJson as Record<string, unknown>;
    for (const key of ['extracted_text', 'extractedText', 'text', 'raw_text', 'content']) {
      const v = o[key];
      if (typeof v === 'string' && v.trim()) return v;
    }
  }
  try {
    return typeof rawJson === 'string' ? rawJson : JSON.stringify(rawJson);
  } catch {
    return '';
  }
}

const Index = () => {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [processedFiles, setProcessedFiles] = useState<UploadedFile[]>([]);
  
  // Lifted Upload State
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [processingFile, setProcessingFile] = useState<UploadedFile | null>(null);
  
  // Custom Timer State
  const COUNTDOWN_SECS = 300;
  const [countdown, setCountdown] = useState(COUNTDOWN_SECS);
  const [ocrSaveLoading, setOcrSaveLoading] = useState(false);

  useEffect(() => {
    let countdownInterval: NodeJS.Timeout;
    if (processingFile?.status === 'processing') {
      countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 0) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (processingFile?.status === 'completed' || processingFile?.status === 'error') {
      setCountdown(COUNTDOWN_SECS); // reset
    }
    return () => clearInterval(countdownInterval);
  }, [processingFile?.status]);

  const processFileWithAPI = async (file: UploadedFile) => {
    setProcessingFile({
      ...file,
      status: 'processing',
      progress: 10
    });
    setCountdown(COUNTDOWN_SECS);

    try {
      const formData = new FormData();
      formData.append('image', file.file!, file.name);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000);

      const response = await fetch('https://jyotiradityachavan-document-ai-qwen-vl-2.hf.space/bill', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`API error ${response.status}: ${errorText}`);
      }

      const result = await response.json();

      const newProcessedFile: UploadedFile = {
        ...file,
        status: 'completed',
        progress: 100,
        ocrResult: result
      };

      setProcessingFile(newProcessedFile);
      setFiles([newProcessedFile]);
      setProcessedFiles([newProcessedFile]);

      toast({
        title: "Scan Complete",
        description: `Successfully processed ${file.name}`,
      });
    } catch (error: any) {
      console.error('OCR processing failed:', error);
      let errorMessage = `Failed to process ${file.name}. Please try again.`;
      
      if (error.name === 'AbortError' || error.message?.includes('timeout')) {
        errorMessage = 'The server took too long to respond (exceeded 5 minutes). The processing might still be running on the backend.';
      } else if (error.message?.includes('does not support image input') || error.message?.includes('Cannot read image')) {
        errorMessage = 'This model does not support image input. Please try a different image or use a supported format.';
      }

      setProcessingFile(prev => prev ? { ...prev, status: 'error' } : null);

      toast({
        title: "Processing Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    setProcessedFiles([]);
    setFiles([]);
    setProcessingFile(null);
    setCountdown(COUNTDOWN_SECS);
    setCurrentPage('upload');
  };

  const handleOCRSave = async (payload: { fileName: string; rawJson: unknown }) => {
    setOcrSaveLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const extractedText = deriveExtractedText(payload.rawJson);
      const response = await fetch(`${apiUrl}/api/ocr/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          fileName: payload.fileName,
          extractedText,
          rawJson: payload.rawJson,
        }),
      });

      const data = await response.json().catch(
        () => ({} as { message?: string; error?: string; errors?: Record<string, unknown> })
      );

      if (!response.ok) {
        let msg =
          typeof data.message === 'string'
            ? data.message
            : typeof data.error === 'string'
              ? data.error
              : 'Failed to save to database';
        if (data.errors && typeof data.errors === 'object') {
          msg = `${msg}: ${JSON.stringify(data.errors)}`;
        }
        throw new Error(msg);
      }

      toast({
        title: "Saved Successfully",
        description: "OCR result saved to MongoDB",
      });
    } catch (error: unknown) {
      console.error('Save failed:', error);
      const description =
        error instanceof Error ? error.message : 'Could not save to database. Please try again.';
      toast({
        title: "Save Failed",
        description,
        variant: "destructive",
      });
    } finally {
      setOcrSaveLoading(false);
    }
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onUploadClick={() => setCurrentPage('upload')} />;

      case 'upload':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Upload & OCR</h1>
              <p className="text-muted-foreground">
                Upload your bills and invoices for automated OCR processing.
              </p>
            </div>
            <FileUpload 
              files={files}
              setFiles={setFiles}
              processingFile={processingFile}
              countdown={countdown}
              processFileWithAPI={processFileWithAPI}
              COUNTDOWN_SECS={COUNTDOWN_SECS}
            />

            {/* Show OCR Results */}
            {processedFiles.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Processed Results</h2>
                {processedFiles.map(file => (
                  file.ocrResult && (
                    <ResultsEditor
                      key={file.id}
                      ocrResult={file.ocrResult}
                      fileName={file.name}
                      previewUrl={file.preview}
                      onSave={handleOCRSave}
                      isSaving={ocrSaveLoading}
                      onNewScan={handleReset}
                    />
                  )
                ))}
              </div>
            )}
          </div>
        );

      case 'customers':
        return <CustomerManagement />;

      case 'invoices':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Invoice Management</h1>
              <p className="text-muted-foreground">
                View and manage all processed invoices.
              </p>
            </div>
            <Card className="p-12 text-center">
              <div className="w-16 h-16 gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Invoice Management</h3>
              <p className="text-muted-foreground">
                This feature requires backend integration. Connect to Supabase to enable invoice storage and management.
              </p>
            </Card>
          </div>
        );

      case 'search':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Search & Analytics</h1>
              <p className="text-muted-foreground">
                Search through invoices and view analytics.
              </p>
            </div>
            <Card className="p-12 text-center">
              <div className="w-16 h-16 gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                <Search className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Advanced Search</h3>
              <p className="text-muted-foreground">
                This feature requires backend integration. Connect to Supabase to enable search functionality.
              </p>
            </Card>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground">
                Configure your OCR processing preferences.
              </p>
            </div>
            <Card className="p-12 text-center">
              <div className="w-16 h-16 gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Application Settings</h3>
              <p className="text-muted-foreground">
                Configure OCR settings, user preferences, and system configuration.
              </p>
            </Card>
          </div>
        );

      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {renderCurrentPage()}
        </div>
      </main>
    </div>
  );
};

export default Index;