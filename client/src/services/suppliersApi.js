import api from './api';

export const suppliersApi = {
    getAllSuppliers: () => api.get('/suppliers'),
    createSupplier: (supplierData) => api.post('/suppliers', supplierData),
    updateSupplier: (id, supplierData) => api.put(`/suppliers/${id}`, supplierData),
    deleteSupplier: (id) => api.delete(`/suppliers/${id}`),
    getSupplierHistory: (id) => api.get(`/suppliers/${id}/history`)
};
