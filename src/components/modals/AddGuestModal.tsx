import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGuests } from '@/hooks/useGuests';
import { useRooms } from '@/hooks/useRooms';

interface AddGuestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddGuestModal = ({ isOpen, onClose }: AddGuestModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    id_proof: '',
    room_id: '',
    check_in: new Date().toISOString().split('T')[0],
    total_amount: '',
    paid_amount: '',
  });

  const { addGuest } = useGuests();
  const { availableRooms } = useRooms();

  const pendingAmount = parseFloat(formData.total_amount || '0') - parseFloat(formData.paid_amount || '0');
  const selectedRoom = availableRooms.find(room => room.id === formData.room_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.id_proof || !formData.room_id) return;

    await addGuest.mutateAsync({
      name: formData.name,
      phone: formData.phone,
      id_proof: formData.id_proof,
      room_id: formData.room_id,
      room_number: selectedRoom?.room_number,
      check_in: formData.check_in,
      total_amount: parseFloat(formData.total_amount || '0'),
      paid_amount: parseFloat(formData.paid_amount || '0'),
      pending_amount: pendingAmount,
    });

    setFormData({
      name: '',
      phone: '',
      id_proof: '',
      room_id: '',
      check_in: new Date().toISOString().split('T')[0],
      total_amount: '',
      paid_amount: '',
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold neon-text">Add New Guest</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Guest Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter guest name"
              required
              className="glass"
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Enter phone number"
              required
              className="glass"
            />
          </div>

          <div>
            <Label htmlFor="id_proof">ID Proof</Label>
            <Input
              id="id_proof"
              value={formData.id_proof}
              onChange={(e) => setFormData({ ...formData, id_proof: e.target.value })}
              placeholder="Enter ID proof number"
              required
              className="glass"
            />
          </div>

          <div>
            <Label htmlFor="room">Select Room</Label>
            <Select value={formData.room_id} onValueChange={(value) => 
              setFormData({ ...formData, room_id: value })
            }>
              <SelectTrigger className="glass">
                <SelectValue placeholder="Choose available room" />
              </SelectTrigger>
              <SelectContent>
                {availableRooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    Room {room.room_number} ({room.room_type}) - ₹{room.price}/night
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="check_in">Check-in Date</Label>
            <Input
              id="check_in"
              type="date"
              value={formData.check_in}
              onChange={(e) => setFormData({ ...formData, check_in: e.target.value })}
              required
              className="glass"
            />
          </div>

          <div>
            <Label htmlFor="total_amount">Total Amount</Label>
            <Input
              id="total_amount"
              type="number"
              value={formData.total_amount}
              onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
              placeholder="Enter total amount"
              className="glass"
            />
          </div>

          <div>
            <Label htmlFor="paid_amount">Paid Amount</Label>
            <Input
              id="paid_amount"
              type="number"
              value={formData.paid_amount}
              onChange={(e) => setFormData({ ...formData, paid_amount: e.target.value })}
              placeholder="Enter paid amount"
              className="glass"
            />
          </div>

          {pendingAmount > 0 && (
            <div className="text-sm text-yellow-400">
              Pending Amount: ₹{pendingAmount.toFixed(2)}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={addGuest.isPending}
            >
              {addGuest.isPending ? 'Adding...' : 'Add Guest'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};