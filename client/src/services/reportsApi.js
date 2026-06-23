import api from './api';

export const reportsApi = {
    getDashboardStats: (paymentFilter = 'all') => api.get('/reports/dashboard', { params: { paymentFilter } }),
    getSalesReport: (filters) => api.get('/reports/sales/advanced', { params: filters }),
    getProductReport: (filters) => api.get('/reports/products', { params: filters }),
    getInventoryReport: (filters) => api.get('/reports/inventory', { params: filters }),
    getFinancialReport: (filters) => api.get('/reports/financial', { params: filters }),
    getCustomerReport: (filters) => api.get('/reports/customers', { params: filters })
};
