import React, { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { Snackbar, Alert } from '@mui/material';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [socket, setSocket] = useState(null);
    const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            if (!token) return;

            const res = await fetch('http://localhost:5000/api/notifications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.isRead).length);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    useEffect(() => {
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (!userStr) return;
        const user = JSON.parse(userStr);

        fetchNotifications();

        const newSocket = io('http://localhost:5000');
        setSocket(newSocket);

        newSocket.emit('join_room', user.id || user._id);

        newSocket.on('new_notification', (notif) => {
            setNotifications(prev => [notif, ...prev]);
            setUnreadCount(prev => prev + 1);
            setToast({ open: true, message: notif.title + ': ' + notif.message, severity: notif.type === 'error' ? 'error' : 'info' });
        });

        return () => newSocket.close();
    }, []);

    const markAsRead = async (id) => {
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error(error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            await fetch('http://localhost:5000/api/notifications/read-all', {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCloseToast = () => setToast(prev => ({ ...prev, open: false }));

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, socket }}>
            {children}
            <Snackbar open={toast.open} autoHideDuration={6000} onClose={handleCloseToast} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
                <Alert onClose={handleCloseToast} severity={toast.severity} sx={{ width: '100%', borderRadius: 2 }}>
                    {toast.message}
                </Alert>
            </Snackbar>
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);
