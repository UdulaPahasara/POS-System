import api from './api';

export const productsApi = {
    getAllProducts: () => api.get('/products'),
    getProductById: (id) => api.get(`/products/${id}`),
    
    // Product creation typically handles FormData for image uploads
    createProduct: (productData) => api.post('/products', productData),
    updateProduct: (id, productData) => api.put(`/products/${id}`, productData),
    deleteProduct: (id) => api.delete(`/products/${id}`)
};
