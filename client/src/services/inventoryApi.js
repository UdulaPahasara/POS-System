import api from './api';

export const inventoryApi = {
    // Basic inventory fetch
    getInventory: () => api.get('/inventory'),
    
    // Adjust stock manually
    adjustStock: (productId, adjustmentData) => api.put(`/products/${productId}/stock`, adjustmentData),
    
    // Get inventory history/logs
    getHistory: () => api.get('/inventory/logs')
};
