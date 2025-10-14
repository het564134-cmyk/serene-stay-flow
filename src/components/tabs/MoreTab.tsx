import { useState } from 'react';
import { Plus, Trash2, Settings, DollarSign, AlertTriangle, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRooms } from '@/hooks/useRooms';
import { useGuests } from '@/hooks/useGuests';
import { useExpenses } from '@/hooks/useExpenses';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export const MoreTab = () => {
  const [activeSection, setActiveSection] = useState('expenses');
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    category: 'General',
    date: new Date().toISOString().split('T')[0],
  });
  const [dateRange, setDateRange] = useState({
    from: '',
    to: '',
  });

  const { rooms, updateRoom, deleteRoom } = useRooms();
  const { guests, pendingGuests } = useGuests();
  const { expenses, addExpense, deleteExpense } = useExpenses();
  const { toast } = useToast();

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.description || !expenseForm.amount) return;

    await addExpense.mutateAsync({
      description: expenseForm.description,
      amount: parseFloat(expenseForm.amount),
      category: expenseForm.category,
      date: expenseForm.date,
    });

    setExpenseForm({
      description: '',
      amount: '',
      category: 'General',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const handleExportCSV = () => {
    // Filter guests by date range if specified
    let filteredGuests = [...guests];
    if (dateRange.from) {
      filteredGuests = filteredGuests.filter(guest => 
        new Date(guest.check_in) >= new Date(dateRange.from)
      );
    }
    if (dateRange.to) {
      filteredGuests = filteredGuests.filter(guest => 
        new Date(guest.check_in) <= new Date(dateRange.to)
      );
    }
    
    // Sort guests by check-in date
    const sortedGuests = filteredGuests.sort((a, b) => 
      new Date(a.check_in).getTime() - new Date(b.check_in).getTime()
    );

    // Create CSV header
    const headers = ['Date', 'Guest Name', 'Room Number', 'Total Amount', 'Paid Amount', 'Pending Amount', 'Payment Mode', 'Pay To Whom'];
    
    // Create CSV rows
    const rows = sortedGuests.map(guest => [
      format(new Date(guest.check_in), 'dd/MM/yyyy'),
      guest.name,
      guest.room_number || 'N/A',
      guest.total_amount,
      guest.paid_amount,
      guest.pending_amount,
      guest.payment_mode || 'N/A',
      guest.pay_to_whom || 'N/A'
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `guest-data-${format(new Date(), 'dd-MM-yyyy')}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Success",
      description: "Guest data exported to CSV successfully",
    });
  };

  const handlePrint = () => {
    // Filter guests by date range if specified
    let filteredGuests = [...guests];
    if (dateRange.from) {
      filteredGuests = filteredGuests.filter(guest => 
        new Date(guest.check_in) >= new Date(dateRange.from)
      );
    }
    if (dateRange.to) {
      filteredGuests = filteredGuests.filter(guest => 
        new Date(guest.check_in) <= new Date(dateRange.to)
      );
    }
    
    // Sort guests by check-in date
    const sortedGuests = filteredGuests.sort((a, b) => 
      new Date(a.check_in).getTime() - new Date(b.check_in).getTime()
    );

    // Create print window with formatted table
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Error",
        description: "Please allow popups to print",
        variant: "destructive",
      });
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Guest Data - ${format(new Date(), 'dd/MM/yyyy')}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              color: #000;
            }
            h1 {
              text-align: center;
              margin-bottom: 10px;
            }
            .date {
              text-align: center;
              margin-bottom: 20px;
              color: #666;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            @media print {
              body {
                padding: 10px;
              }
            }
          </style>
        </head>
        <body>
          <h1>Guest House Management - Guest Data</h1>
          <div class="date">Generated on: ${format(new Date(), 'dd MMMM yyyy, HH:mm')}</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Guest Name</th>
                <th>Room Number</th>
                <th>Total Amount</th>
                <th>Paid Amount</th>
                <th>Pending Amount</th>
                <th>Payment Mode</th>
                <th>Pay To Whom</th>
              </tr>
            </thead>
            <tbody>
              ${sortedGuests.map(guest => `
                <tr>
                  <td>${format(new Date(guest.check_in), 'dd/MM/yyyy')}</td>
                  <td>${guest.name}</td>
                  <td>${guest.room_number || 'N/A'}</td>
                  <td>₹${guest.total_amount}</td>
                  <td>₹${guest.paid_amount}</td>
                  <td>₹${guest.pending_amount}</td>
                  <td>${guest.payment_mode || 'N/A'}</td>
                  <td>${guest.pay_to_whom || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
    }, 250);

    toast({
      title: "Success",
      description: "Print dialog opened",
    });
  };

  const sections = [
    { id: 'expenses', label: 'Expense Manager', icon: DollarSign },
    { id: 'pending-payments', label: 'Pending Payments', icon: AlertTriangle },
    { id: 'export-csv', label: 'Export to CSV', icon: Download },
  ];

  return (
    <div className="p-3 sm:p-4 pb-20">
      <h1 className="text-xl sm:text-2xl font-bold neon-text mb-4 sm:mb-6">More Options</h1>

      {/* Section Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4 sm:mb-6">
        {sections.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant={activeSection === id ? "default" : "outline"}
            onClick={() => setActiveSection(id)}
            className="flex items-center justify-center gap-2 min-h-[44px] text-sm sm:text-base"
          >
            <Icon className="w-4 h-4" />
            {label}
          </Button>
        ))}
      </div>

      {/* Expense Manager */}
      {activeSection === 'expenses' && (
        <div className="space-y-4 sm:space-y-6">
          <div>
            <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Add New Expense</h2>
            <form onSubmit={handleAddExpense} className="glass-card space-y-3 sm:space-y-4">
              <div>
                <Label htmlFor="description" className="text-sm">Description</Label>
                <Input
                  id="description"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  placeholder="Enter expense description"
                  required
                  className="glass h-11 text-base"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="amount" className="text-sm">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    placeholder="0.00"
                    required
                    className="glass h-11 text-base"
                  />
                </div>
                <div>
                  <Label htmlFor="date" className="text-sm">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    required
                    className="glass h-11 text-base"
                  />
                </div>
              </div>
              <Button type="submit" disabled={addExpense.isPending} className="w-full h-11">
                <Plus className="w-4 h-4 mr-2" />
                {addExpense.isPending ? 'Adding...' : 'Add Expense'}
              </Button>
            </form>
          </div>

          <div>
            <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Recent Expenses</h2>
            <div className="space-y-2">
              {expenses.slice(0, 10).map((expense) => (
                <div key={expense.id} className="glass-card">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm sm:text-base truncate">{expense.description}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        {format(new Date(expense.date), 'MMM dd, yyyy')} • {expense.category}
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-2">
                      <span className="font-medium text-base sm:text-lg text-red-400">₹{expense.amount}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="min-w-[44px] min-h-[44px] text-red-400 hover:text-red-300"
                        onClick={() => {
                          if (window.confirm('Delete this expense?')) {
                            deleteExpense.mutate(expense.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {expenses.length === 0 && (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No expenses recorded yet
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pending Payments */}
      {activeSection === 'pending-payments' && (
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-base sm:text-lg font-semibold">Guests with Pending Payments</h2>
          {pendingGuests.map((guest) => (
            <div key={guest.id} className="glass-card border-yellow-400/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm sm:text-base truncate">{guest.name}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Room {guest.room_number} • {guest.phone}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Check-in: {format(new Date(guest.check_in), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                  <div className="text-base sm:text-lg font-bold text-red-400">
                    ₹{guest.pending_amount}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground text-right">
                    Total: ₹{guest.total_amount} | Paid: ₹{guest.paid_amount}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {pendingGuests.length === 0 && (
            <div className="text-center py-8">
              <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12 text-green-400 mx-auto mb-4" />
              <p className="text-green-400 font-medium text-sm sm:text-base">All payments are up to date!</p>
              <p className="text-muted-foreground text-xs sm:text-sm">No pending payments found.</p>
            </div>
          )}
        </div>
      )}

      {/* Export to CSV */}
      {activeSection === 'export-csv' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="glass-card">
            <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Export Guest Data</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
              Export all guest data including check-in dates, room numbers, payments, and payment modes.
            </p>
            
            <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
              <h3 className="text-sm sm:text-base font-medium">Filter by Date Range (Optional)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="fromDate" className="text-sm">From Date</Label>
                  <Input
                    id="fromDate"
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                    className="glass h-11 text-base"
                  />
                </div>
                <div>
                  <Label htmlFor="toDate" className="text-sm">To Date</Label>
                  <Input
                    id="toDate"
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                    className="glass h-11 text-base"
                  />
                </div>
              </div>
              {(dateRange.from || dateRange.to) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDateRange({ from: '', to: '' })}
                  className="w-full sm:w-auto min-h-[44px]"
                >
                  Clear Date Filter
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button onClick={handleExportCSV} className="w-full h-11">
                <Download className="w-4 h-4 mr-2" />
                Export to CSV
              </Button>
              <Button onClick={handlePrint} variant="secondary" className="w-full h-11">
                <Printer className="w-4 h-4 mr-2" />
                Print Data
              </Button>
            </div>
          </div>

          <div className="glass-card">
            <h3 className="text-sm sm:text-base font-semibold mb-2">CSV File Includes:</h3>
            <ul className="list-disc list-inside text-xs sm:text-sm text-muted-foreground space-y-1">
              <li>Check-in Date</li>
              <li>Guest Name</li>
              <li>Room Number</li>
              <li>Total Amount</li>
              <li>Paid Amount</li>
              <li>Pending Amount</li>
              <li>Payment Mode (Cash/Online)</li>
              <li>Pay To Whom (for online payments)</li>
            </ul>
          </div>

          <div className="glass-card bg-blue-500/10 border-blue-400/30">
            <p className="text-xs sm:text-sm text-blue-400">
              💡 Data is sorted by check-in date from oldest to newest
            </p>
          </div>
        </div>
      )}
    </div>
  );
};