import { useState } from 'react';
import { Plus, Search, Edit, Trash2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGuests } from '@/hooks/useGuests';
import { AddGuestModal } from '@/components/modals/AddGuestModal';
import { format } from 'date-fns';

export const GuestsTab = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { guests, isLoading, deleteGuest, searchGuests } = useGuests();

  const filteredGuests = searchGuests(searchQuery);

  const handleDeleteGuest = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this guest?')) {
      await deleteGuest.mutateAsync(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading guests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold neon-text">Guests Management</h1>
        <div className="text-sm text-muted-foreground">
          Total: {guests.length} guests
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search by name, phone, ID proof, or room number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 glass"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredGuests.map((guest) => (
          <div key={guest.id} className="glass-card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold">{guest.name}</h3>
                  {guest.is_frequent && (
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Phone: </span>
                    <span>{guest.phone}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">ID Proof: </span>
                    <span>{guest.id_proof}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Room: </span>
                    <span>{guest.room_number || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Check-in: </span>
                    <span>{format(new Date(guest.check_in), 'MMM dd, yyyy')}</span>
                  </div>
                </div>

                <div className="mt-3 p-3 glass rounded-lg">
                  <div className="text-sm font-medium mb-1">Payment Info</div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total: </span>
                      <span className="text-blue-400">₹{guest.total_amount}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Paid: </span>
                      <span className="text-green-400">₹{guest.paid_amount}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Pending: </span>
                      <span className={guest.pending_amount > 0 ? "text-red-400" : "text-green-400"}>
                        ₹{guest.pending_amount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-1 ml-4">
                <Button variant="ghost" size="icon" className="w-8 h-8">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-8 h-8 text-red-400 hover:text-red-300"
                  onClick={() => handleDeleteGuest(guest.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredGuests.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            {searchQuery ? 'No guests found matching your search' : 'No guests added yet'}
          </p>
          {!searchQuery && (
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Guest
            </Button>
          )}
        </div>
      )}

      <div className="floating-button" onClick={() => setShowAddModal(true)}>
        <Plus className="w-6 h-6" />
      </div>

      <AddGuestModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
      />
    </div>
  );
};