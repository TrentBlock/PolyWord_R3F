import io from 'socket.io-client';
import { useState, useEffect } from 'react';

// Use window.location.origin in production to connect to the backend serving the React build.
const backendUrl = process.env.NODE_ENV === 'production' ? window.location.origin : 'http://localhost:3001';
const socket = io(backendUrl, { path: '/socket' });

function SocketConnection() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [lastPong, setLastPong] = useState(null);
  useEffect(() => {
    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('pong', () => {
      setLastPong(new Date().toISOString());
      console.log("pong!");
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('pong');
    };
  }, []);

  const sendPing = () => {
    socket.emit('ping');
  }
//   return <div style={{position:"absolute", left:"50%",top:"10%"}} onClick={()=>sendPing()}>SEND</div>;
return null;
}

export {SocketConnection, socket}