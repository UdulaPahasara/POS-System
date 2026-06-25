import React, { useState, useRef, useEffect } from 'react';
import { 
    Box, Fab, Paper, Typography, IconButton, TextField, 
    Button, CircularProgress, Fade
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import { sendMessage } from '../../services/chatbotApi';

const ChatbotWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'model', parts: [{ text: "Hi there! I'm your POS Assistant. Ask me anything about today's sales, stock levels, or products!" }] }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        setInput('');
        
        const newHistory = [...messages, { role: 'user', parts: [{ text: userMsg }] }];
        setMessages(newHistory);
        setIsLoading(true);

        try {
            const reply = await sendMessage(userMsg, messages);
            setMessages([...newHistory, { role: 'model', parts: [{ text: reply }] }]);
        } catch (error) {
            setMessages([...newHistory, { role: 'model', parts: [{ text: 'Sorry, I encountered an error connecting to the server.' }] }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    // Only show if user is logged in
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return null;

    return (
        <>
            <Fade in={isOpen}>
                <Paper
                    elevation={6}
                    sx={{
                        position: 'fixed',
                        bottom: { xs: 0, sm: 80 },
                        right: { xs: 0, sm: 20 },
                        width: { xs: '100%', sm: 350 },
                        height: { xs: '100%', sm: 500 },
                        display: isOpen ? 'flex' : 'none',
                        flexDirection: 'column',
                        borderRadius: { xs: 0, sm: 3 },
                        overflow: 'hidden',
                        zIndex: 9999,
                        bgcolor: '#0f172a',
                        border: { xs: 'none', sm: '1px solid rgba(255, 255, 255, 0.1)' }
                    }}
                >
                    {/* Header */}
                    <Box sx={{ 
                        p: 2, 
                        bgcolor: '#1e293b', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <SmartToyIcon sx={{ color: '#3b82f6' }} />
                            <Typography variant="h6" sx={{ color: '#fff', fontSize: '1.1rem' }}>
                                POS Assistant
                            </Typography>
                        </Box>
                        <IconButton size="small" onClick={() => setIsOpen(false)} sx={{ color: '#94a3b8' }}>
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    {/* Chat Area */}
                    <Box sx={{ p: 2, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {messages.map((msg, idx) => (
                            <Box 
                                key={idx} 
                                sx={{ 
                                    display: 'flex', 
                                    gap: 1,
                                    alignItems: 'flex-start',
                                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    maxWidth: '85%'
                                }}
                            >
                                {msg.role === 'model' && (
                                    <Box sx={{ bgcolor: '#3b82f6', borderRadius: '50%', p: 0.5, display: 'flex', flexShrink: 0 }}>
                                        <SmartToyIcon sx={{ color: '#fff', fontSize: 16 }} />
                                    </Box>
                                )}
                                
                                <Box 
                                    sx={{ 
                                        bgcolor: msg.role === 'user' ? '#3b82f6' : '#1e293b',
                                        color: '#fff',
                                        p: 1.5,
                                        borderRadius: 2,
                                        borderTopRightRadius: msg.role === 'user' ? 0 : 8,
                                        borderTopLeftRadius: msg.role === 'model' ? 0 : 8,
                                        fontSize: '0.9rem',
                                        lineHeight: 1.5,
                                        '& strong': { color: '#60a5fa' } // Make bold text stand out
                                    }}
                                    dangerouslySetInnerHTML={{ 
                                        __html: msg.parts[0].text
                                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                            .replace(/^\* (.*$)/gim, '&bull; $1')
                                            .replace(/^- (.*$)/gim, '&bull; $1')
                                            .replace(/\n/g, '<br />') 
                                    }}
                                />

                                {msg.role === 'user' && (
                                    <Box sx={{ bgcolor: '#475569', borderRadius: '50%', p: 0.5, display: 'flex', flexShrink: 0 }}>
                                        <PersonIcon sx={{ color: '#fff', fontSize: 16 }} />
                                    </Box>
                                )}
                            </Box>
                        ))}
                        {isLoading && (
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', maxWidth: '85%' }}>
                                <Box sx={{ bgcolor: '#3b82f6', borderRadius: '50%', p: 0.5, display: 'flex' }}>
                                    <SmartToyIcon sx={{ color: '#fff', fontSize: 16 }} />
                                </Box>
                                <Box sx={{ bgcolor: '#1e293b', color: '#fff', p: 1.5, borderRadius: 2, borderTopLeftRadius: 0 }}>
                                    <CircularProgress size={16} sx={{ color: '#3b82f6' }} />
                                </Box>
                            </Box>
                        )}
                        <div ref={messagesEndRef} />
                    </Box>

                    {/* Input Area */}
                    <Box sx={{ p: 2, bgcolor: '#1e293b', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', gap: 1 }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Type a message..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={isLoading}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    color: '#fff',
                                    bgcolor: 'rgba(0,0,0,0.2)',
                                    borderRadius: 50,
                                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                                }
                            }}
                        />
                        <IconButton 
                            color="primary" 
                            onClick={handleSend} 
                            disabled={!input.trim() || isLoading}
                            sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)' }}
                        >
                            <SendIcon />
                        </IconButton>
                    </Box>
                </Paper>
            </Fade>

            {/* Floating Action Button */}
            {!isOpen && (
                <Fab 
                    color="primary" 
                    aria-label="chat" 
                    onClick={() => setIsOpen(true)}
                    sx={{
                        position: 'fixed',
                        bottom: 20,
                        right: 20,
                        zIndex: 9999,
                        boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)'
                    }}
                >
                    <ChatIcon />
                </Fab>
            )}
        </>
    );
};

export default ChatbotWidget;
