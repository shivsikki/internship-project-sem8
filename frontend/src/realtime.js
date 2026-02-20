import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  if (socket) return socket;
  const base = window.location.origin.replace('3000', '5000');
  socket = io(base, {
    transports: ['websocket'],
  });
  return socket;
}

