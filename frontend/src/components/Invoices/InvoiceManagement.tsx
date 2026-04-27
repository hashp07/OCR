import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import ResultsEditor from '@/OCR/ResultsEditor';
import { FileText, Search, Trash2 } from 'lucide-react';

type OCRDoc = any;

function getDocData(doc: any) {
  if (doc?.rawJson?.data) return doc.rawJson.data;
  if (doc?.data) return doc.data;

  if (typeof doc?.extractedText === 'string') {
    try {
      const parsed = JSON.parse(doc.extractedText);
      return parsed?.data || {};
    } catch {
      return {};
    }
  }

  return {};
}

function safeNumber(val: any) {
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
  if (typeof val === 'string') {
    const parsed = parseFloat(val.replace(/,/g, '').replace(/[^\d.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function extractAmount(data: any) {
  if (!data) return 0;
  return (
    safeNumber(data.total_amount) ||
    safeNumber(data.total) ||
    safeNumber(data.amount_due) ||
    safeNumber(data.after_jan_20_2025) ||
    safeNumber(data.between_nov_30_2024_and_jan_20_2025) ||
    safeNumber(data.before_nov_30_2024) ||
    safeNumber(data.before_sep_25_2022) ||
    0
  );
}

function formatDateOnly(value: any) {
  if (!value) return 'N/A';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toISOString().slice(0, 10);
}

export function InvoiceManagement() {
  const [docs, setDocs] = useState<OCRDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');

  const [selectedDoc, setSelectedDoc] = useState<OCRDoc | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<OCRDoc | null>(null);

  const apiUrl = useMemo(
    () => import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001',
    []
  );
  const authHeaders = useMemo(() => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${apiUrl}/api/ocr/results`, { headers: authHeaders });
        const payload = await res.json().catch(() => ({}));
        const next = payload?.data || [];
        setDocs(Array.isArray(next) ? next : []);
      } catch (e) {
        console.error(e);
        setDocs([]);
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, [apiUrl, authHeaders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return docs;
    return docs.filter((d) => {
      const data = getDocData(d);
      const customer = String(data?.account_holder || data?.vendor_name || data?.customer_name || data?.name || '');
      const id = String(data?.bill_number || data?.consumer_number || d?._id || '');
      const fileName = String(d?.fileName || '');
      const blob = `${customer} ${id} ${fileName}`.toLowerCase();
      return blob.includes(q);
    });
  }, [docs, query]);

  const openDoc = (doc: OCRDoc) => {
    setSelectedDoc(doc);
    setDetailsOpen(true);
    setIsEditing(false);
    setIsSaving(false);
  };

  const saveEdits = async (updatedFields: any) => {
    if (!selectedDoc?._id) return;
    try {
      setIsSaving(true);
      const res = await fetch(`${apiUrl}/api/ocr/${encodeURIComponent(selectedDoc._id)}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ data: updatedFields }),
      });
      if (!res.ok) throw new Error('Failed to save');
      const payload = await res.json();
      const updatedDoc = payload?.data;

      setDocs((prev) => prev.map((d) => (d._id === updatedDoc?._id ? updatedDoc : d)));
      setSelectedDoc(updatedDoc || selectedDoc);
      setIsEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const requestDelete = (doc: OCRDoc) => {
    setDocToDelete(doc);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!docToDelete?._id) return;
    try {
      setIsSaving(true);
      const res = await fetch(`${apiUrl}/api/ocr/${encodeURIComponent(docToDelete._id)}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (!res.ok) throw new Error('Failed to delete');

      setDocs((prev) => prev.filter((d) => d._id !== docToDelete._id));
      if (selectedDoc?._id === docToDelete._id) {
        setDetailsOpen(false);
        setSelectedDoc(null);
      }
      setDeleteOpen(false);
      setDocToDelete(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const selectedData = selectedDoc ? getDocData(selectedDoc) : {};

  return (
    <div className="space-y-6 md:space-y-8 p-2 md:p-0 pb-20">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-bold">Invoice Management</h1>
        <p className="text-muted-foreground text-sm md:text-base">View and manage all processed invoices.</p>
      </div>

      <Card className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-10 h-11 md:h-10"
              placeholder="Search by customer, invoice number..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Badge variant="secondary" className="h-8 flex justify-center items-center w-fit self-start sm:self-auto">
            {isLoading ? 'Loading...' : `${filtered.length} invoice(s)`}
          </Badge>
        </div>
      </Card>

      <Card className="p-4 md:p-6 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading invoices...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No invoices found.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Customer</TableHead>
                  {/* Hide Invoice and Date on very small screens to avoid horizontal scroll */}
                  <TableHead className="hidden md:table-cell whitespace-nowrap">Invoice</TableHead>
                  <TableHead className="hidden sm:table-cell whitespace-nowrap">Date</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Amount</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((d) => {
                  const data = getDocData(d);
                  const customer = data?.account_holder || data?.vendor_name || data?.customer_name || data?.name || 'Unknown';
                  const docId = data?.bill_number || data?.consumer_number || String(d?._id || '').slice(0, 8);
                  const dt = data?.bill_date || data?.date || d?.createdAt || d?.uploadedAt;
                  const amount = extractAmount(data);
                  return (
                    <TableRow key={String(d?._id || docId)}>
                      <TableCell className="font-medium max-w-[120px] sm:max-w-[200px] truncate">
                        {String(customer)}
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden md:table-cell max-w-[100px] truncate">
                        {String(docId)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell whitespace-nowrap">
                        {formatDateOnly(dt)}
                      </TableCell>
                      <TableCell className="text-right font-semibold whitespace-nowrap">
                        ₹{amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5 md:gap-2">
                          <Button variant="outline" size="sm" onClick={() => openDoc(d)} className="px-2 md:px-3">
                            <FileText className="w-4 h-4 md:mr-2" />
                            <span className="hidden md:inline">View</span>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => requestDelete(d)}
                            className="px-2 md:px-3"
                          >
                            <Trash2 className="w-4 h-4 md:mr-2" />
                            <span className="hidden md:inline">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* View / Edit Dialog */}
      <Dialog
        open={detailsOpen}
        onOpenChange={(o) => {
          setDetailsOpen(o);
          if (!o) {
            setIsEditing(false);
            setIsSaving(false);
          }
        }}
      >
        <DialogContent className="w-[95vw] max-w-5xl max-h-[90vh] overflow-y-auto p-4 md:p-6 rounded-2xl md:rounded-lg">
          <DialogHeader className="text-left">
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>View and edit extracted fields.</DialogDescription>
          </DialogHeader>

          {selectedDoc && (
            <div className="space-y-4 mt-2">
              <div className="flex flex-col sm:flex-row items-center justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing((v) => !v)} 
                  disabled={isSaving}
                  className="w-full sm:w-auto"
                >
                  {isEditing ? 'Cancel Edit' : 'Edit Fields'}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => requestDelete(selectedDoc)}
                  disabled={isSaving}
                  className="w-full sm:w-auto"
                >
                  Delete Invoice
                </Button>
              </div>

              {isEditing ? (
                <div className="rounded-xl border p-3 md:p-4 bg-muted/20">
                  <ResultsEditor processedData={selectedData} onSave={saveEdits} />
                  {isSaving && <p className="text-xs text-muted-foreground mt-2 animate-pulse">Saving changes...</p>}
                </div>
              ) : (
                <div className="rounded-xl border p-4 md:p-6 bg-muted/10 overflow-x-auto">
                  <pre className="text-xs md:text-sm whitespace-pre-wrap break-words font-mono">
                    {(() => {
                      try {
                        return JSON.stringify(selectedData, null, 2);
                      } catch {
                        return String(selectedData);
                      }
                    })()}
                  </pre>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setDetailsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="w-[95vw] max-w-md p-4 md:p-6 rounded-2xl md:rounded-lg">
          <DialogHeader className="text-left">
            <DialogTitle>Delete Invoice</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          
          <div className="text-sm bg-destructive/10 text-destructive p-4 rounded-xl mt-2 border border-destructive/20">
            Are you sure you want to permanently delete this invoice?
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-6">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setDeleteOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button variant="destructive" className="w-full sm:w-auto" onClick={confirmDelete} disabled={isSaving}>
              {isSaving ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}