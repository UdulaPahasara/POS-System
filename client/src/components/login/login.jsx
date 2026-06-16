import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Typography, 
    TextField, 
    Button, 
    Paper, 
    InputAdornment, 
    IconButton,
    Link,
    Divider,
    MenuItem,
    Alert,
    Collapse,
    Checkbox,
    FormControlLabel
} from '@mui/material';
import { 
    Email as EmailIcon, 
    Lock as LockIcon, 
    Visibility, 
    VisibilityOff,
    Badge as BadgeIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const navigate = useNavigate();

    // Check if user is already logged in!
    useEffect(() => {
        const existingToken = localStorage.getItem('token') || sessionStorage.getItem('token');
        const userString = localStorage.getItem('user') || sessionStorage.getItem('user');
        
        if (existingToken && userString) {
            try {
                const user = JSON.parse(userString);
                const roleObj = user.role;
                const roleName = roleObj && typeof roleObj === 'object' ? roleObj.roleName : roleObj;
                
                if (!roleName) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    sessionStorage.removeItem('token');
                    sessionStorage.removeItem('user');
                    return;
                }

                if (roleName === 'Admin') {
                    navigate('/admin/dashboard');
                } else if (roleName === 'Manager') {
                    navigate('/manager/dashboard');
                } else if (roleName === 'Inventory Staff') {
                    navigate('/inventory-staff/inventory-dashboard');
                } else {
                    navigate('/pos');
                }
            } catch (e) {
                // If parse fails, stay on login
            }
        }
    }, [navigate]);

    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        rememberMe: false
    });


    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : value 
        }));
        // Clear error when user starts typing again
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Form Validation
        if (!formData.username.trim() || !formData.password.trim()) {
            setError('Please enter both your email and password.');
            return;
        }

        // Email format validation (checking for @ and a domain like .com)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.username) || !formData.username.includes('.com')) {
            setError('Please enter a valid email address containing "@" and ".com".');
            return;
        }

        // Password validation (at least 8 characters)
        const passwordRegex = /^.{8,}$/;
        if (!passwordRegex.test(formData.password)) {
            setError('Password must be at least 8 characters long.');
            return;
        }

        setIsLoading(true);

        try {
            // Call our new backend API!
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.username,
                    password: formData.password,
                    rememberMe: formData.rememberMe
                })
            });

            const data = await response.json();

            if (!response.ok) {
                // If the backend returns a 401 Unauthorized, show the error
                throw new Error(data.message || 'Login failed');
            }

            // SUCCESS! 
            // If "Remember Me" is checked, save to localStorage (persists after browser closes).
            // If not, save to sessionStorage (wiped when tab/browser closes).
            const storage = formData.rememberMe ? localStorage : sessionStorage;
            
            // Clear any old data from both storages just to be safe
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');

            storage.setItem('token', data.token);
            storage.setItem('user', JSON.stringify(data.user));

            console.log("Logged in successfully!", data.user);
            
            // Route based on role
            const roleObj = data.user.role;
            const roleName = roleObj && typeof roleObj === 'object' ? roleObj.roleName : roleObj;
            
            if (!roleName) {
                setError('Invalid user role assigned. Please contact administrator.');
                setIsLoading(false);
                return;
            }

            if (roleName === 'Admin') {
                navigate('/admin/dashboard'); 
            } else if (roleName === 'Manager') {
                navigate('/manager/dashboard');
            } else if (roleName === 'Inventory Staff') {
                navigate('/inventory-staff/inventory-dashboard');
            } else {
                navigate('/pos');
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClickShowPassword = () => setShowPassword((show) => !show);
    const handleMouseDownPassword = (event) => event.preventDefault();

    return (
        <Box 
            sx={{
                minHeight: '100vh',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', // Premium dark slate gradient
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
                {/* Logo / Branding Placeholder */}
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
                         POINT OF SALE SYSTEM
                    </Typography>
                    <Typography 
                        variant="body2" 
                        sx={{ color: '#94a3b8', fontFamily: 'Poppins, sans-serif' }}
                    >
                        Welcome back! Please enter your details.
                    </Typography>
                </Box>

                <Collapse in={!!error}>
                    <Alert severity="error" sx={{ mb: 3, borderRadius: 2, textAlign: 'left' }}>
                        {error}
                    </Alert>
                </Collapse>

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                    <TextField
                        fullWidth
                        name="username"
                        placeholder="Email Address"
                        variant="outlined"
                        value={formData.username}
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
                                    <EmailIcon sx={{ color: '#64748b' }} />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <TextField
                        fullWidth
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        variant="outlined"
                        value={formData.password}
                        onChange={handleChange}
                        sx={{
                            mb: 1,
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
                                        onMouseDown={handleMouseDownPassword}
                                        edge="end"
                                        sx={{ color: '#64748b' }}
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, mt: 1 }}>
                        <FormControlLabel
                            control={
                                <Checkbox 
                                    name="rememberMe"
                                    checked={formData.rememberMe}
                                    onChange={handleChange}
                                    sx={{ 
                                        color: '#64748b', 
                                        '&.Mui-checked': { color: '#3b82f6' } 
                                    }} 
                                />
                            }
                            label={<Typography variant="body2" sx={{ color: '#94a3b8' }}>Remember me</Typography>}
                        />
                        <Link 
                            component="button"
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                console.log("Forgot password clicked");
                            }}
                            underline="hover" 
                            sx={{ 
                                color: '#3b82f6', 
                                fontSize: '0.85rem', 
                                fontFamily: 'Poppins, sans-serif',
                                fontWeight: 500 
                            }}
                        >
                            Forgot password?
                        </Link>
                    </Box>

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
                        {isLoading ? 'Logging in...' : 'Login'}
                    </Button>
                </Box>

                <Box sx={{ mt: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Divider sx={{ flexGrow: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                    <Typography variant="body2" sx={{ color: '#64748b', fontFamily: 'Poppins, sans-serif' }}>
                        Internal Access Only
                    </Typography>
                    <Divider sx={{ flexGrow: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                </Box>
            </Paper>
        </Box>
    );
};

export default Login;
