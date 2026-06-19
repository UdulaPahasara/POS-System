import api from './api';

export const settingsApi = {
    getSettings: () => api.get('/settings'),
    updateSettings: (settingsData) => api.put('/settings', settingsData)
};
