import { io } from 'socket.io-client';

// Tera backend jahan chal raha hai (Render ya localhost)
const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

class SocketService {
    socket = null;

    connect() {
        if (!this.socket) {
            this.socket = io(SOCKET_URL, {
                transports: ['websocket'],
                autoConnect: true,
            });
            this.socket.on('connect', () => console.log('⚡ Web Socket Connected:', this.socket.id));
        }
    }

    joinBusRoom(vehicleId) {
        if (this.socket) {
            this.socket.emit('join_bus_room', vehicleId);
        }
    }

    onReceiveLocation(callback) {
        if (this.socket) {
            this.socket.on('receive_location', callback);
        }
    }

    offReceiveLocation() {
        if (this.socket) {
            this.socket.off('receive_location');
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export default new SocketService();