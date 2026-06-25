import api from './api';

export const branchesApi = {
    getAllBranches: async () => {
        const response = await api.get('/branches');
        return response;
    },
    
    createBranch: async (branchData) => {
        const response = await api.post('/branches', branchData);
        return response;
    },
    
    updateBranch: async (id, branchData) => {
        const response = await api.put(`/branches/${id}`, branchData);
        return response;
    },
    
    deleteBranch: async (id) => {
        const response = await api.delete(`/branches/${id}`);
        return response;
    }
};
