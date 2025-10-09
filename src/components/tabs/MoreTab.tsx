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
    // Sort guests by check-in date
    const sortedGuests = [...guests].sort((a, b) => 
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
    // Sort guests by check-in date
    const sortedGuests = [...guests].sort((a, b) => 
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
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold neon-text mb-6">More Options</h1>

      {/* Section Navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        {sections.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant={activeSection === id ? "default" : "outline"}
            onClick={() => setActiveSection(id)}
            className="flex items-center gap-2"
          >
            <Icon className="w-4 h-4" />
            {label}
          </Button>
        ))}
      </div>

      {/* Expense Manager */}
      {activeSection === 'expenses' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Add New Expense</h2>
            <form onSubmit={handleAddExpense} className="glass-card space-y-4">
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  placeholder="Enter expense description"
                  required
                  className="glass"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    placeholder="0.00"
                    required
                    className="glass"
                  />
                </div>
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    required
                    className="glass"
                  />
                </div>
              </div>
              <Button type="submit" disabled={addExpense.isPending}>
                <Plus className="w-4 h-4 mr-2" />
                {addExpense.isPending ? 'Adding...' : 'Add Expense'}
              </Button>
            </form>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Recent Expenses</h2>
            <div className="space-y-2">
              {expenses.slice(0, 10).map((expense) => (
                <div key={expense.id} className="glass-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{expense.description}</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(expense.date), 'MMM dd, yyyy')} • {expense.category}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-red-400">₹{expense.amount}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 text-red-400 hover:text-red-300"
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
                <div className="text-center py-8 text-muted-foreground">
                  No expenses recorded yet
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pending Payments */}
      {activeSection === 'pending-payments' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Guests with Pending Payments</h2>
          {pendingGuests.map((guest) => (
            <div key={guest.id} className="glass-card border-yellow-400/30">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{guest.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Room {guest.room_number} • {guest.phone}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Check-in: {format(new Date(guest.check_in), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-red-400">
                    ₹{guest.pending_amount}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total: ₹{guest.total_amount} | Paid: ₹{guest.paid_amount}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {pendingGuests.length === 0 && (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <p className="text-green-400 font-medium">All payments are up to date!</p>
              <p className="text-muted-foreground">No pending payments found.</p>
            </div>
          )}
        </div>
      )}

      {/* Export to CSV */}
      {activeSection === 'export-csv' && (
        <div className="space-y-6">
          <div className="glass-card">
            <h2 className="text-lg font-semibold mb-4">Export Guest Data</h2>
            <p className="text-muted-foreground mb-6">
              Export all guest data including check-in dates, room numbers, payments, and payment modes to a CSV file or print it directly.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleExportCSV} className="flex-1 sm:flex-initial">
                <Download className="w-4 h-4 mr-2" />
                Export to CSV
              </Button>
              <Button onClick={handlePrint} variant="secondary" className="flex-1 sm:flex-initial">
                <Printer className="w-4 h-4 mr-2" />
                Print Data
              </Button>
            </div>
          </div>

          <div className="glass-card">
            <h3 className="font-semibold mb-2">CSV File Includes:</h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
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
            <p className="text-sm text-blue-400">
              💡 Data is sorted by check-in date from oldest to newest
            </p>
          </div>
        </div>
      )}
    </div>
  );
};