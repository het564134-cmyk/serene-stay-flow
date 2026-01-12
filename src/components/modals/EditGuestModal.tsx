import { useState, useEffect } from 'react';
import { X, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGuests, Guest } from '@/hooks/useGuests';
import { useRooms } from '@/hooks/useRooms';

interface EditGuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  guest: Guest | null;
}

const ID_PROOF_TYPES = [
  'Aadhar Card',
  'PAN Card',
  'Passport',
  'Driving License',
  'Voter ID',
  'Other'
];

const PAYMENT_MODES = ['Cash', 'Online'];

export const EditGuestModal = ({ isOpen, onClose, guest }: EditGuestModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    id_proof: '',
    id_proof_type: '',
    room_id: '',
    check_in: '',
    check_out: '',
    total_amount: '',
    paid_amount: '',
    payment_mode: '',
    pay_to_whom: '',
  });

  const { updateGuest } = useGuests();
  const { availableRooms, rooms } = useRooms();

  useEffect(() => {
    if (guest) {
      // Split id_proof into type and number
      const idProofParts = guest.id_proof.split(':');
      const idProofType = idProofParts[0]?.trim() || '';
      const idProofNumber = idProofParts[1]?.trim() || guest.id_proof;
      
      setFormData({
        name: guest.name,
        phone: guest.phone,
        id_proof: idProofNumber,
        id_proof_type: idProofType,
        room_id: guest.room_id || 'no-room',
        check_in: guest.check_in,
        check_out: guest.check_out || '',
        total_amount: guest.total_amount.toString(),
        paid_amount: guest.paid_amount.toString(),
        payment_mode: guest.payment_mode || '',
        pay_to_whom: guest.pay_to_whom || '',
      });
    }
  }, [guest]);

  const pendingAmount = parseFloat(formData.total_amount || '0') - parseFloat(formData.paid_amount || '0');
  const allRooms = [...availableRooms, ...rooms.filter(r => r.id === guest?.room_id)];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guest) return;

    const updates: any = {
      id: guest.id,
      name: formData.name,
      phone: formData.phone,
      id_proof: `${formData.id_proof_type}: ${formData.id_proof}`,
      room_id: formData.room_id === 'no-room' ? null : formData.room_id || null,
      room_number: formData.room_id === 'no-room' ? null : allRooms.find(r => r.id === formData.room_id)?.room_number || null,
      check_in: formData.check_in,
      total_amount: parseFloat(formData.total_amount || '0'),
      paid_amount: parseFloat(formData.paid_amount || '0'),
      pending_amount: pendingAmount,
      payment_mode: formData.payment_mode || null,
      pay_to_whom: formData.payment_mode === 'Online' ? formData.pay_to_whom : null,
    };

    if (formData.check_out) {
      updates.check_out = formData.check_out;
    }

    await updateGuest.mutateAsync(updates);
    onClose();
  };

  const handleCheckOut = async () => {
    if (!guest) return;
    
    const checkOutDate = new Date().toISOString().split('T')[0];
    
    await updateGuest.mutateAsync({
      id: guest.id,
      check_out: checkOutDate,
      room_id: null,
      room_number: null,
    });
    
    onClose();
  };

  if (!isOpen || !guest) return null;

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
      <div className="min-h-full w-full p-4 pb-8">
        <div className="w-full max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6 sticky top-0 bg-background z-10 py-4 -mx-4 px-4">
            <h2 className="text-xl font-semibold neon-text">Edit Guest</h2>
            <Button variant="ghost" size="icon" onClick={onClose} className="min-w-[44px] min-h-[44px]">
              <X className="w-6 h-6" />
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
                  <SelectValue placeholder="Choose room" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-room">No Room (Checked Out)</SelectItem>
                  {allRooms.map((room) => (
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
                <Label htmlFor="check_out">Check-out Date</Label>
                <Input
                  id="check_out"
                  type="date"
                  value={formData.check_out}
                  onChange={(e) => setFormData({ ...formData, check_out: e.target.value })}
                  className="glass"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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

            {formData.payment_mode === 'Online' && (
              <div>
                <Label htmlFor="pay_to_whom">Pay To (Account Holder Name)</Label>
                <Input
                  id="pay_to_whom"
                  value={formData.pay_to_whom}
                  onChange={(e) => setFormData({ ...formData, pay_to_whom: e.target.value })}
                  placeholder="Enter account holder name"
                  className="glass"
                />
              </div>
            )}

            {pendingAmount > 0 && (
              <div className="text-sm text-yellow-400">
                Pending Amount: ₹{pendingAmount.toFixed(2)}
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              {!guest.check_out && (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleCheckOut}
                  className="flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Check Out
                </Button>
              )}
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={updateGuest.isPending}
              >
                {updateGuest.isPending ? 'Updating...' : 'Update Guest'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
