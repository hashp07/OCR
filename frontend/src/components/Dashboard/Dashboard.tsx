import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { StatsCard } from './StatsCard';
import { 
  FileText, 
  Users, 
  TrendingUp, 
  Clock,
  Upload,
  Eye,
  Download,
  MoreVertical
} from 'lucide-react';

interface DashboardProps {
  onUploadClick?: () => void;
}

export function Dashboard({ onUploadClick }: DashboardProps) {
  const [dbData, setDbData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const getDocData = (doc: any) => {
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
  };

  const formatAmount = (value: any) => {
    if (value === undefined || value === null || value === '') return 'N/A';
    const normalized = String(value).trim();
    if (!normalized) return 'N/A';
    const isCurrency = normalized.match(/^[^\d]/);
    return isCurrency ? normalized : `₹ ${normalized}`;
  };

  const prettifyKey = (key: string) =>
    key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());

  const formatDate = (value: any) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString();
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const apiUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/api/ocr/results`,{
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          }
        });
        if (res.ok) {
          const data = await res.json();
          setDbData(data.data);
          console.log("response data",data.data);
        }

        
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const totalInvoices = dbData.length;
  // Calculate unique customers based on multiple common OCR vendor/account fields
  const activeCustomers = new Set(
    dbData
      .map(d => {
        const data = getDocData(d);
        return data?.account_holder || data?.vendor_name || data?.customer_name;
      })
      .filter(Boolean)
  ).size;

  const activeCustomersCount = activeCustomers > 0 ? activeCustomers : 0;
  const accuracy = totalInvoices > 0 ? "98.4%" : "0%";
  const avgTime = totalInvoices > 0 ? "4.2s" : "0s";

  const dynamicRecentInvoices = dbData.slice(0, 5).map((doc) => {
    const data = getDocData(doc);

    // dynamically try to extract amount and name depending on JSON layout
    const amountStr =
      data?.total ||
      data?.total_amount ||
      data?.after_jan_20_2025 ||
      data?.between_nov_30_2024_and_jan_20_2025 ||
      data?.before_nov_30_2024 ||
      data?.before_sep_25_2022 ||
      '';
    const nameStr = data?.account_holder || data?.vendor_name || data?.customer_name || 'Unknown';
    const dateStr = data?.bill_date || data?.date || new Date(doc.createdAt).toISOString().split('T')[0];
    const idStr = data?.bill_number || doc._id?.substring(0, 8) || `INV-${Math.random().toString(36).slice(2, 7)}`;

    return {
      rowKey: doc?._id || `${idStr}-${doc?.createdAt || ''}`,
      id: idStr.toUpperCase(),
      customer: nameStr,
      amount: formatAmount(amountStr),
      status: 'processed',
      date: dateStr,
      confidence: 98, // Hardcoding visually for model missing confidence features
      source: doc,
      fields: data,
    };
  });

  const selectedSource = selectedInvoice?.source || null;
  const selectedFields = selectedInvoice?.fields || {};
  const selectedMetadata = selectedSource
    ? [
        { label: 'File Name', value: selectedSource.fileName || 'N/A' },
        { label: 'Document ID', value: selectedSource._id || 'N/A' },
        { label: 'Created At', value: formatDate(selectedSource.createdAt) },
        { label: 'Updated At', value: formatDate(selectedSource.updatedAt) },
        { label: 'Uploaded At', value: formatDate(selectedSource.uploadedAt) },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's your OCR processing overview.
          </p>
        </div>
        <Button className="gradient-primary" onClick={onUploadClick}>
          <Upload className="w-4 h-4 mr-2" />
          Upload New Files
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Invoices"
          value={totalInvoices.toString()}
          change={isLoading ? "Loading..." : "Up to date"}
          changeType="positive"
          icon={FileText}
        />
        <StatsCard
          title="Active Customers"
          value={activeCustomersCount.toString()}
          change={isLoading ? "Loading..." : "Real-time sync"}
          changeType="positive"
          icon={Users}
        />
        <StatsCard
          title="Processing Accuracy"
          value="100%"
          change="AI Model Confidence"
          changeType="positive"
          icon={TrendingUp}
        />
        <StatsCard
          title="Avg Processing Time"
          value="120s"
          change="Server Response"
          changeType="positive"
          icon={Clock}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Recent Invoices</h3>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
            <div className="space-y-4">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">Loading recent bills from database...</div>
              ) : dynamicRecentInvoices.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No invoices stored yet. Start scanning!</div>
              ) : dynamicRecentInvoices.map((invoice) => (
                <div
                  key={invoice.rowKey}
                  className="flex items-center justify-between p-4 glass rounded-lg cursor-pointer transition-colors hover:bg-accent/40"
                  onClick={() => {
                    setSelectedInvoice(invoice);
                    setIsDetailsOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedInvoice(invoice);
                      setIsDetailsOpen(true);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">{invoice.customer}</p>
                      <p className="text-sm text-muted-foreground">
                        {invoice.id} • {invoice.date}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{invoice.amount}</p>
                    <div className="flex items-center space-x-2">
                       <span className={'inline-block w-2 h-2 rounded-full bg-success'} />
                      <span className="text-xs text-muted-foreground capitalize">
                        {invoice.status}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({invoice.confidence}%)
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedInvoice(invoice);
                      setIsDetailsOpen(true);
                    }}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6">Quick Actions</h3>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start" onClick={onUploadClick}>
                <Upload className="w-4 h-4 mr-3" />
                Upload New Invoice
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Eye className="w-4 h-4 mr-3" />
                Review Pending
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Download className="w-4 h-4 mr-3" />
                Export Data
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="w-4 h-4 mr-3" />
                Manage Customers
              </Button>
            </div>
          </Card>

          {/* Processing Status */}
          <Card className="p-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">System Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">OCR Engine</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-success rounded-full" />
                  <span className="text-xs text-muted-foreground">Online</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Database</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-success rounded-full" />
                  <span className="text-xs text-muted-foreground">Connected</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Storage</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-warning rounded-full" />
                  <span className="text-xs text-muted-foreground">78% Used</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>
              Complete OCR output and document metadata for the selected invoice.
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Invoice Number</p>
                  <p className="font-semibold break-all">{selectedInvoice.id}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="font-semibold">{selectedInvoice.customer}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Bill Date</p>
                  <p className="font-semibold">{selectedInvoice.date}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="font-semibold">{selectedInvoice.amount}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-3">Extracted Fields</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(selectedFields).length > 0 ? (
                    Object.entries(selectedFields).map(([key, value]) => (
                      <div key={key} className="rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground">{prettifyKey(key)}</p>
                        <p className="font-medium break-words">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value || 'N/A')}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No extracted fields found.</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-3">Document Metadata</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedMetadata.map((item) => (
                    <div key={item.label} className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="font-medium break-all">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}