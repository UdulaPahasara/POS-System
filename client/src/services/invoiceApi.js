import api from './api';

export const invoiceApi = {
    getAllInvoices: () => api.get('/invoices'),
    getInvoiceById: (id) => api.get(`/invoices/${id}`)
};
