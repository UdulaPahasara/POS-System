import api from './api';

export const productsApi = {
    getAllProducts: async (branchId) => {
        const response = await api.get('/products' + (branchId ? `?branchId=${branchId}` : ''));
        return response;
    },
    getProductById: async (id) => {
        const response = await api.get(`/products/${id}`);
        return response;
    },
    createProduct: async (productData, branchId) => {
        const response = await api.post('/products' + (branchId ? `?branchId=${branchId}` : ''), productData);
        return response;
    },
    updateProduct: async (id, productData, branchId) => {
        const response = await api.put(`/products/${id}` + (branchId ? `?branchId=${branchId}` : ''), productData);
        return response;
    },
    deleteProduct: async (id, branchId) => {
        const url = `/products/${id}` + (branchId ? `?branchId=${branchId}` : '');
        const response = await api.delete(url);
        return response;
    }
};
