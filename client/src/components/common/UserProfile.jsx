import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Paper, TextField, Button, Grid, Avatar, 
    Divider, CircularProgress, Alert, Snackbar, InputAdornment, IconButton
} from '@mui/material';
import { Visibility, VisibilityOff, Save, LockReset, PhotoCamera } from '@mui/icons-material';
import { usersApi } from '../../services/usersApi';

// Import Role Icons
import adminIcon from '../../assets/MesageIcon/Admin.webp';
import managerIcon from '../../assets/MesageIcon/manager.webp';
import staffIcon from '../../assets/MesageIcon/staff.webp';

const UserProfile = () => {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [user, setUser] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phone: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    
    const [profilePicFile, setProfilePicFile] = useState(null);
    const [profilePicPreview, setProfilePicPreview] = useState(null);
    
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const data = await usersApi.getProfile();
            if (data) {
                setUser(data);
                setFormData(prev => ({
                    ...prev,
                    username: data.username || '',
                    email: data.email || '',
                    phone: data.phone || ''
                }));
            }
        } catch (error) {
            console.error("Error fetching profile", error);
            setSnackbar({ open: true, message: 'Failed to load profile data', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfilePicFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePicPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.newPassword) {
            if (formData.newPassword !== formData.confirmPassword) {
                setSnackbar({ open: true, message: 'New passwords do not match', severity: 'warning' });
                return;
            }
            if (!formData.currentPassword) {
                setSnackbar({ open: true, message: 'Current password is required to set a new password', severity: 'warning' });
                return;
            }
        }

        try {
            setSubmitting(true);
            
            let updatePayload;
            if (profilePicFile) {
                updatePayload = new FormData();
                updatePayload.append('username', formData.username);
                updatePayload.append('email', formData.email);
                updatePayload.append('phone', formData.phone);
                
                if (formData.newPassword) {
                    updatePayload.append('password', formData.newPassword);
                    updatePayload.append('currentPassword', formData.currentPassword);
                }
                
                updatePayload.append('profilePic', profilePicFile);
            } else {
                updatePayload = {
                    username: formData.username,
                    email: formData.email,
                    phone: formData.phone,
                };

                if (formData.newPassword) {
                    updatePayload.password = formData.newPassword;
                    updatePayload.currentPassword = formData.currentPassword;
                }
            }

            const updatedUser = await usersApi.updateProfile(updatePayload);
            
            setUser(updatedUser);
            // Update local storage so the header updates instantly
            localStorage.setItem('user', JSON.stringify(updatedUser));

            setSnackbar({ open: true, message: 'Profile updated successfully!', severity: 'success' });
            
            // Clear password fields
            setFormData(prev => ({
                ...prev,
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            }));
            
            // Refresh page to sync sidebar/header if needed
            setTimeout(() => window.location.reload(), 1000);

        } catch (error) {
            console.error("Error updating profile", error);
            setSnackbar({ open: true, message: error.response?.data?.message || error.message || 'Error updating profile', severity: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const getRoleIcon = (roleName) => {
        switch (roleName) {
            case 'Admin': return adminIcon;
            case 'Manager': return managerIcon;
            case 'Inventory Staff': return staffIcon;
            default: return null;
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#0f172a' }}>
                <CircularProgress sx={{ color: '#3b82f6' }} />
            </Box>
        );
    }

    const roleName = user?.role?.roleName || user?.role || 'User';

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#0f172a', minHeight: '100vh' }}>
            <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700, mb: 4 }}>
                My Profile
            </Typography>

            <Grid container spacing={4}>
                {/* Left side: Profile Summary */}
                <Grid item xs={12} md={4}>
                    <Paper 
                        elevation={0}
                        sx={{ 
                            p: 4, 
                            bgcolor: '#1e293b', 
                            borderRadius: 3,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}
                    >
                        <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                            <Avatar 
                                sx={{ 
                                    width: 120, 
                                    height: 120, 
                                    bgcolor: '#3b82f6',
                                    fontSize: '3rem',
                                    border: '4px solid rgba(59, 130, 246, 0.2)'
                                }}
                                src={profilePicPreview || (user?.profilePic ? `http://localhost:5000${user.profilePic}` : '')}
                            >
                                {(!profilePicPreview && !user?.profilePic) && (
                                    getRoleIcon(roleName) ? (
                                        <img src={getRoleIcon(roleName)} alt={roleName} style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                                    ) : (
                                        user?.username ? user.username.charAt(0).toUpperCase() : 'U'
                                    )
                                )}
                            </Avatar>
                            
                            <input
                                accept="image/*"
                                style={{ display: 'none' }}
                                id="profile-pic-upload"
                                type="file"
                                onChange={handleFileChange}
                            />
                            <label htmlFor="profile-pic-upload">
                                <IconButton 
                                    color="primary" 
                                    aria-label="upload picture" 
                                    component="span"
                                    sx={{ 
                                        position: 'absolute', 
                                        bottom: 0, 
                                        right: 0, 
                                        bgcolor: '#1e293b', 
                                        border: '2px solid rgba(59, 130, 246, 0.5)',
                                        '&:hover': { bgcolor: '#3b82f6', color: '#fff' }
                                    }}
                                >
                                    <PhotoCamera fontSize="small" />
                                </IconButton>
                            </label>
                        </Box>
                        
                        <Typography variant="h5" sx={{ color: '#fff', fontWeight: 600, mb: 0.5 }}>
                            {user?.username}
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#94a3b8', mb: 2 }}>
                            {user?.email}
                        </Typography>
                        
                        <Box sx={{ 
                            px: 2, 
                            py: 0.5, 
                            bgcolor: 'rgba(59, 130, 246, 0.1)', 
                            color: '#3b82f6', 
                            borderRadius: 2,
                            fontWeight: 600,
                            display: 'inline-block'
                        }}>
                            {roleName}
                        </Box>

                        <Divider sx={{ width: '100%', my: 3, borderColor: 'rgba(255,255,255,0.05)' }} />
                        
                        <Box sx={{ width: '100%' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                                <Typography variant="body2" sx={{ color: '#94a3b8' }}>Status</Typography>
                                <Typography variant="body2" sx={{ color: user?.status === 'Active' ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                                    {user?.status}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                                <Typography variant="body2" sx={{ color: '#94a3b8' }}>Member Since</Typography>
                                <Typography variant="body2" sx={{ color: '#fff', fontWeight: 500 }}>
                                    {new Date(user?.createdAt).toLocaleDateString()}
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>

                {/* Right side: Edit Form */}
                <Grid item xs={12} md={8}>
                    <Paper 
                        elevation={0}
                        sx={{ 
                            p: { xs: 3, md: 5 }, 
                            bgcolor: '#1e293b', 
                            borderRadius: 3,
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}
                    >
                        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 3 }}>
                            Personal Information
                        </Typography>
                        
                        <form onSubmit={handleSubmit}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Username"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        required
                                        sx={{ 
                                            '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' } },
                                            '& .MuiInputLabel-root': { color: '#94a3b8' }
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Email Address"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                        sx={{ 
                                            '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' } },
                                            '& .MuiInputLabel-root': { color: '#94a3b8' }
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Phone Number"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        sx={{ 
                                            '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' } },
                                            '& .MuiInputLabel-root': { color: '#94a3b8' }
                                        }}
                                    />
                                </Grid>

                                {/* Password Section */}
                                <Grid item xs={12}>
                                    <Box sx={{ mt: 2, p: 3, bgcolor: 'rgba(0,0,0,0.15)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <LockReset sx={{ color: '#3b82f6' }} /> Change Password
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
                                            Leave these fields blank if you do not wish to change your password.
                                        </Typography>
                                        
                                        <Grid container spacing={3}>
                                            <Grid item xs={12}>
                                                <TextField
                                                    fullWidth
                                                    label="Current Password"
                                                    name="currentPassword"
                                                    type={showPasswords.current ? 'text' : 'password'}
                                                    value={formData.currentPassword}
                                                    onChange={handleInputChange}
                                                    variant="outlined"
                                                    sx={{ 
                                                        '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' } },
                                                        '& .MuiInputLabel-root': { color: '#94a3b8' }
                                                    }}
                                                    slotProps={{
                                                        input: {
                                                            endAdornment: (
                                                                <InputAdornment position="end">
                                                                    <IconButton 
                                                                        onClick={() => togglePasswordVisibility('current')} 
                                                                        onMouseDown={(e) => e.preventDefault()}
                                                                        edge="end" 
                                                                        sx={{ color: '#94a3b8' }}
                                                                    >
                                                                        {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                                                                    </IconButton>
                                                                </InputAdornment>
                                                            )
                                                        }
                                                    }}
                                                />
                                            </Grid>
            
                                            <Grid item xs={12} sm={6}>
                                                <TextField
                                                    fullWidth
                                                    label="New Password"
                                                    name="newPassword"
                                                    type={showPasswords.new ? 'text' : 'password'}
                                                    value={formData.newPassword}
                                                    onChange={handleInputChange}
                                                    variant="outlined"
                                                    sx={{ 
                                                        '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' } },
                                                        '& .MuiInputLabel-root': { color: '#94a3b8' }
                                                    }}
                                                    slotProps={{
                                                        input: {
                                                            endAdornment: (
                                                                <InputAdornment position="end">
                                                                    <IconButton 
                                                                        onClick={() => togglePasswordVisibility('new')} 
                                                                        onMouseDown={(e) => e.preventDefault()}
                                                                        edge="end" 
                                                                        sx={{ color: '#94a3b8' }}
                                                                    >
                                                                        {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                                                                    </IconButton>
                                                                </InputAdornment>
                                                            )
                                                        }
                                                    }}
                                                />
                                            </Grid>
            
                                            <Grid item xs={12} sm={6}>
                                                <TextField
                                                    fullWidth
                                                    label="Confirm New Password"
                                                    name="confirmPassword"
                                                    type={showPasswords.confirm ? 'text' : 'password'}
                                                    value={formData.confirmPassword}
                                                    onChange={handleInputChange}
                                                    variant="outlined"
                                                    sx={{ 
                                                        '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' } },
                                                        '& .MuiInputLabel-root': { color: '#94a3b8' }
                                                    }}
                                                    slotProps={{
                                                        input: {
                                                            endAdornment: (
                                                                <InputAdornment position="end">
                                                                    <IconButton 
                                                                        onClick={() => togglePasswordVisibility('confirm')} 
                                                                        onMouseDown={(e) => e.preventDefault()}
                                                                        edge="end" 
                                                                        sx={{ color: '#94a3b8' }}
                                                                    >
                                                                        {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                                                                    </IconButton>
                                                                </InputAdornment>
                                                            )
                                                        }
                                                    }}
                                                />
                                            </Grid>
                                        </Grid>
                                    </Box>
                                </Grid>

                                <Grid item xs={12}>
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                        <Button 
                                            type="submit" 
                                            variant="contained" 
                                            disabled={submitting}
                                            startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <Save />}
                                            sx={{ 
                                                bgcolor: '#3b82f6', 
                                                '&:hover': { bgcolor: '#2563eb' },
                                                px: 4,
                                                py: 1.5,
                                                fontWeight: 600,
                                                textTransform: 'none',
                                                borderRadius: 2
                                            }}
                                        >
                                            Save Changes
                                        </Button>
                                    </Box>
                                </Grid>
                            </Grid>
                        </form>
                    </Paper>
                </Grid>
            </Grid>

            <Snackbar 
                open={snackbar.open} 
                autoHideDuration={6000} 
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default UserProfile;
