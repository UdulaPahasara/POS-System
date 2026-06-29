import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Typography, 
    Paper, 
    Grid, 
    TextField, 
    Button, 
    Divider, 
    Alert,
    CircularProgress,
    Snackbar,
    Tabs,
    Tab,
    Fade
} from '@mui/material';
import { 
    Save as SaveIcon,
    Store as StoreIcon,
    Receipt as ReceiptIcon,
    AttachMoney as MoneyIcon,
    Settings as SettingsIcon,
    AccountBalance as TaxIcon
} from '@mui/icons-material';
import { settingsApi } from '../../../services/settingsApi';

const SettingsLayout = () => {
    const [settings, setSettings] = useState({
        storeName: '',
        storeAddress: '',
        storePhone: '',
        storeEmail: '',
        currencySymbol: '',
        defaultTaxRate: 0,
        receiptMessage: '',
        pointsPerSpend: 1000,
        pointsRedemptionRate: 1
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const data = await settingsApi.getSettings();
            setSettings({
                storeName: data.storeName || '',
                storeAddress: data.storeAddress || '',
                storePhone: data.storePhone || '',
                storeEmail: data.storeEmail || '',
                currencySymbol: data.currencySymbol || 'Rs.',
                defaultTaxRate: data.defaultTaxRate || 0,
                receiptMessage: data.receiptMessage || '',
                pointsPerSpend: data.pointsPerSpend || 1000,
                pointsRedemptionRate: data.pointsRedemptionRate || 1
            });
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError('Could not load configuration from server.');
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccessMsg('');

        try {
            await settingsApi.updateSettings(settings);
            setSuccessMsg('System configuration updated successfully!');
            setSaving(false);
        } catch (err) {
            console.error(err);
            setError('Failed to save settings.');
            setSaving(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: (name === 'defaultTaxRate' || name === 'pointsPerSpend' || name === 'pointsRedemptionRate') ? Number(value) : value
        }));
    };

    if (loading) return <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress sx={{ color: '#60a5fa' }} /></Box>;

    return (
        <Box sx={{ fontFamily: 'Poppins, sans-serif', pb: 4 }}>
            <Box sx={{ 
                mb: 4, 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between', 
                alignItems: { xs: 'flex-end', sm: 'flex-start' },
                gap: { xs: 2, sm: 0 }
            }}>
                <Box sx={{ width: '100%' }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#fff', mb: 1 }}>System Settings</Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>Configure your global store preferences and defaults.</Typography>
                </Box>
                <Button 
                    variant="contained" 
                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    onClick={handleSave}
                    disabled={saving}
                    sx={{ 
                        bgcolor: '#3b82f6', 
                        textTransform: 'none', 
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        '&:hover': { bgcolor: '#2563eb' }
                    }}
                >
                    Save Changes
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

            <Grid container spacing={3} sx={{
                animation: `slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.1s both`,
                '@keyframes slideUp': {
                    '0%': { opacity: 0, transform: 'translateY(30px)' },
                    '100%': { opacity: 1, transform: 'translateY(0)' }
                }
            }}>
                {/* Store Details Card */}
                <Grid item xs={12} md={6}>
                    <Fade in={true} timeout={500} style={{ transitionDelay: '0ms' }}>
                        <Paper sx={{ 
                            p: 4, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', height: '100%',
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 8px 25px -5px rgba(0,0,0,0.5)',
                                borderColor: 'rgba(255,255,255,0.1)'
                            }
                        }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1.5 }}>
                            <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa' }}>
                                <StoreIcon />
                            </Box>
                            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>Store Information</Typography>
                        </Box>
                        <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)', mb: 3 }} />
                        
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Store Name"
                                    name="storeName"
                                    value={settings.storeName}
                                    onChange={handleChange}
                                    sx={{ 
                                        '& .MuiInputBase-input': { color: '#fff' }, 
                                        '& .MuiInputLabel-root': { color: '#cbd5e1' },
                                        '& .MuiInputLabel-root.Mui-focused': { color: '#60a5fa' },
                                        '& .MuiOutlinedInput-root': { 
                                            '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                                            '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' }
                                        }
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Store Address"
                                    name="storeAddress"
                                    value={settings.storeAddress}
                                    onChange={handleChange}
                                    sx={{ 
                                        '& .MuiInputBase-input': { color: '#fff' }, 
                                        '& .MuiInputLabel-root': { color: '#cbd5e1' },
                                        '& .MuiInputLabel-root.Mui-focused': { color: '#60a5fa' },
                                        '& .MuiOutlinedInput-root': { 
                                            '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                                            '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' }
                                        }
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Phone Number"
                                    name="storePhone"
                                    value={settings.storePhone}
                                    onChange={handleChange}
                                    sx={{ 
                                        '& .MuiInputBase-input': { color: '#fff' }, 
                                        '& .MuiInputLabel-root': { color: '#cbd5e1' },
                                        '& .MuiInputLabel-root.Mui-focused': { color: '#60a5fa' },
                                        '& .MuiOutlinedInput-root': { 
                                            '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                                            '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' }
                                        }
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Email Address"
                                    name="storeEmail"
                                    value={settings.storeEmail}
                                    onChange={handleChange}
                                    sx={{ 
                                        '& .MuiInputBase-input': { color: '#fff' }, 
                                        '& .MuiInputLabel-root': { color: '#cbd5e1' },
                                        '& .MuiInputLabel-root.Mui-focused': { color: '#60a5fa' },
                                        '& .MuiOutlinedInput-root': { 
                                            '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                                            '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' }
                                        }
                                    }}
                                />
                            </Grid>
                        </Grid>
                        </Paper>
                    </Fade>
                </Grid>

                {/* Financial & Receipt Details */}
                <Grid item xs={12} md={6}>
                    <Grid container spacing={3}>
                        {/* Financial Settings */}
                        <Grid item xs={12}>
                            <Fade in={true} timeout={500} style={{ transitionDelay: '150ms' }}>
                                <Paper sx={{ 
                                    p: 4, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                                    transition: 'all 0.2s ease-in-out',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 8px 25px -5px rgba(0,0,0,0.5)',
                                        borderColor: 'rgba(255,255,255,0.1)'
                                    }
                                }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1.5 }}>
                                    <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#34d399' }}>
                                        <MoneyIcon />
                                    </Box>
                                    <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>Financial Defaults</Typography>
                                </Box>
                                <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)', mb: 3 }} />
                                
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Currency Symbol"
                                            name="currencySymbol"
                                            value={settings.currencySymbol}
                                            onChange={handleChange}
                                            sx={{ 
                                                '& .MuiInputBase-input': { color: '#fff' }, 
                                                '& .MuiInputLabel-root': { color: '#cbd5e1' },
                                                '& .MuiInputLabel-root.Mui-focused': { color: '#60a5fa' },
                                                '& .MuiOutlinedInput-root': { 
                                                    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                                                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' }
                                                }
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Default Tax Rate (%)"
                                            name="defaultTaxRate"
                                            value={settings.defaultTaxRate}
                                            onChange={handleChange}
                                            sx={{ 
                                                '& .MuiInputBase-input': { color: '#fff' }, 
                                                '& .MuiInputLabel-root': { color: '#cbd5e1' },
                                                '& .MuiInputLabel-root.Mui-focused': { color: '#60a5fa' },
                                                '& .MuiOutlinedInput-root': { 
                                                    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                                                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' }
                                                }
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Points Earned Per Spend (LKR)"
                                            name="pointsPerSpend"
                                            value={settings.pointsPerSpend}
                                            onChange={handleChange}
                                            sx={{ 
                                                '& .MuiInputBase-input': { color: '#fff' }, 
                                                '& .MuiInputLabel-root': { color: '#cbd5e1' },
                                                '& .MuiInputLabel-root.Mui-focused': { color: '#60a5fa' },
                                                '& .MuiOutlinedInput-root': { 
                                                    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                                                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' }
                                                }
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Points Redemption Value (LKR)"
                                            name="pointsRedemptionRate"
                                            value={settings.pointsRedemptionRate}
                                            onChange={handleChange}
                                            sx={{ 
                                                '& .MuiInputBase-input': { color: '#fff' }, 
                                                '& .MuiInputLabel-root': { color: '#cbd5e1' },
                                                '& .MuiInputLabel-root.Mui-focused': { color: '#60a5fa' },
                                                '& .MuiOutlinedInput-root': { 
                                                    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                                                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' }
                                                }
                                            }}
                                        />
                                    </Grid>
                                </Grid>
                                </Paper>
                            </Fade>
                        </Grid>

                        {/* Receipt Configuration */}
                        <Grid item xs={12}>
                            <Fade in={true} timeout={500} style={{ transitionDelay: '300ms' }}>
                                <Paper sx={{ 
                                    p: 4, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                                    transition: 'all 0.2s ease-in-out',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 8px 25px -5px rgba(0,0,0,0.5)',
                                        borderColor: 'rgba(255,255,255,0.1)'
                                    }
                                }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1.5 }}>
                                    <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa' }}>
                                        <ReceiptIcon />
                                    </Box>
                                    <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>Receipt Configuration</Typography>
                                </Box>
                                <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)', mb: 3 }} />
                                
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    label="Receipt Footer Message"
                                    name="receiptMessage"
                                    value={settings.receiptMessage}
                                    onChange={handleChange}
                                    sx={{ 
                                        '& .MuiInputBase-input': { color: '#fff' }, 
                                        '& .MuiInputLabel-root': { color: '#cbd5e1' },
                                        '& .MuiInputLabel-root.Mui-focused': { color: '#60a5fa' },
                                        '& .MuiOutlinedInput-root': { 
                                            '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                                            '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' }
                                        }
                                    }}
                                />
                                </Paper>
                            </Fade>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>

            {/* Success Snackbar */}
            <Snackbar
                open={!!successMsg}
                autoHideDuration={4000}
                onClose={() => setSuccessMsg('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSuccessMsg('')} severity="success" sx={{ width: '100%', borderRadius: 2 }}>
                    {successMsg}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default SettingsLayout;
