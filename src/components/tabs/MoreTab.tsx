import { useState } from 'react';
import { Plus, Trash2, Settings, DollarSign, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRooms } from '@/hooks/useRooms';
import { useGuests } from '@/hooks/useGuests';
import { useExpenses } from '@/hooks/useExpenses';
import { format } from 'date-fns';

export const MoreTab = () => {
  const [activeSection, setActiveSection] = useState('expenses');
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    category: 'General',
    date: new Date().toISOString().split('T')[0],
  });

  const { rooms, updateRoom, deleteRoom } = useRooms();
  const { pendingGuests } = useGuests();
  const { expenses, addExpense, deleteExpense } = useExpenses();

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

  const sections = [
    { id: 'expenses', label: 'Expense Manager', icon: DollarSign },
    { id: 'pending-payments', label: 'Pending Payments', icon: AlertTriangle },
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
    </div>
  );
};