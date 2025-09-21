import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRooms, type Room } from '@/hooks/useRooms';
import { useToast } from '@/hooks/use-toast';

const roomSchema = z.object({
  room_number: z.string().min(1, 'Room number is required'),
  room_type: z.enum(['AC', 'Non-AC'], { required_error: 'Room type is required' }),
  status: z.enum(['Available', 'Occupied', 'Maintenance'], { required_error: 'Status is required' }),
  price: z.string().min(1, 'Price is required'),
});

type RoomFormData = z.infer<typeof roomSchema>;

interface EditRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
}

export const EditRoomModal = ({ isOpen, onClose, room }: EditRoomModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateRoom } = useRooms();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
  });

  const watchRoomType = watch('room_type');
  const watchStatus = watch('status');

  useEffect(() => {
    if (room && isOpen) {
      setValue('room_number', room.room_number);
      setValue('room_type', room.room_type);
      setValue('status', room.status);
      setValue('price', room.price.toString());
    } else {
      reset();
    }
  }, [room, isOpen, setValue, reset]);

  const onSubmit = async (data: RoomFormData) => {
    if (!room) return;
    
    try {
      setIsSubmitting(true);
      
      await updateRoom.mutateAsync({
        id: room.id,
        room_number: data.room_number,
        room_type: data.room_type,
        status: data.status,
        price: parseFloat(data.price),
      });

      onClose();
      reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update room",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass-card border-0">
        <DialogHeader>
          <DialogTitle className="neon-text">Edit Room</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="room_number">Room Number</Label>
            <Input
              id="room_number"
              {...register('room_number')}
              placeholder="Enter room number"
              className="glass"
            />
            {errors.room_number && (
              <p className="text-sm text-red-400">{errors.room_number.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="room_type">Room Type</Label>
            <Select value={watchRoomType} onValueChange={(value: 'AC' | 'Non-AC') => setValue('room_type', value)}>
              <SelectTrigger className="glass">
                <SelectValue placeholder="Choose room type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AC">AC Room</SelectItem>
                <SelectItem value="Non-AC">Non-AC Room</SelectItem>
              </SelectContent>
            </Select>
            {errors.room_type && (
              <p className="text-sm text-red-400">{errors.room_type.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={watchStatus} onValueChange={(value: 'Available' | 'Occupied' | 'Maintenance') => setValue('status', value)}>
              <SelectTrigger className="glass">
                <SelectValue placeholder="Choose status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Available">Available</SelectItem>
                <SelectItem value="Occupied">Occupied</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-red-400">{errors.status.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price per Night (₹)</Label>
            <Input
              id="price"
              type="number"
              {...register('price')}
              placeholder="Enter price per night"
              className="glass"
            />
            {errors.price && (
              <p className="text-sm text-red-400">{errors.price.message}</p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Updating...' : 'Update Room'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};