import api from './api';

export const taxesApi = {
    // Get all taxes
    getAllTaxes: () => api.get('/taxes'),
    
    // Create a new tax
    createTax: (taxData) => api.post('/taxes', taxData),
    
    // Update an existing tax
    updateTax: (id, taxData) => api.put(`/taxes/${id}`, taxData),
    
    // Delete a tax
    deleteTax: (id) => api.delete(`/taxes/${id}`)
};
