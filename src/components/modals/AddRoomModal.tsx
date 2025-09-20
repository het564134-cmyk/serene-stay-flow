import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRooms } from '@/hooks/useRooms';

interface AddRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddRoomModal = ({ isOpen, onClose }: AddRoomModalProps) => {
  const [formData, setFormData] = useState({
    room_number: '',
    room_type: 'AC' as 'AC' | 'Non-AC',
    price: '',
  });

  const { addRoom } = useRooms();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.room_number || !formData.price) return;

    await addRoom.mutateAsync({
      room_number: formData.room_number,
      room_type: formData.room_type,
      status: 'Available',
      price: parseFloat(formData.price),
    });

    setFormData({ room_number: '', room_type: 'AC', price: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold neon-text">Add New Room</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="room_number">Room Number</Label>
            <Input
              id="room_number"
              value={formData.room_number}
              onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
              placeholder="e.g., 101"
              required
              className="glass"
            />
          </div>

          <div>
            <Label htmlFor="room_type">Room Type</Label>
            <Select value={formData.room_type} onValueChange={(value: 'AC' | 'Non-AC') => 
              setFormData({ ...formData, room_type: value })
            }>
              <SelectTrigger className="glass">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AC">AC</SelectItem>
                <SelectItem value="Non-AC">Non-AC</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="price">Price per Night</Label>
            <Input
              id="price"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="e.g., 500"
              required
              className="glass"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={addRoom.isPending}
            >
              {addRoom.isPending ? 'Adding...' : 'Add Room'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};