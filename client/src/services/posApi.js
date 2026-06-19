import api from './api';

export const posApi = {
    // Submit a new sale/checkout
    submitSale: (saleData) => api.post('/sales', saleData),
    
    // Get sales history or recent invoices
    getSales: () => api.get('/sales'),
    
    // Get specific invoice details by ID
    getInvoice: (id) => api.get(`/sales/${id}`)
};
