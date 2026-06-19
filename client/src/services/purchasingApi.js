import api from './api';

export const purchasingApi = {
    getPurchaseOrders: () => api.get('/purchase-orders'),
    createPurchaseOrder: (poData) => api.post('/purchase-orders', poData),
    updatePurchaseOrder: (id, poData) => api.put(`/purchase-orders/${id}`, poData),
    approvePurchaseOrder: (id) => api.put(`/purchase-orders/${id}/approve`),
    receivePurchaseOrder: (id) => api.put(`/purchase-orders/${id}/receive`),
    
    getPurchaseReturns: () => api.get('/purchase-returns'),
    createPurchaseReturn: (data) => api.post('/purchase-returns', data),
    updatePurchaseReturn: (id, data) => api.put(`/purchase-returns/${id}`, data),
    approvePurchaseReturn: (id) => api.put(`/purchase-returns/${id}/approve`),
    shipPurchaseReturn: (id) => api.put(`/purchase-returns/${id}/return`)
};
