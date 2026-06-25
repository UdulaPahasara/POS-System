import api from './api';

export const invoiceApi = {
    getAllInvoices: (branchId) => {
        const url = branchId ? `/invoices?branchId=${branchId}` : '/invoices';
        return api.get(url);
    },
    getInvoiceById: (id) => api.get(`/invoices/${id}`)
};
