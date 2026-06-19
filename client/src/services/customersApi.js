import api from './api';

export const customersApi = {
    getAllCustomers: (search = '') => api.get(`/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`),
    createCustomer: (customerData) => api.post('/customers', customerData),
    updateCustomer: (id, customerData) => api.put(`/customers/${id}`, customerData),
    deleteCustomer: (id) => api.delete(`/customers/${id}`)
};
