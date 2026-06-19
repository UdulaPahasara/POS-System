const BASE_URL = 'http://localhost:5000/api';

/**
 * A central wrapper around the native fetch API.
 * Automatically adds the Authorization token and handles JSON parsing.
 */
const apiFetch = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers,
    };

    // Remove Content-Type if body is FormData (browser will set it automatically with boundaries)
    if (options.body instanceof FormData) {
        delete headers['Content-Type'];
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, config);
        
        // Handle 204 No Content
        if (response.status === 204) {
            return null;
        }

        const data = await response.json().catch(() => null);

        if (!response.ok) {
            // Throw an error with the message from the server, or a fallback
            throw new Error(data?.message || data?.error || `API Error: ${response.status} ${response.statusText}`);
        }

        return data;
    } catch (error) {
        // Re-throw to be handled by the UI components
        throw error;
    }
};

export const api = {
    get: (endpoint, options) => apiFetch(endpoint, { ...options, method: 'GET' }),
    post: (endpoint, body, options) => apiFetch(endpoint, { ...options, method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }),
    put: (endpoint, body, options) => apiFetch(endpoint, { ...options, method: 'PUT', body: body instanceof FormData ? body : JSON.stringify(body) }),
    delete: (endpoint, options) => apiFetch(endpoint, { ...options, method: 'DELETE' }),
};

export default api;
