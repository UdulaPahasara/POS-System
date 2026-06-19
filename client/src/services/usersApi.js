import api from './api';

export const usersApi = {
    getAllUsers: () => api.get('/users'),
    createUser: (userData) => api.post('/users', userData),
    updateUser: (id, userData) => api.put(`/users/${id}`, userData),
    deleteUser: (id) => api.delete(`/users/${id}`)
};
