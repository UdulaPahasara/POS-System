import api from './api';

export const inventoryApi = {
    // Basic inventory fetch
    getInventory: () => api.get('/inventory'),
    
    // Adjust stock manually
    adjustStock: (productId, adjustmentData) => api.put(`/products/${productId}/stock`, adjustmentData),
    
    // Get inventory history/logs
    getHistory: async (branchId) => {
        const url = branchId ? `/inventory/logs?branchId=${branchId}` : '/inventory/logs';
        const response = await api.get(url);
        return response;
    }
};
