import { useState } from 'react';
import { Plus, Trash2, Settings, DollarSign, AlertTriangle, Download, Printer, FileText, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRooms } from '@/hooks/useRooms';
import { useGuests } from '@/hooks/useGuests';
import { useExpenses } from '@/hooks/useExpenses';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveFileNatively, isNativePlatform } from '@/utils/nativeFileHandler';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from '@/integrations/supabase/client';

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
  const [isExporting, setIsExporting] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearType, setClearType] = useState<'all' | 'guests' | 'rooms'>('all');
  const [isClearing, setIsClearing] = useState(false);

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

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
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

      // Create CSV header (without Room Number)
      const headers = ['Date', 'Guest Name', 'Total Amount', 'Paid Amount', 'Pending Amount', 'Payment Mode', 'Pay To Whom'];
      
      // Create CSV rows
      const rows = sortedGuests.map(guest => [
        format(new Date(guest.check_in), 'dd/MM/yyyy'),
        guest.name,
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

      const filename = `guest-data-${format(new Date(), 'dd-MM-yyyy')}.csv`;
      const result = await saveFileNatively(filename, csvContent, 'text/csv;charset=utf-8;');

      if (result.success) {
        toast({
          title: "Success",
          description: isNativePlatform() 
            ? "CSV file ready to save. Choose location in share dialog." 
            : "Guest data exported to CSV successfully",
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export CSV file",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
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

      // Create PDF
      const doc = new jsPDF('landscape');
      
      // Add header
      doc.setFontSize(18);
      doc.setTextColor(40, 40, 40);
      doc.text('GuestNest - Guest Data Report', 14, 22);
      
      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${format(new Date(), 'dd MMMM yyyy, HH:mm')}`, 14, 30);
      
      if (dateRange.from || dateRange.to) {
        const dateFilter = `Date Range: ${dateRange.from ? format(new Date(dateRange.from), 'dd/MM/yyyy') : 'Start'} to ${dateRange.to ? format(new Date(dateRange.to), 'dd/MM/yyyy') : 'End'}`;
        doc.text(dateFilter, 14, 36);
      }

      // Prepare table data (without Room column)
      const tableData = sortedGuests.map(guest => [
        format(new Date(guest.check_in), 'dd/MM/yyyy'),
        guest.name,
        `₹${guest.total_amount}`,
        `₹${guest.paid_amount}`,
        `₹${guest.pending_amount}`,
        guest.payment_mode || 'N/A',
        guest.pay_to_whom || 'N/A'
      ]);

      // Calculate totals by payment mode (case-insensitive matching)
      const totalCash = sortedGuests
        .filter(g => g.payment_mode?.toLowerCase() === 'cash')
        .reduce((sum, g) => sum + Number(g.paid_amount || 0), 0);
      const totalOnline = sortedGuests
        .filter(g => g.payment_mode?.toLowerCase() === 'online')
        .reduce((sum, g) => sum + Number(g.paid_amount || 0), 0);
      const grandTotal = sortedGuests.reduce((sum, g) => sum + Number(g.paid_amount || 0), 0);

      // Add table with proper pagination
      autoTable(doc, {
        head: [['Date', 'Guest Name', 'Total', 'Paid', 'Pending', 'Mode', 'Pay To']],
        body: tableData,
        startY: dateRange.from || dateRange.to ? 42 : 36,
        theme: 'striped',
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 10,
        },
        bodyStyles: {
          fontSize: 9,
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250],
        },
        margin: { top: 20, bottom: 25 },
        showHead: 'everyPage',
        tableWidth: 'auto',
      });

      // Add totals summary after table - check if we need a new page
      let finalY = (doc as any).lastAutoTable.finalY || 50;
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // If summary would overflow, add new page
      if (finalY + 45 > pageHeight) {
        doc.addPage();
        finalY = 20;
      }
      
      doc.setFontSize(11);
      doc.setTextColor(40, 40, 40);
      doc.text('Payment Summary:', 14, finalY + 10);
      doc.setFontSize(10);
      doc.text(`Total Paid (Cash): ₹${totalCash.toLocaleString()}`, 14, finalY + 18);
      doc.text(`Total Paid (Online): ₹${totalOnline.toLocaleString()}`, 14, finalY + 25);
      doc.setFontSize(11);
      doc.setTextColor(59, 130, 246);
      doc.text(`Grand Total Paid: ₹${grandTotal.toLocaleString()}`, 14, finalY + 34);

      // Add page numbers to all pages
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Page ${i} of ${totalPages}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // Convert PDF to blob/base64 based on platform
      if (isNativePlatform()) {
        const pdfData = doc.output('datauristring').split(',')[1];
        const filename = `guest-data-${format(new Date(), 'dd-MM-yyyy')}.pdf`;
        const result = await saveFileNatively(filename, pdfData, 'application/pdf');

        if (result.success) {
          toast({
            title: "Success",
            description: "PDF file ready to save. Choose location in share dialog.",
          });
        } else {
          throw new Error(result.error);
        }
      } else {
        doc.save(`guest-data-${format(new Date(), 'dd-MM-yyyy')}.pdf`);
        toast({
          title: "Success",
          description: "Guest data exported to PDF successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export PDF file",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = async () => {
    if (isNativePlatform()) {
      // On mobile, generate PDF and open it
      setIsExporting(true);
      try {
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
        
        const sortedGuests = filteredGuests.sort((a, b) => 
          new Date(a.check_in).getTime() - new Date(b.check_in).getTime()
        );

        const doc = new jsPDF('landscape');
        
        doc.setFontSize(18);
        doc.setTextColor(40, 40, 40);
        doc.text('GuestNest - Guest Data Report', 14, 22);
        
        doc.setFontSize(11);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated on: ${format(new Date(), 'dd MMMM yyyy, HH:mm')}`, 14, 30);

        const tableData = sortedGuests.map(guest => [
          format(new Date(guest.check_in), 'dd/MM/yyyy'),
          guest.name,
          `₹${guest.total_amount}`,
          `₹${guest.paid_amount}`,
          `₹${guest.pending_amount}`,
          guest.payment_mode || 'N/A',
          guest.pay_to_whom || 'N/A'
        ]);

        // Calculate totals by payment mode (case-insensitive matching)
        const totalCash = sortedGuests
          .filter(g => g.payment_mode?.toLowerCase() === 'cash')
          .reduce((sum, g) => sum + Number(g.paid_amount || 0), 0);
        const totalOnline = sortedGuests
          .filter(g => g.payment_mode?.toLowerCase() === 'online')
          .reduce((sum, g) => sum + Number(g.paid_amount || 0), 0);
        const grandTotal = sortedGuests.reduce((sum, g) => sum + Number(g.paid_amount || 0), 0);

        autoTable(doc, {
          head: [['Date', 'Guest Name', 'Total', 'Paid', 'Pending', 'Mode', 'Pay To']],
          body: tableData,
          startY: 36,
          theme: 'striped',
          headStyles: { fillColor: [59, 130, 246] },
          margin: { top: 20, bottom: 25 },
          showHead: 'everyPage',
          tableWidth: 'auto',
        });

        // Add totals summary after table - check if we need a new page
        let finalY = (doc as any).lastAutoTable.finalY || 50;
        const pageHeight = doc.internal.pageSize.getHeight();
        
        if (finalY + 45 > pageHeight) {
          doc.addPage();
          finalY = 20;
        }
        
        doc.setFontSize(11);
        doc.setTextColor(40, 40, 40);
        doc.text('Payment Summary:', 14, finalY + 10);
        doc.setFontSize(10);
        doc.text(`Total Paid (Cash): ₹${totalCash.toLocaleString()}`, 14, finalY + 18);
        doc.text(`Total Paid (Online): ₹${totalOnline.toLocaleString()}`, 14, finalY + 25);
        doc.setFontSize(11);
        doc.setTextColor(59, 130, 246);
        doc.text(`Grand Total Paid: ₹${grandTotal.toLocaleString()}`, 14, finalY + 34);

        // Add page numbers to all pages
        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(128, 128, 128);
          doc.text(
            `Page ${i} of ${totalPages}`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
          );
        }

        const pdfData = doc.output('datauristring').split(',')[1];
        const filename = `print-guest-data-${format(new Date(), 'dd-MM-yyyy')}.pdf`;
        const result = await saveFileNatively(filename, pdfData, 'application/pdf');

        if (result.success) {
          toast({
            title: "Success",
            description: "PDF ready to view and print. Open from share dialog.",
          });
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to generate print file",
          variant: "destructive",
        });
      } finally {
        setIsExporting(false);
      }
    } else {
      // On web, use traditional print
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
      
      const sortedGuests = filteredGuests.sort((a, b) => 
        new Date(a.check_in).getTime() - new Date(b.check_in).getTime()
      );

      // Calculate totals by payment mode (case-insensitive matching)
      const totalCash = sortedGuests
        .filter(g => g.payment_mode?.toLowerCase() === 'cash')
        .reduce((sum, g) => sum + Number(g.paid_amount || 0), 0);
      const totalOnline = sortedGuests
        .filter(g => g.payment_mode?.toLowerCase() === 'online')
        .reduce((sum, g) => sum + Number(g.paid_amount || 0), 0);
      const grandTotal = sortedGuests.reduce((sum, g) => sum + Number(g.paid_amount || 0), 0);

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
            <h1>GuestNest - Guest Data</h1>
            <div class="date">Generated on: ${format(new Date(), 'dd MMMM yyyy, HH:mm')}</div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Guest Name</th>
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
                    <td>₹${guest.total_amount}</td>
                    <td>₹${guest.paid_amount}</td>
                    <td>₹${guest.pending_amount}</td>
                    <td>${guest.payment_mode || 'N/A'}</td>
                    <td>${guest.pay_to_whom || 'N/A'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div style="margin-top: 20px; padding: 15px; background-color: #f5f7fa; border-radius: 8px;">
              <h3 style="margin: 0 0 10px 0; color: #333;">Payment Summary</h3>
              <p style="margin: 5px 0; color: #555;">Total Paid (Cash): ₹${totalCash.toLocaleString()}</p>
              <p style="margin: 5px 0; color: #555;">Total Paid (Online): ₹${totalOnline.toLocaleString()}</p>
              <p style="margin: 10px 0 0 0; font-weight: bold; color: #3b82f6; font-size: 16px;">Grand Total Paid: ₹${grandTotal.toLocaleString()}</p>
            </div>
          </body>
        </html>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      
      setTimeout(() => {
        printWindow.print();
      }, 250);

      toast({
        title: "Success",
        description: "Print dialog opened",
      });
    }
  };

  const handleClearDataRequest = (type: 'all' | 'guests' | 'rooms') => {
    setClearType(type);
    setClearDialogOpen(true);
  };

  const handleClearData = async () => {
    setIsClearing(true);
    try {
      // Map clearType to action for edge function
      const actionMap = {
        'all': 'clear_all',
        'guests': 'clear_guests',
        'rooms': 'clear_rooms',
      } as const;

      // Call secure edge function for admin operations
      const response = await fetch(
        'https://mqpevmlaeoesuyrboakn.supabase.co/functions/v1/admin-operations',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xcGV2bWxhZW9lc3V5cmJvYWtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNDk2MzMsImV4cCI6MjA3MzkyNTYzM30.QkFEZkW4_m72-C_xaBNp3lQlNvDUVjhjST0aN0qLgsI',
          },
          body: JSON.stringify({
            action: actionMap[clearType],
            password: passwordInput,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to perform operation');
      }

      toast({
        title: "Success",
        description: result.message,
      });

      setClearDialogOpen(false);
      setPasswordInput('');
      
      // Refresh the data by reloading the page
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to clear data",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };

  const sections = [
    { id: 'expenses', label: 'Expense Manager', icon: DollarSign },
    { id: 'pending-payments', label: 'Pending Payments', icon: AlertTriangle },
    { id: 'export-data', label: 'Export Data', icon: Download },
    { id: 'clear-data', label: 'Clear Data', icon: Database },
  ];

  return (
    <div className="p-3 sm:p-4 pb-20">
      <h1 className="text-xl sm:text-2xl font-bold neon-text mb-4 sm:mb-6">More Options</h1>

      {/* Section Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 sm:mb-6">
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

      {/* Export Data */}
      {activeSection === 'export-data' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="glass-card">
            <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Export Guest Data</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
              Export all guest data including check-in dates, payments, and payment modes.
              {isNativePlatform() && (
                <span className="block mt-2 text-blue-400">
                  📱 On mobile, you can choose where to save the file using the share dialog.
                </span>
              )}
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
              <Button 
                onClick={handleExportCSV} 
                disabled={isExporting}
                className="w-full h-11"
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export to CSV'}
              </Button>
              <Button 
                onClick={handleExportPDF} 
                disabled={isExporting}
                variant="secondary" 
                className="w-full h-11"
              >
                <FileText className="w-4 h-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export to PDF'}
              </Button>
            </div>

            <div className="mt-4">
              <Button 
                onClick={handlePrint} 
                disabled={isExporting}
                variant="outline" 
                className="w-full h-11"
              >
                <Printer className="w-4 h-4 mr-2" />
                {isExporting ? 'Preparing...' : 'Print Data'}
              </Button>
            </div>
          </div>

          <div className="glass-card">
            <h3 className="text-sm sm:text-base font-semibold mb-2">Export Includes:</h3>
            <ul className="list-disc list-inside text-xs sm:text-sm text-muted-foreground space-y-1">
              <li>Check-in Date</li>
              <li>Guest Name</li>
              <li>Total Amount</li>
              <li>Paid Amount</li>
              <li>Pending Amount</li>
              <li>Payment Mode (Cash/Online)</li>
              <li>Pay To Whom (for online payments)</li>
              <li>Payment Summary (Cash, Online, Grand Total)</li>
            </ul>
          </div>

          <div className="glass-card bg-blue-500/10 border-blue-400/30">
            <p className="text-xs sm:text-sm text-blue-400">
              💡 Data is sorted by check-in date from oldest to newest
            </p>
          </div>

          <div className="glass-card bg-green-500/10 border-green-400/30">
            <h3 className="text-sm sm:text-base font-semibold mb-2 text-green-400">PDF Export Features:</h3>
            <ul className="list-disc list-inside text-xs sm:text-sm text-green-400/80 space-y-1">
              <li>Professional formatting with headers and footers</li>
              <li>Landscape orientation for better table viewing</li>
              <li>Page numbers and generation timestamp</li>
              <li>Same data as CSV export</li>
            </ul>
          </div>
        </div>
      )}

      {/* Clear Data Section */}
      {activeSection === 'clear-data' && (
        <div className="space-y-4">
          <div className="glass-card bg-red-500/10 border-red-400/30">
            <h2 className="text-lg font-semibold mb-4 text-red-400">⚠️ Clear Data</h2>
            <p className="text-sm text-muted-foreground mb-6">
              This action will permanently delete data from the database. This cannot be undone.
              Password verification is required.
            </p>

            <div className="space-y-3">
              <Button
                onClick={() => handleClearDataRequest('guests')}
                variant="destructive"
                className="w-full h-11"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Guest Data
              </Button>

              <Button
                onClick={() => handleClearDataRequest('rooms')}
                variant="destructive"
                className="w-full h-11"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Room Data
              </Button>

              <Button
                onClick={() => handleClearDataRequest('all')}
                variant="destructive"
                className="w-full h-11 bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All Data
              </Button>
            </div>
          </div>

          <div className="glass-card">
            <h3 className="text-base font-semibold mb-2">What Gets Cleared:</h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li><strong>Guest Data:</strong> All guest records and check-in history</li>
              <li><strong>Room Data:</strong> All room records (guest assignments will be cleared first)</li>
              <li><strong>All Data:</strong> Both guests and rooms data</li>
              <li className="text-yellow-400 mt-2">⚠️ Expense data is NOT cleared by these actions</li>
            </ul>
          </div>
        </div>
      )}

      {/* Password Verification Dialog */}
      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Data Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to permanently delete{' '}
              <strong className="text-red-400">
                {clearType === 'all' ? 'ALL DATA' : clearType === 'guests' ? 'GUEST DATA' : 'ROOM DATA'}
              </strong>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-4">
            <Label htmlFor="password" className="text-sm">Enter Admin Password</Label>
            <Input
              id="password"
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Enter password"
              className="glass h-11"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && passwordInput) {
                  handleClearData();
                }
              }}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setPasswordInput('');
                setClearDialogOpen(false);
              }}
              disabled={isClearing}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearData}
              disabled={!passwordInput || isClearing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isClearing ? 'Clearing...' : 'Clear Data'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};