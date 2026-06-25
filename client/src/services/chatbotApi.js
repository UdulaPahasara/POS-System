import api from './api';

export const sendMessage = async (message, history = []) => {
    try {
        const data = await api.post('/chat', { message, history });
        return data.reply;
    } catch (error) {
        console.error('Error sending message to chatbot:', error);
        throw error;
    }
};
