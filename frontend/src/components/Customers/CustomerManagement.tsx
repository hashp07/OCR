import { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type CustomerSummary = {
  key: string;
  rowKey: string;
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  totalInvoices: number;
  totalAmount: string;
  lastInvoice: string;
  status: string;
};

export function CustomerManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [allCustomers, setAllCustomers] = useState<CustomerSummary[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<{ name: string; email: string; phone: string; address: string }>({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/customers/summary`, { headers: authHeaders });
        if (!response.ok) throw new Error('Failed to fetch customers');
        const payload = await response.json();
        const customers: CustomerSummary[] = payload?.data || [];

        setAllCustomers(customers);
        setFilteredCustomers(customers);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching customers:', error);
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, [apiUrl, authHeaders]);

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

  const openDetails = (customer: CustomerSummary) => {
    setSelectedCustomer(customer);
    setDetailsOpen(true);
  };

  const openEdit = (customer: CustomerSummary) => {
    setSelectedCustomer(customer);
    setForm({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
    });
    setEditOpen(true);
  };

  const openDelete = (customer: CustomerSummary) => {
    setSelectedCustomer(customer);
    setDeleteOpen(true);
  };

  const saveCustomer = async () => {
    if (!selectedCustomer) return;
    try {
      setIsSaving(true);
      const response = await fetch(`${apiUrl}/api/customers/${encodeURIComponent(selectedCustomer.key)}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          name: form.name?.trim() || null,
          email: form.email?.trim() || null,
          phone: form.phone?.trim() || null,
          address: form.address?.trim() || null,
        }),
      });
      if (!response.ok) throw new Error('Failed to update customer');

      const next = allCustomers.map((c) =>
        c.key === selectedCustomer.key
          ? {
              ...c,
              name: form.name?.trim() || c.name,
              email: form.email?.trim() || null,
              phone: form.phone?.trim() || null,
              address: form.address?.trim() || null,
            }
          : c
      );
      setAllCustomers(next);
      handleSearch(searchTerm);
      setEditOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCustomer = async () => {
    if (!selectedCustomer) return;
    try {
      setIsSaving(true);
      const response = await fetch(`${apiUrl}/api/customers/${encodeURIComponent(selectedCustomer.key)}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (!response.ok) throw new Error('Failed to delete customer');

      const next = allCustomers.filter((c) => c.key !== selectedCustomer.key);
      setAllCustomers(next);
      setFilteredCustomers(next.filter(customer =>
        (customer.name && customer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (customer.id && customer.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (customer.phone && customer.phone.toLowerCase().includes(searchTerm.toLowerCase()))
      ));
      setDeleteOpen(false);
      setDetailsOpen(false);
      setSelectedCustomer(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 p-2 md:p-0 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Customer Management</h1>
          <p className="text-muted-foreground text-sm md:text-base mt-1">
            Manage your customers and their invoice history.
          </p>
        </div>
        <Button className="gradient-primary w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:space-x-4 md:gap-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search customers by name, email, or ID..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 h-11 md:h-10"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 sm:flex-none h-11 md:h-10">Filter</Button>
            <Button variant="outline" className="flex-1 sm:flex-none h-11 md:h-10">Export</Button>
          </div>
        </div>
      </Card>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {filteredCustomers.map((customer) => (
          <Card key={customer.rowKey} className="p-5 md:p-6 glass transition-all duration-200 hover:shadow-lg flex flex-col h-full">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-10 h-10 md:w-12 md:h-12 gradient-primary rounded-full flex items-center justify-center shrink-0">
                  <span className="text-white font-semibold text-sm md:text-base flex items-center justify-center text-center">
                    {customer.name && customer.name !== 'Unknown Customer' 
                      ? customer.name.split(' ').slice(0,2).map((n: string) => n[0]).join('').toUpperCase()
                      : '?'}
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm md:text-base truncate">{customer.name}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground truncate">{customer.id}</p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="shrink-0 -mr-2">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => openDetails(customer)} className="py-2.5 md:py-1.5">
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openEdit(customer)} className="py-2.5 md:py-1.5">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Customer
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive py-2.5 md:py-1.5" onClick={() => openDelete(customer)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Customer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-2 md:space-y-3 flex-1">
              {customer.email && (
                <div className="flex items-center space-x-2 text-xs md:text-sm">
                  <Mail className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{customer.email}</span>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center space-x-2 text-xs md:text-sm">
                  <Phone className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground shrink-0" />
                  <span>{customer.phone}</span>
                </div>
              )}
              {customer.address && (
                <div className="flex items-start space-x-2 text-xs md:text-sm">
                  <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <span className="text-muted-foreground line-clamp-2">{customer.address}</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-base md:text-lg font-semibold">{customer.totalInvoices}</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider">Invoices</p>
                </div>
                <div>
                  <p className="text-base md:text-lg font-semibold text-green-500">{customer.totalAmount}</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider">Total Amount</p>
                </div>
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <Badge variant={customer.status === 'active' ? 'default' : 'secondary'} className="text-[10px] md:text-xs">
                  {customer.status}
                </Badge>
                <span className="text-[10px] md:text-xs text-muted-foreground">
                  Last: {customer.lastInvoice}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State / Loading */}
      {isLoading ? (
        <Card className="p-8 md:p-12 text-center">
          <div className="w-12 h-12 md:w-16 md:h-16 gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center">
            <div className="w-6 h-6 md:w-8 md:h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h3 className="text-base md:text-lg font-semibold mb-2">Loading customers...</h3>
        </Card>
      ) : filteredCustomers.length === 0 ? (
        <Card className="p-8 md:p-12 text-center">
          <div className="w-12 h-12 md:w-16 md:h-16 gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center">
            <Search className="w-6 h-6 md:w-8 md:h-8 text-white" />
          </div>
          <h3 className="text-base md:text-lg font-semibold mb-2">No customers found</h3>
          <p className="text-sm md:text-base text-muted-foreground mb-6">
            Try adjusting your search criteria or add a new customer.
          </p>
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => handleSearch('')}>Clear Search</Button>
        </Card>
      ) : null}

      {/* View Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="w-[95vw] max-w-md p-4 md:p-6 rounded-2xl md:rounded-lg">
          <DialogHeader className="text-left">
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>
              {selectedCustomer?.name || 'Customer'}
            </DialogDescription>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-4 text-sm mt-2">
              <div className="grid grid-cols-2 gap-3 md:gap-4 p-4 bg-muted/30 rounded-xl">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Customer ID</div>
                  <div className="font-medium break-words">{selectedCustomer.id}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Last invoice</div>
                  <div className="font-medium">{selectedCustomer.lastInvoice}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Invoices</div>
                  <div className="font-medium">{selectedCustomer.totalInvoices}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total amount</div>
                  <div className="font-medium text-green-500">{selectedCustomer.totalAmount}</div>
                </div>
              </div>

              <div className="space-y-3 p-4 bg-muted/30 rounded-xl">
                {selectedCustomer.email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="break-words">{selectedCustomer.email}</span>
                  </div>
                )}
                {selectedCustomer.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="break-words">{selectedCustomer.phone}</span>
                  </div>
                )}
                {selectedCustomer.address && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <span className="break-words">{selectedCustomer.address}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-6">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setDetailsOpen(false)}>Close</Button>
            {selectedCustomer && (
              <Button className="w-full sm:w-auto" onClick={() => { setDetailsOpen(false); openEdit(selectedCustomer); }}>
                Edit Details
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="w-[95vw] max-w-md p-4 md:p-6 rounded-2xl md:rounded-lg">
          <DialogHeader className="text-left">
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>Update customer contact details.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="customer-name">Name</Label>
              <Input
                id="customer-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Customer name"
                className="h-11 md:h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-email">Email</Label>
              <Input
                id="customer-email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="Email address"
                className="h-11 md:h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-phone">Phone</Label>
              <Input
                id="customer-phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="Phone number"
                className="h-11 md:h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-address">Address</Label>
              <Input
                id="customer-address"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="Address"
                className="h-11 md:h-10"
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-6">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setEditOpen(false)} disabled={isSaving}>Cancel</Button>
            <Button className="w-full sm:w-auto" onClick={saveCustomer} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Customer Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="w-[95vw] max-w-md p-4 md:p-6 rounded-2xl md:rounded-lg">
          <DialogHeader className="text-left">
            <DialogTitle>Delete Customer</DialogTitle>
            <DialogDescription>
              This will remove the customer from the list (and delete OCR invoices linked to this customer id if available).
            </DialogDescription>
          </DialogHeader>

          <div className="text-sm bg-destructive/10 text-destructive p-4 rounded-xl mt-2 border border-destructive/20">
            Are you sure you want to delete <span className="font-bold">{selectedCustomer?.name || 'this customer'}</span>? This action cannot be undone.
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-6">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setDeleteOpen(false)} disabled={isSaving}>Cancel</Button>
            <Button variant="destructive" className="w-full sm:w-auto" onClick={deleteCustomer} disabled={isSaving}>
              {isSaving ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}