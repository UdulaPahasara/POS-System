import api from './api';

export const categoriesApi = {
    getAllCategories: () => api.get('/categories'),
    createCategory: (categoryData) => api.post('/categories', categoryData),
    updateCategory: (id, categoryData) => api.put(`/categories/${id}`, categoryData),
    deleteCategory: (id) => api.delete(`/categories/${id}`)
};
