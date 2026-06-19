import React, { useState, useEffect } from 'react';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, 
    Button, Typography, Box, TextField, Switch, FormControlLabel, IconButton
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

const CheckoutDialog = ({ open, onClose, total, customer, onComplete }) => {
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [amountGiven, setAmountGiven] = useState('');
    const [change, setChange] = useState(0);
    const [usePoints, setUsePoints] = useState(false);
    const [pointsToRedeem, setPointsToRedeem] = useState(0);

    useEffect(() => {
        if (open) {
            setPaymentMethod('Cash');
            setAmountGiven('');
            setChange(0);
            setUsePoints(false);
            setPointsToRedeem(0);
        }
    }, [open]);

    // Calculate final total after points (1 point = 100 LKR discount)
    const finalTotal = Number(Math.max(0, total - (usePoints ? pointsToRedeem * 100 : 0)).toFixed(2));

    useEffect(() => {
        if (paymentMethod === 'Cash') {
            const given = parseFloat(amountGiven) || 0;
            setChange(given > finalTotal ? given - finalTotal : 0);
        } else {
            setAmountGiven(finalTotal.toFixed(2));
            setChange(0);
        }
    }, [amountGiven, paymentMethod, finalTotal]);

    useEffect(() => {
        if (usePoints && customer) {
            // By default try to redeem as much as possible to cover the total
            const suggestedPoints = Math.min(customer.loyaltyPoints, Math.ceil(total / 100));
            setPointsToRedeem(suggestedPoints);
        } else {
            setPointsToRedeem(0);
        }
    }, [usePoints, customer, total]);

    const isCompleteEnabled = finalTotal === 0 || paymentMethod === 'Card' || (parseFloat(amountGiven) >= Number(finalTotal.toFixed(2)));

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            sx={{
                '& .MuiDialog-paper': {
                    bgcolor: '#0f172a',
                    color: '#fff',
                    borderRadius: 3,
                    minWidth: '400px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }
            }}
        >
            <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: 600, textAlign: 'center' }}>
                Complete Payment
            </DialogTitle>
            
            <DialogContent sx={{ pt: 3 }}>
                {customer && (
                    <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(245, 158, 11, 0.1)', borderRadius: 2, border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                                <Typography sx={{ color: '#f59e0b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <StarIcon fontSize="small" /> Loyalty Program
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                                    Balance: <b>{customer.loyaltyPoints} Points</b>
                                </Typography>
                            </Box>
                            <FormControlLabel
                                control={
                                    <Switch 
                                        checked={usePoints} 
                                        onChange={(e) => setUsePoints(e.target.checked)}
                                        disabled={customer.loyaltyPoints <= 0}
                                        color="warning"
                                    />
                                }
                                label={<Typography variant="body2" sx={{ color: '#fff' }}>Redeem</Typography>}
                                labelPlacement="start"
                            />
                        </Box>
                        {usePoints && (
                            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 1, border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <IconButton 
                                        size="small" 
                                        onClick={() => {
                                            setPointsToRedeem(prev => Math.max(0, prev - 1));
                                        }}
                                        sx={{ color: '#fff' }}
                                    >
                                        <RemoveIcon fontSize="small" />
                                    </IconButton>
                                    <TextField
                                        size="small"
                                        type="number"
                                        value={pointsToRedeem}
                                        onChange={(e) => {
                                            let val = parseInt(e.target.value) || 0;
                                            val = Math.max(0, Math.min(val, customer.loyaltyPoints));
                                            setPointsToRedeem(val);
                                        }}
                                        sx={{ 
                                            width: '60px', 
                                            input: { 
                                                color: '#fff', textAlign: 'center', p: '8px',
                                                '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
                                                    display: 'none',
                                                    WebkitAppearance: 'none',
                                                    margin: 0
                                                },
                                                MozAppearance: 'textfield'
                                            }, 
                                            '& fieldset': { border: 'none' } 
                                        }}
                                    />
                                    <IconButton 
                                        size="small" 
                                        onClick={() => {
                                            setPointsToRedeem(prev => Math.min(customer.loyaltyPoints, prev + 1));
                                        }}
                                        sx={{ color: '#fff' }}
                                    >
                                        <AddIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                                <Typography variant="body2" sx={{ color: '#10b981' }}>
                                    - LKR {(pointsToRedeem * 100).toFixed(2)}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}

                <Typography variant="h3" sx={{ textAlign: 'center', color: '#60a5fa', fontWeight: 800, mb: 4 }}>
                    LKR {finalTotal.toFixed(2)}
                </Typography>

                {/* Payment Method Selector */}
                <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
                    <Button
                        variant={paymentMethod === 'Cash' ? 'contained' : 'outlined'}
                        onClick={() => setPaymentMethod('Cash')}
                        sx={{ 
                            flex: 1, 
                            py: 1.5,
                            bgcolor: paymentMethod === 'Cash' ? '#3b82f6' : 'transparent',
                            borderColor: paymentMethod === 'Cash' ? '#3b82f6' : 'rgba(255,255,255,0.2)',
                            color: '#fff',
                            '&:hover': { bgcolor: paymentMethod === 'Cash' ? '#2563eb' : 'rgba(255,255,255,0.05)' }
                        }}
                    >
                        Cash
                    </Button>
                    <Button
                        variant={paymentMethod === 'Card' ? 'contained' : 'outlined'}
                        onClick={() => setPaymentMethod('Card')}
                        sx={{ 
                            flex: 1, 
                            py: 1.5,
                            bgcolor: paymentMethod === 'Card' ? '#3b82f6' : 'transparent',
                            borderColor: paymentMethod === 'Card' ? '#3b82f6' : 'rgba(255,255,255,0.2)',
                            color: '#fff',
                            '&:hover': { bgcolor: paymentMethod === 'Card' ? '#2563eb' : 'rgba(255,255,255,0.05)' }
                        }}
                    >
                        Card
                    </Button>
                </Box>

                {/* Cash Calculator */}
                {paymentMethod === 'Cash' && (
                    <Box sx={{ bgcolor: 'rgba(255,255,255,0.02)', p: 2, borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
                        <TextField
                            fullWidth
                            label="Amount Received (LKR)"
                            type="number"
                            value={amountGiven}
                            onChange={(e) => setAmountGiven(e.target.value)}
                            sx={{
                                mb: 2,
                                '& .MuiOutlinedInput-root': {
                                    color: '#fff',
                                    fontSize: '1.2rem',
                                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                                    '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                                        WebkitAppearance: 'none',
                                        margin: 0
                                    },
                                    '& input[type=number]': {
                                        MozAppearance: 'textfield'
                                    }
                                },
                                '& .MuiInputLabel-root': { color: '#94a3b8' },
                                '& .MuiInputLabel-root.Mui-focused': { color: '#3b82f6' },
                            }}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography sx={{ color: '#94a3b8', fontSize: '1.1rem' }}>Change Due:</Typography>
                            <Typography sx={{ color: change > 0 ? '#10b981' : '#fff', fontSize: '1.5rem', fontWeight: 700 }}>
                                LKR {change.toFixed(2)}
                            </Typography>
                        </Box>
                    </Box>
                )}

                {paymentMethod === 'Card' && (
                    <Box sx={{ textAlign: 'center', py: 3, color: '#94a3b8' }}>
                        <Typography>Please process LKR <b>{finalTotal.toFixed(2)}</b> on the card terminal.</Typography>
                    </Box>
                )}

            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 0 }}>
                <Button onClick={onClose} sx={{ color: '#94a3b8', textTransform: 'none', fontSize: '1.1rem', mr: 2 }}>
                    Cancel
                </Button>
                <Button 
                    variant="contained" 
                    disabled={!isCompleteEnabled}
                    onClick={() => onComplete({ paymentMethod, amountPaid: parseFloat(amountGiven) || finalTotal, pointsRedeemed: usePoints ? pointsToRedeem : 0 })}
                    sx={{ 
                        flex: 1, 
                        py: 1.5,
                        bgcolor: '#10b981', 
                        '&:hover': { bgcolor: '#059669' }, 
                        textTransform: 'none', 
                        fontSize: '1.2rem', 
                        fontWeight: 700,
                        '&.Mui-disabled': {
                            bgcolor: 'rgba(16, 185, 129, 0.2)',
                            color: 'rgba(255,255,255,0.3)'
                        }
                    }}
                >
                    Complete Sale
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CheckoutDialog;
