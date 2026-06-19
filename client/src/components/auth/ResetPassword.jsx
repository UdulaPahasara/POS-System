import React, { useState } from 'react';
import { 
    Box, 
    Typography, 
    TextField, 
    Button, 
    Paper, 
    InputAdornment, 
    IconButton,
    Alert,
    CircularProgress
} from '@mui/material';
import { 
    Lock as LockIcon, 
    Visibility, 
    VisibilityOff
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { authApi } from '../../services/authApi';

const ResetPassword = () => {
    const navigate = useNavigate();
    const { token } = useParams();

    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });

    const handleChange = (e) => {
        setFormData(prev => ({ 
            ...prev, 
            [e.target.name]: e.target.value 
        }));
        if (message.text) setMessage({ type: '', text: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.password || !formData.confirmPassword) {
            setMessage({ type: 'error', text: 'Please fill in all fields' });
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }

        const passwordRegex = /^.{8,}$/;
        if (!passwordRegex.test(formData.password)) {
            setMessage({ type: 'error', text: 'Password must be at least 8 characters long.' });
            return;
        }

        setIsLoading(true);

        try {
            await authApi.resetPassword(token, formData.password);
            setMessage({ type: 'success', text: 'Password reset successfully! Redirecting to login...' });
            
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setMessage({ type: 'error', text: err.message || 'Failed to reset password. The link might be expired.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleClickShowPassword = () => setShowPassword((show) => !show);

    return (
        <Box 
            sx={{
                minHeight: '100vh',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                fontFamily: 'Poppins, sans-serif',
                px: 2
            }}
        >
            <Paper 
                elevation={24}
                sx={{
                    width: '100%',
                    maxWidth: 420,
                    p: { xs: 4, md: 5 },
                    borderRadius: 4,
                    bgcolor: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    textAlign: 'center',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}
            >
                <Box sx={{ mb: 4 }}>
                    <Typography 
                        variant="h4" 
                        component="h1" 
                        sx={{ 
                            fontWeight: 800, 
                            mb: 1, 
                            fontFamily: 'Poppins, sans-serif',
                            background: 'linear-gradient(to right, #60a5fa, #3b82f6)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            letterSpacing: '-0.5px'
                        }}
                    >
                         RESET PASSWORD
                    </Typography>
                    <Typography 
                        variant="body2" 
                        sx={{ color: '#94a3b8', fontFamily: 'Poppins, sans-serif' }}
                    >
                        Enter your new password below.
                    </Typography>
                </Box>

                {message.text && (
                    <Alert severity={message.type} sx={{ mb: 3, borderRadius: 2, textAlign: 'left' }}>
                        {message.text}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                    <TextField
                        fullWidth
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="New Password"
                        variant="outlined"
                        value={formData.password}
                        onChange={handleChange}
                        sx={{
                            mb: 3,
                            '& .MuiOutlinedInput-root': {
                                color: '#fff',
                                bgcolor: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: 2,
                                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                                '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                            },
                            '& .MuiInputBase-input::placeholder': {
                                color: '#64748b',
                                opacity: 1,
                            }
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <LockIcon sx={{ color: '#64748b' }} />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={handleClickShowPassword}
                                        edge="end"
                                        sx={{ color: '#64748b' }}
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />

                    <TextField
                        fullWidth
                        name="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Confirm New Password"
                        variant="outlined"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        sx={{
                            mb: 4,
                            '& .MuiOutlinedInput-root': {
                                color: '#fff',
                                bgcolor: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: 2,
                                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                                '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                            },
                            '& .MuiInputBase-input::placeholder': {
                                color: '#64748b',
                                opacity: 1,
                            }
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <LockIcon sx={{ color: '#64748b' }} />
                                </InputAdornment>
                            )
                        }}
                    />

                    <Button
                        type="submit"
                        fullWidth
                        disabled={isLoading}
                        variant="contained"
                        sx={{
                            py: 1.5,
                            borderRadius: 2,
                            textTransform: 'none',
                            fontSize: '1rem',
                            fontWeight: 600,
                            fontFamily: 'Poppins, sans-serif',
                            bgcolor: '#3b82f6',
                            boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.39)',
                            '&:hover': {
                                bgcolor: '#2563eb',
                                boxShadow: '0 6px 20px rgba(59, 130, 246, 0.23)'
                            },
                            '&.Mui-disabled': {
                                bgcolor: 'rgba(59, 130, 246, 0.5)',
                                color: 'rgba(255,255,255,0.7)'
                            }
                        }}
                    >
                        {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Reset Password'}
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};

export default ResetPassword;
