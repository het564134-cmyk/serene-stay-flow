import { useMemo } from 'react';
import { TrendingUp, Users, Home, DollarSign, AlertCircle } from 'lucide-react';
import { useRooms } from '@/hooks/useRooms';
import { useGuests } from '@/hooks/useGuests';
import { useExpenses } from '@/hooks/useExpenses';
import { format, subDays, startOfDay, endOfDay, isAfter, isBefore } from 'date-fns';

export const AnalyticsTab = () => {
  const { rooms, isLoading: roomsLoading } = useRooms();
  const { guests, isLoading: guestsLoading } = useGuests();
  const { expenses, isLoading: expensesLoading } = useExpenses();

  const analytics = useMemo(() => {
    if (roomsLoading || guestsLoading || expensesLoading) return null;

    const today = new Date();
    const last30Days = subDays(today, 30);
    const last7Days = subDays(today, 7);

    // Room statistics
    const availableRooms = rooms.filter(room => room.status === 'Available').length;
    const occupiedRooms = rooms.filter(room => room.status === 'Occupied').length;
    const maintenanceRooms = rooms.filter(room => room.status === 'Maintenance').length;
    const occupancyRate = rooms.length > 0 ? (occupiedRooms / rooms.length) * 100 : 0;

    // Guest statistics
    const totalGuests = guests.length;
    const currentGuests = guests.filter(guest => !guest.check_out).length;
    const frequentGuests = guests.filter(guest => guest.is_frequent).length;

    // Financial statistics
    const totalRevenue = guests.reduce((sum, guest) => sum + guest.paid_amount, 0);
    const pendingPayments = guests.reduce((sum, guest) => sum + guest.pending_amount, 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const netIncome = totalRevenue - totalExpenses;

    // Daily revenue (last 7 days)
    const dailyRevenue = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(today, i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      
      const dayGuests = guests.filter(guest => {
        const checkIn = new Date(guest.check_in);
        return isAfter(checkIn, dayStart) && isBefore(checkIn, dayEnd);
      });
      
      const revenue = dayGuests.reduce((sum, guest) => sum + guest.paid_amount, 0);
      
      return {
        date: format(date, 'MMM dd'),
        revenue,
      };
    }).reverse();

    // Monthly revenue (last 30 days)
    const monthlyGuests = guests.filter(guest => {
      const checkIn = new Date(guest.check_in);
      return isAfter(checkIn, last30Days);
    });
    const monthlyRevenue = monthlyGuests.reduce((sum, guest) => sum + guest.paid_amount, 0);

    return {
      rooms: { available: availableRooms, occupied: occupiedRooms, maintenance: maintenanceRooms, occupancyRate },
      guests: { total: totalGuests, current: currentGuests, frequent: frequentGuests },
      finance: { totalRevenue, pendingPayments, totalExpenses, netIncome, monthlyRevenue },
      trends: { dailyRevenue },
    };
  }, [rooms, guests, expenses, roomsLoading, guestsLoading, expensesLoading]);

  if (roomsLoading || guestsLoading || expensesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold neon-text">Analytics Dashboard</h1>
        <div className="text-sm text-muted-foreground">
          Real-time data
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="glass-card text-center">
          <div className="text-2xl font-bold text-blue-400">{rooms.length}</div>
          <div className="text-muted-foreground text-sm">Total Rooms</div>
        </div>
        <div className="glass-card text-center">
          <div className="text-2xl font-bold text-green-400">{analytics.guests.current}</div>
          <div className="text-muted-foreground text-sm">Current Guests</div>
        </div>
        <div className="glass-card text-center">
          <div className="text-2xl font-bold text-purple-400">
            {analytics.rooms.occupancyRate.toFixed(1)}%
          </div>
          <div className="text-muted-foreground text-sm">Occupancy Rate</div>
        </div>
        <div className="glass-card text-center">
          <div className="text-2xl font-bold text-yellow-400">₹{analytics.finance.netIncome.toLocaleString()}</div>
          <div className="text-muted-foreground text-sm">Net Income</div>
        </div>
      </div>

      {/* Room Status */}
      <div className="glass-card mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Home className="w-5 h-5 mr-2" />
          Room Status
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-xl font-bold text-green-400">{analytics.rooms.available}</div>
            <div className="text-sm text-muted-foreground">Available</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-yellow-400">{analytics.rooms.occupied}</div>
            <div className="text-sm text-muted-foreground">Occupied</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-red-400">{analytics.rooms.maintenance}</div>
            <div className="text-sm text-muted-foreground">Maintenance</div>
          </div>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="glass-card mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <DollarSign className="w-5 h-5 mr-2" />
          Financial Overview
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Revenue:</span>
              <span className="font-medium text-green-400">₹{analytics.finance.totalRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Expenses:</span>
              <span className="font-medium text-red-400">₹{analytics.finance.totalExpenses.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t border-gray-600 pt-3">
              <span className="text-muted-foreground">Net Income:</span>
              <span className={`font-bold ${analytics.finance.netIncome >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ₹{analytics.finance.netIncome.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monthly Revenue:</span>
              <span className="font-medium text-blue-400">₹{analytics.finance.monthlyRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pending Payments:</span>
              <span className="font-medium text-yellow-400">₹{analytics.finance.pendingPayments.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Guest Analytics */}
      <div className="glass-card mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2" />
          Guest Analytics
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-xl font-bold text-blue-400">{analytics.guests.total}</div>
            <div className="text-sm text-muted-foreground">Total Guests</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-green-400">{analytics.guests.current}</div>
            <div className="text-sm text-muted-foreground">Current</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-purple-400">{analytics.guests.frequent}</div>
            <div className="text-sm text-muted-foreground">Frequent</div>
          </div>
        </div>
      </div>

      {/* Daily Revenue Trend */}
      <div className="glass-card">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          Daily Revenue (Last 7 Days)
        </h2>
        <div className="space-y-2">
          {analytics.trends.dailyRevenue.map((day) => (
            <div key={day.date} className="flex items-center justify-between p-2 glass rounded">
              <span className="text-sm">{day.date}</span>
              <span className="font-medium text-green-400">₹{day.revenue.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      {analytics.finance.pendingPayments > 0 && (
        <div className="glass-card mt-6 border-yellow-400/30">
          <div className="flex items-center text-yellow-400">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span className="font-medium">
              You have ₹{analytics.finance.pendingPayments.toLocaleString()} in pending payments
            </span>
          </div>
        </div>
      )}
    </div>
  );
};