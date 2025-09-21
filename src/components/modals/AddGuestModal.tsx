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
    id_proof_type: '',
    room_id: '',
    check_in: new Date().toISOString().split('T')[0],
    check_out: '',
    total_amount: '',
    paid_amount: '',
    payment_mode: '',
  });

const ID_PROOF_TYPES = [
  'Aadhar Card',
  'PAN Card', 
  'Passport',
  'Driving License',
  'Voter ID',
  'Other'
];

const PAYMENT_MODES = [
  'Cash',
  'Online'
];

  const { addGuest } = useGuests();
  const { availableRooms } = useRooms();

  const pendingAmount = parseFloat(formData.total_amount || '0') - parseFloat(formData.paid_amount || '0');
  const selectedRoom = availableRooms.find(room => room.id === formData.room_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.id_proof || !formData.id_proof_type || !formData.room_id) return;

    const guestData: any = {
      name: formData.name,
      phone: formData.phone,
      id_proof: `${formData.id_proof_type}: ${formData.id_proof}`,
      room_id: formData.room_id,
      room_number: selectedRoom?.room_number,
      check_in: formData.check_in,
      total_amount: parseFloat(formData.total_amount || '0'),
      paid_amount: parseFloat(formData.paid_amount || '0'),
      pending_amount: pendingAmount,
      payment_mode: formData.payment_mode,
    };

    if (formData.check_out) {
      guestData.check_out = formData.check_out;
    }

    await addGuest.mutateAsync(guestData);

    setFormData({
      name: '',
      phone: '',
      id_proof: '',
      id_proof_type: '',
      room_id: '',
      check_in: new Date().toISOString().split('T')[0],
      check_out: '',
      total_amount: '',
      paid_amount: '',
      payment_mode: '',
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
            <Label htmlFor="id_proof_type">ID Proof Type</Label>
            <Select 
              value={formData.id_proof_type} 
              onValueChange={(value) => setFormData({ ...formData, id_proof_type: value })}
            >
              <SelectTrigger className="glass">
                <SelectValue placeholder="Select ID proof type" />
              </SelectTrigger>
              <SelectContent>
                {ID_PROOF_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="id_proof">ID Proof Number</Label>
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

          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="check_out">Check-out Date (Optional)</Label>
              <Input
                id="check_out"
                type="date"
                value={formData.check_out}
                onChange={(e) => setFormData({ ...formData, check_out: e.target.value })}
                className="glass"
              />
            </div>
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

          <div>
            <Label htmlFor="payment_mode">Payment Mode</Label>
            <Select 
              value={formData.payment_mode} 
              onValueChange={(value) => setFormData({ ...formData, payment_mode: value })}
            >
              <SelectTrigger className="glass">
                <SelectValue placeholder="Select payment mode" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_MODES.map((mode) => (
                  <SelectItem key={mode} value={mode}>
                    {mode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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