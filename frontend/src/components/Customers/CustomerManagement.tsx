import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function CustomerManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [allCustomers, setAllCustomers] = useState<any[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getDocData = (record: any) => {
    if (record?.rawJson?.data) return record.rawJson.data;
    if (record?.data) return record.data;

    if (typeof record?.extractedText === 'string') {
      try {
        const parsed = JSON.parse(record.extractedText);
        return parsed?.data || {};
      } catch {
        return {};
      }
    }

    return {};
  };

  const formatDateOnly = (value: any) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toISOString().split('T')[0];
  };

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const apiUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${apiUrl}/api/ocr/results`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (!response.ok) throw new Error('Failed to fetch data');
        const payload = await response.json();
        const results = Array.isArray(payload) ? payload : payload?.data || [];

        // Group OCR results by customer
        const customerMap = new Map<string, any>();

        const parseAmount = (val: any) => {
          if (typeof val === 'number') return val;
          if (typeof val === 'string') {
            const parsed = parseFloat(val.replace(/,/g, '').replace(/[^\d.-]/g, ''));
            return isNaN(parsed) ? 0 : parsed;
          }
          return 0;
        };

        const extractAmount = (data: any) => {
          if (data.total_amount) return parseAmount(data.total_amount);
          if (data.total) return parseAmount(data.total);
          if (data.amount_due) return parseAmount(data.amount_due);
          if (data.after_jan_20_2025) return parseAmount(data.after_jan_20_2025);
          if (data.between_nov_30_2024_and_jan_20_2025) return parseAmount(data.between_nov_30_2024_and_jan_20_2025);
          if (data.before_nov_30_2024) return parseAmount(data.before_nov_30_2024);
          if (data.before_sep_25_2022) return parseAmount(data.before_sep_25_2022);

          for (const [key, value] of Object.entries(data)) {
            if ((key.toLowerCase().includes('amount') || key.toLowerCase().includes('total')) && (typeof value === 'string' || typeof value === 'number')) {
                return parseAmount(value);
            }
          }
          return 0;
        };

        results.forEach((record: any) => {
          const data = getDocData(record);
          const name = data.account_holder || data.customer_name || data.vendor_name || data.name || 'Unknown Customer';
          
          // Use consumer_number or customer_id as the primary unique identifier
          const customerId = data.consumer_number || data.customer_id || data.account_number;
          const uniqueKey = customerId || name;
          const recordDate = data.bill_date || data.date || record.createdAt || record.uploadedAt || record.updatedAt;
          const recordDateMs = new Date(recordDate).getTime();
          
          if (!customerMap.has(uniqueKey)) {
            customerMap.set(uniqueKey, {
              rowKey: customerId || `${name}-${record._id || 'unknown'}`,
              id: customerId || (record._id ? record._id.substring(0, 8).toUpperCase() : 'N/A'),
              name,
              email: data.email || null,
              phone: data.phone || data.contact_number || null,
              address: data.address || null,
              totalInvoices: 0,
              totalAmountNum: 0,
              lastInvoice: formatDateOnly(recordDate),
              lastInvoiceTs: Number.isNaN(recordDateMs) ? 0 : recordDateMs,
              status: 'active',
            });
          }

          const customer = customerMap.get(uniqueKey);
          customer.totalInvoices += 1;
          customer.totalAmountNum += extractAmount(data);

          if (!customer.email && data.email) customer.email = data.email;
          if (!customer.phone && (data.phone || data.contact_number)) customer.phone = data.phone || data.contact_number;
          if (!customer.address && data.address) customer.address = data.address;
          
          // Update last invoice date if the current record is newer
          if (!Number.isNaN(recordDateMs) && recordDateMs > customer.lastInvoiceTs) {
              customer.lastInvoiceTs = recordDateMs;
              customer.lastInvoice = formatDateOnly(recordDate);
          }
        });

        // Format currency after calculation
        const formattedCustomers = Array.from(customerMap.values()).map(c => ({
          ...c,
          totalAmount: `₹${c.totalAmountNum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        }))
          .sort((a, b) => b.totalInvoices - a.totalInvoices);

        setAllCustomers(formattedCustomers);
        setFilteredCustomers(formattedCustomers);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching customers:', error);
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    const filtered = allCustomers.filter(customer =>
      (customer.name && customer.name.toLowerCase().includes(term.toLowerCase())) ||
      (customer.email && customer.email.toLowerCase().includes(term.toLowerCase())) ||
      (customer.id && customer.id.toLowerCase().includes(term.toLowerCase())) ||
      (customer.phone && customer.phone.toLowerCase().includes(term.toLowerCase()))
    );
    setFilteredCustomers(filtered);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customer Management</h1>
          <p className="text-muted-foreground">
            Manage your customers and their invoice history.
          </p>
        </div>
        <Button className="gradient-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search customers by name, email, or ID..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">Filter</Button>
          <Button variant="outline">Export</Button>
        </div>
      </Card>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <Card key={customer.rowKey} className="p-6 glass transition-all duration-200 hover:shadow-lg">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center shrink-0">
                  <span className="text-white font-semibold flex items-center justify-center text-center">
                    {customer.name && customer.name !== 'Unknown Customer' 
                      ? customer.name.split(' ').slice(0,2).map((n: string) => n[0]).join('').toUpperCase()
                      : '?'}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold">{customer.name}</h3>
                  <p className="text-sm text-muted-foreground">{customer.id}</p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Customer
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Customer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-3">
              {customer.email && (
                <div className="flex items-center space-x-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{customer.email}</span>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center space-x-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span>{customer.phone}</span>
                </div>
              )}
              {customer.address && (
                <div className="flex items-start space-x-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <span className="text-muted-foreground line-clamp-2">{customer.address}</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-lg font-semibold">{customer.totalInvoices}</p>
                  <p className="text-xs text-muted-foreground">Invoices</p>
                </div>
                <div>
                  <p className="text-lg font-semibold">{customer.totalAmount}</p>
                  <p className="text-xs text-muted-foreground">Total Amount</p>
                </div>
              </div>
              
              <div className="mt-3 flex items-center justify-between">
                <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
                  {customer.status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Last: {customer.lastInvoice}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State / Loading */}
      {isLoading ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h3 className="text-lg font-semibold mb-2">Loading customers...</h3>
        </Card>
      ) : filteredCustomers.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center">
            <Search className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No customers found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search criteria or add a new customer.
          </p>
          <Button variant="outline" onClick={() => handleSearch('')}>Clear Search</Button>
        </Card>
      ) : null}
    </div>
  );
}