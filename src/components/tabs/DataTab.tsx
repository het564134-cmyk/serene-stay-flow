import { useState, useMemo } from 'react';
import { Calendar, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useGuests } from '@/hooks/useGuests';
import { format, startOfMonth, endOfMonth, isSameDay, parseISO } from 'date-fns';

export const DataTab = () => {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [openDates, setOpenDates] = useState<Set<string>>(new Set());
  const { guests, isLoading, error } = useGuests();

  const toggleDate = (date: string) => {
    const newOpenDates = new Set(openDates);
    if (newOpenDates.has(date)) {
      newOpenDates.delete(date);
    } else {
      newOpenDates.add(date);
    }
    setOpenDates(newOpenDates);
  };

  // Get unique months that have data
  const availableMonths = useMemo(() => {
    if (!guests.length) return [];
    
    const months = new Set<string>();
    guests.forEach(guest => {
      const checkInDate = parseISO(guest.check_in);
      months.add(format(checkInDate, 'yyyy-MM'));
    });
    
    return Array.from(months).sort().reverse();
  }, [guests]);

  const monthlyData = useMemo(() => {
    if (!guests.length) return {};

    const monthStart = startOfMonth(new Date(selectedMonth + '-01'));
    const monthEnd = endOfMonth(new Date(selectedMonth + '-01'));

    const filteredGuests = guests.filter(guest => {
      const checkInDate = parseISO(guest.check_in);
      return checkInDate >= monthStart && checkInDate <= monthEnd;
    });

    const dailyData: { [key: string]: any } = {};

    filteredGuests.forEach(guest => {
      const dateKey = format(parseISO(guest.check_in), 'yyyy-MM-dd');
      
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = {
          date: dateKey,
          guests: [],
          totalReceived: 0,
          totalPending: 0,
        };
      }

      dailyData[dateKey].guests.push(guest);
      dailyData[dateKey].totalReceived += guest.paid_amount;
      dailyData[dateKey].totalPending += guest.pending_amount;
    });

    return dailyData;
  }, [guests, selectedMonth]);

  const sortedDates = Object.keys(monthlyData).sort().reverse();

  const monthTotals = useMemo(() => {
    return sortedDates.reduce(
      (acc, date) => {
        acc.received += monthlyData[date].totalReceived;
        acc.pending += monthlyData[date].totalPending;
        acc.guests += monthlyData[date].guests.length;
        return acc;
      },
      { received: 0, pending: 0, guests: 0 }
    );
  }, [monthlyData, sortedDates]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Calendar className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-2">Failed to load data</p>
          <p className="text-sm text-muted-foreground">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold neon-text">Data Overview</h1>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-48 glass">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableMonths.length > 0 ? (
              availableMonths.map((month) => {
                const label = format(new Date(month + '-01'), 'MMMM yyyy');
                return (
                  <SelectItem key={month} value={month}>
                    {label}
                  </SelectItem>
                );
              })
            ) : (
              <SelectItem value="no-data" disabled>
                No data available
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Monthly Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="glass-card text-center">
          <div className="text-2xl font-bold text-blue-400">{monthTotals.guests}</div>
          <div className="text-muted-foreground">Total Guests</div>
        </div>
        <div className="glass-card text-center">
          <div className="text-2xl font-bold text-green-400">₹{monthTotals.received.toLocaleString()}</div>
          <div className="text-muted-foreground">Money Received</div>
        </div>
        <div className="glass-card text-center">
          <div className="text-2xl font-bold text-red-400">₹{monthTotals.pending.toLocaleString()}</div>
          <div className="text-muted-foreground">Pending Dues</div>
        </div>
      </div>

      {/* Daily Breakdown */}
      <div className="space-y-4">
        {sortedDates.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No data available for {format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}</p>
          </div>
        ) : (
          sortedDates.map(date => {
            const dayData = monthlyData[date];
            const isOpen = openDates.has(date);
            const dayName = format(new Date(date), 'EEEE');
            const dateDisplay = format(new Date(date), 'MMMM dd, yyyy');
            
            return (
              <Collapsible key={date} open={isOpen} onOpenChange={() => toggleDate(date)}>
                <div className="glass-card">
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between p-1 hover:bg-white/5 rounded transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {isOpen ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                          <div className="text-left">
                            <h3 className="text-lg font-semibold">{dayName}</h3>
                            <p className="text-sm text-muted-foreground">{dateDisplay}</p>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {dayData.guests.length} guest{dayData.guests.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <span className="text-green-400">
                          <DollarSign className="w-4 h-4 inline mr-1" />
                          ₹{dayData.totalReceived.toLocaleString()}
                        </span>
                        {dayData.totalPending > 0 && (
                          <span className="text-red-400">
                            Pending: ₹{dayData.totalPending.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="mt-4">
                    <div className="space-y-2">
                      {dayData.guests.map((guest: any) => (
                        <div key={guest.id} className="flex items-center justify-between p-3 glass rounded-lg">
                          <div>
                            <div className="font-medium">{guest.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {guest.room_number ? `Room ${guest.room_number}` : 'No Room'} • {guest.phone}
                            </div>
                          </div>
                          <div className="text-right text-sm">
                            <div className="text-green-400">Paid: ₹{guest.paid_amount.toLocaleString()}</div>
                            {guest.pending_amount > 0 && (
                              <div className="text-red-400">Pending: ₹{guest.pending_amount.toLocaleString()}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })
        )}
      </div>
    </div>
  );
};