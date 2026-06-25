import api from './api';

export const usersApi = {
    getAllUsers: (branchId) => api.get('/users' + (branchId ? `?branchId=${branchId}` : '')),
    createUser: (userData) => api.post('/users', userData),
    updateUser: (id, userData) => api.put(`/users/${id}`, userData),
    deleteUser: (id) => api.delete(`/users/${id}`),
    getProfile: () => api.get('/users/profile'),
    updateProfile: (userData) => api.put('/users/profile', userData)
};
