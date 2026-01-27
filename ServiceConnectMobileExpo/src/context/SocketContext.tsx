// @ts-nocheck
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            // Connect to your server's Socket.io
            const newSocket = io('http://192.168.2.22:5000', {
                query: {
                    userId: user.id,
                },
            });

            newSocket.on('connect', () => {
                console.log('Socket connected!');
                setConnected(true);
            });

            newSocket.on('disconnect', () => {
                console.log('Socket disconnected!');
                setConnected(false);
            });

            newSocket.on('newMessage', (message) => {
                console.log('New message received:', message);
                // Handle new message - update chat state, show notification, etc.
            });

            newSocket.on('newService', (service) => {
                console.log('New service created:', service);
                // Handle new service - update service list
            });

            newSocket.on('serviceUpdate', (service) => {
                console.log('Service updated:', service);
                // Handle service update - update service details
            });

            newSocket.on('userOnline', (userId) => {
                console.log('User online:', userId);
                // Handle user online status
            });

            newSocket.on('userOffline', (userId) => {
                console.log('User offline:', userId);
                // Handle user offline status
            });

            setSocket(newSocket);

            return () => {
                newSocket.close();
            };
        } else {
            if (socket) {
                socket.close();
                setSocket(null);
                setConnected(false);
            }
        }
    }, [user]);

    const sendMessage = (message) => {
        if (socket && connected) {
            socket.emit('sendMessage', message);
        }
    };

    const joinRoom = (roomId) => {
        if (socket && connected) {
            socket.emit('joinRoom', roomId);
        }
    };

    const leaveRoom = (roomId) => {
        if (socket && connected) {
            socket.emit('leaveRoom', roomId);
        }
    };

    const value = {
        socket,
        connected,
        sendMessage,
        joinRoom,
        leaveRoom,
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};
