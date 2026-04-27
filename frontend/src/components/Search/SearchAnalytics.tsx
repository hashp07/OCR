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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import ResultsEditor from '@/OCR/ResultsEditor';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Search, FileText, FilterX } from 'lucide-react';

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

function normalizeText(v: any) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function formatDateOnly(value: any) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function SearchAnalytics() {
  const [docs, setDocs] = useState<OCRDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [customerFilter, setCustomerFilter] = useState<string>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const [selectedDoc, setSelectedDoc] = useState<OCRDoc | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  const customers = useMemo(() => {
    const set = new Set<string>();
    docs.forEach((d) => {
      const data = getDocData(d);
      const name = data?.account_holder || data?.vendor_name || data?.customer_name || data?.name;
      if (name) set.add(String(name));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [docs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    if (to) to.setHours(23, 59, 59, 999);

    return docs.filter((d) => {
      const data = getDocData(d);
      const customer = String(data?.account_holder || data?.vendor_name || data?.customer_name || data?.name || '');
      const id = String(data?.bill_number || data?.consumer_number || d?._id || '');
      const fileName = String(d?.fileName || '');
      const textBlob = `${customer} ${id} ${fileName} ${normalizeText(data)}`.toLowerCase();

      if (q && !textBlob.includes(q)) return false;
      if (customerFilter !== 'all' && customer !== customerFilter) return false;

      const dtVal = data?.bill_date || data?.date || d?.createdAt || d?.uploadedAt;
      const dt = dtVal ? new Date(dtVal) : null;
      if (dt && !Number.isNaN(dt.getTime())) {
        if (from && dt < from) return false;
        if (to && dt > to) return false;
      } else if (from || to) {
        return false;
      }

      return true;
    });
  }, [docs, query, customerFilter, fromDate, toDate]);

  const analytics = useMemo(() => {
    const totalDocs = filtered.length;
    const customerSet = new Set<string>();
    let totalAmount = 0;
    let latest: Date | null = null;
    const byMonth = new Map<string, number>();

    filtered.forEach((d) => {
      const data = getDocData(d);
      const customer = String(data?.account_holder || data?.vendor_name || data?.customer_name || data?.name || '');
      if (customer) customerSet.add(customer);
      totalAmount += extractAmount(data);

      const dtVal = data?.bill_date || data?.date || d?.createdAt || d?.uploadedAt;
      const dt = dtVal ? new Date(dtVal) : null;
      if (dt && !Number.isNaN(dt.getTime())) {
        if (!latest || dt > latest) latest = dt;
        const k = monthKey(dt);
        byMonth.set(k, (byMonth.get(k) || 0) + 1);
      }
    });

    const monthSeries = Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([k, v]) => ({ month: k, docs: v }));

    return {
      totalDocs,
      uniqueCustomers: customerSet.size,
      totalAmount,
      latestDate: latest ? latest.toLocaleString() : 'N/A',
      monthSeries,
    };
  }, [filtered]);

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

  const selectedData = selectedDoc ? getDocData(selectedDoc) : {};
  const selectedCustomer =
    selectedDoc ? (selectedData?.account_holder || selectedData?.vendor_name || selectedData?.customer_name || selectedData?.name || 'Unknown') : 'Unknown';
  const selectedId = selectedDoc ? (selectedData?.bill_number || selectedData?.consumer_number || String(selectedDoc?._id || '').slice(0, 8)) : '';
  const selectedDate =
    selectedDoc ? (selectedData?.bill_date || selectedData?.date || formatDateOnly(selectedDoc?.createdAt) || 'N/A') : 'N/A';
  const selectedAmount = selectedDoc ? extractAmount(selectedData) : 0;

  return (
    <div className="space-y-6 md:space-y-8 p-3 md:p-0 pb-20">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-bold">Search & Analytics</h1>
        <p className="text-muted-foreground text-sm md:text-base">Search your OCR documents and view basic analytics.</p>
      </div>

      {/* Filters Section - Ultra Responsive */}
      <Card className="p-4 md:p-6">
        <div className="flex flex-col lg:flex-row gap-3 md:gap-4">
          
          {/* Main Search */}
          <div className="relative w-full lg:flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-10 w-full h-11 md:h-10"
              placeholder="Search by customer, id, or file name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full lg:w-auto">
            {/* Customer Dropdown */}
            <Select value={customerFilter} onValueChange={setCustomerFilter}>
              <SelectTrigger className="w-full sm:w-[180px] h-11 md:h-10">
                <SelectValue placeholder="Customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All customers</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Pickers (Stacked on mobile, row on tablet+) */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-2 w-full sm:w-auto">
              <Input 
                type="date" 
                className="w-full sm:w-[140px] h-11 md:h-10" 
                value={fromDate} 
                onChange={(e) => setFromDate(e.target.value)} 
              />
              <Input 
                type="date" 
                className="w-full sm:w-[140px] h-11 md:h-10" 
                value={toDate} 
                onChange={(e) => setToDate(e.target.value)} 
              />
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="w-full sm:w-auto text-center sm:text-left">
            Showing <span className="text-foreground font-bold">{filtered.length}</span> document(s)
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto text-xs h-10 md:h-9"
            onClick={() => {
              setQuery('');
              setCustomerFilter('all');
              setFromDate('');
              setToDate('');
            }}
          >
            <FilterX className="w-4 h-4 mr-2" />
            Reset Filters
          </Button>
        </div>
      </Card>

      {/* Analytics Cards - 2x2 grid on mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="p-4 md:p-5 flex flex-col justify-center">
          <div className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider font-bold">Documents</div>
          <div className="text-xl md:text-3xl font-extrabold mt-1">{analytics.totalDocs}</div>
        </Card>
        <Card className="p-4 md:p-5 flex flex-col justify-center">
          <div className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider font-bold">Customers</div>
          <div className="text-xl md:text-3xl font-extrabold mt-1">{analytics.uniqueCustomers}</div>
        </Card>
        <Card className="p-4 md:p-5 flex flex-col justify-center">
          <div className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider font-bold">Total Amount</div>
          <div className="text-lg md:text-2xl font-extrabold text-green-500 mt-1 truncate">
            ₹{analytics.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </Card>
        <Card className="p-4 md:p-5 flex flex-col justify-center">
          <div className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider font-bold">Latest</div>
          <div className="text-xs md:text-sm font-bold mt-2 truncate">{analytics.latestDate.split(',')[0]}</div>
        </Card>
      </div>

      {/* Chart */}
      <Card className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base md:text-lg font-semibold">Documents by month</h3>
          <Badge variant="secondary" className="text-[10px] md:text-xs">{analytics.monthSeries.length} months</Badge>
        </div>
        <div className="h-48 md:h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.monthSeries}>
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} dy={10} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} dx={-10} width={35} />
              <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px'}} />
              <Bar dataKey="docs" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Results Table */}
      <Card className="p-3 md:p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-4 px-1 md:px-0">
          <h3 className="text-base md:text-lg font-semibold">Results</h3>
          <Badge variant="secondary" className="text-[10px] md:text-xs">{filtered.length}</Badge>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading documents...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No documents match your search.</div>
        ) : (
          <div className="overflow-x-auto w-full">
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap px-2 md:px-4">Customer</TableHead>
                  {/* Hide on mobile to prevent scrolling */}
                  <TableHead className="hidden md:table-cell whitespace-nowrap px-2 md:px-4">Document</TableHead>
                  <TableHead className="hidden sm:table-cell whitespace-nowrap px-2 md:px-4">Date</TableHead>
                  <TableHead className="text-right whitespace-nowrap px-2 md:px-4">Amount</TableHead>
                  <TableHead className="text-right whitespace-nowrap px-2 md:px-4">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 200).map((d) => {
                  const data = getDocData(d);
                  const customer = data?.account_holder || data?.vendor_name || data?.customer_name || data?.name || 'Unknown';
                  const docId = data?.bill_number || data?.consumer_number || String(d?._id || '').slice(0, 8);
                  const date = data?.bill_date || data?.date || formatDateOnly(d?.createdAt) || 'N/A';
                  const amount = extractAmount(data);

                  return (
                    <TableRow key={String(d?._id || docId)}>
                      <TableCell className="font-medium max-w-[100px] sm:max-w-[150px] md:max-w-xs truncate px-2 md:px-4">
                        {String(customer)}
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden md:table-cell max-w-[100px] truncate px-2 md:px-4">
                        {String(docId)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell whitespace-nowrap text-xs md:text-sm px-2 md:px-4">
                        {String(date)}
                      </TableCell>
                      <TableCell className="text-right font-semibold whitespace-nowrap text-xs md:text-sm px-2 md:px-4">
                        ₹{amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </TableCell>
                      <TableCell className="text-right px-2 md:px-4">
                        <Button variant="outline" size="sm" onClick={() => openDoc(d)} className="h-8 px-2 md:px-3">
                          <FileText className="w-3.5 h-3.5 md:mr-2" />
                          <span className="hidden md:inline text-xs">View</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Details / Edit Dialog */}
      <Dialog open={detailsOpen} onOpenChange={(o) => { setDetailsOpen(o); if (!o) { setIsEditing(false); setIsSaving(false); } }}>
        <DialogContent className="w-[95vw] max-w-5xl max-h-[90vh] overflow-y-auto p-4 md:p-6 rounded-2xl md:rounded-lg">
          <DialogHeader className="text-left">
            <DialogTitle>Document Information</DialogTitle>
            <DialogDescription>View and edit extracted fields.</DialogDescription>
          </DialogHeader>

          {selectedDoc && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 overflow-hidden">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1">Customer</p>
                  <p className="font-bold text-sm truncate">{String(selectedCustomer)}</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 overflow-hidden">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1">Doc ID</p>
                  <p className="font-bold text-sm truncate">{String(selectedId)}</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 overflow-hidden">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1">Date</p>
                  <p className="font-bold text-sm truncate">{String(selectedDate)}</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 overflow-hidden">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1">Amount</p>
                  <p className="font-bold text-sm text-green-500 truncate">₹{Number(selectedAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                </div>
              </div>

              <div className="flex items-center justify-end w-full">
                <Button variant="outline" size="sm" className="w-full sm:w-auto h-11 md:h-9" onClick={() => setIsEditing((v) => !v)} disabled={isSaving}>
                  {isEditing ? 'Cancel Edit' : 'Edit Document'}
                </Button>
              </div>

              {isEditing ? (
                <div className="rounded-xl border p-3 md:p-4 bg-muted/20">
                  <ResultsEditor processedData={selectedData} onSave={saveEdits} />
                  {isSaving && <p className="text-xs text-[#8b5cf6] font-bold mt-3 animate-pulse">Saving changes...</p>}
                </div>
              ) : (
                <div className="rounded-xl border p-4 bg-muted/10 overflow-x-auto w-full">
                  <pre className="text-xs md:text-sm whitespace-pre-wrap break-words font-mono text-gray-300">
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

          <DialogFooter className="mt-4">
            <Button variant="outline" className="w-full sm:w-auto h-11 md:h-10" onClick={() => setDetailsOpen(false)}>Close Window</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}