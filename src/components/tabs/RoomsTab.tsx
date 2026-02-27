import { useState } from 'react';
import { Plus, Edit, Trash2, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useRooms, type Room } from '@/hooks/useRooms';
import { AddRoomModal } from '@/components/modals/AddRoomModal';
import { EditRoomModal } from '@/components/modals/EditRoomModal';
import { FloatingActionButton } from '@/components/FloatingActionButton';

export const RoomsTab = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const { rooms, isLoading, error, deleteRoom, refetch } = useRooms();

  const handleEditRoom = (room: Room) => {
    setSelectedRoom(room);
    setShowEditModal(true);
  };

  const handleDeleteRoom = (roomId: string) => {
    deleteRoom.mutate(roomId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'text-green-400 border-green-400/30 bg-green-400/10';
      case 'Occupied':
        return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
      case 'Maintenance':
        return 'text-red-400 border-red-400/30 bg-red-400/10';
      default:
        return 'text-gray-400 border-gray-400/30 bg-gray-400/10';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading rooms...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isNetworkError = errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError');
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center max-w-sm">
          <WifiOff className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive font-semibold mb-2">
            {isNetworkError ? 'Network Error' : 'Failed to Load Rooms'}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            {isNetworkError
              ? 'Unable to connect to the server. Please check your internet connection and try again.'
              : errorMessage}
          </p>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold neon-text">Rooms Management</h1>
        <div className="text-sm text-muted-foreground">
          Total: {rooms.length} rooms
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((room) => (
          <div key={room.id} className="glass-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Room {room.room_number}</h3>
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-8 h-8"
                  onClick={() => handleEditRoom(room)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="w-8 h-8 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="glass-card border-0">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="neon-text">Delete Room</AlertDialogTitle>
                      <AlertDialogDescription className="text-muted-foreground">
                        Are you sure you want to delete Room {room.room_number}? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleDeleteRoom(room.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium">{room.room_type}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price:</span>
                <span className="font-medium">₹{room.price}/night</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(room.status)}`}>
                  {room.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {rooms.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No rooms added yet</p>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Room
          </Button>
        </div>
      )}

      <FloatingActionButton ariaLabel="Add room" onClick={() => setShowAddModal(true)}>
        <Plus className="w-6 h-6" />
      </FloatingActionButton>

      <AddRoomModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
      />
      
      <EditRoomModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedRoom(null);
        }}
        room={selectedRoom}
      />
    </div>
  );
};