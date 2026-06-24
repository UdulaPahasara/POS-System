import React, { useState, useEffect } from 'react';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, 
    Button, Typography, Box, TextField, Switch, FormControlLabel, IconButton, Divider, InputAdornment
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';

const CheckoutDialog = ({ open, onClose, total, customer, onComplete }) => {
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [amountGiven, setAmountGiven] = useState('');
    const [change, setChange] = useState(0);
    const [usePoints, setUsePoints] = useState(false);
    const [pointsToRedeem, setPointsToRedeem] = useState(0);
    const [discountPercent, setDiscountPercent] = useState(0);

    useEffect(() => {
        if (open) {
            setPaymentMethod('Cash');
            setAmountGiven('');
            setChange(0);
            setUsePoints(false);
            setPointsToRedeem(0);
            setDiscountPercent(0);
        }
    }, [open]);

    // Calculate final total after order discount and points (1 point = 1 LKR discount)
    const orderDiscountAmount = total * ((parseFloat(discountPercent) || 0) / 100);
    const discountedTotal = Math.max(0, total - orderDiscountAmount);
    const finalTotal = Number(Math.max(0, discountedTotal - (usePoints ? pointsToRedeem : 0)).toFixed(2));

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
            const suggestedPoints = Math.min(customer.loyaltyPoints, Math.ceil(total));
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
            fullWidth
            maxWidth="sm"
            sx={{
                '& .MuiDialog-paper': {
                    bgcolor: '#0f172a',
                    color: '#fff',
                    borderRadius: 3,
                    minWidth: { xs: '90%', sm: '550px' },
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }
            }}
        >
            <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: 600, textAlign: 'center' }}>
                Complete Payment
            </DialogTitle>
            
            <DialogContent sx={{ pt: 3 }}>
                {/* Order Modifiers Grid */}
                <Box sx={{ display: 'grid', gridTemplateColumns: customer ? '1fr 1fr' : '1fr', gap: 2, mb: 3 }}>
                    
                    {customer && (
                        <Box sx={{ p: 2, bgcolor: 'rgba(245, 158, 11, 0.05)', borderRadius: 2, border: '1px solid rgba(245, 158, 11, 0.2)', display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                <Box>
                                    <Typography sx={{ color: '#f59e0b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.9rem' }}>
                                        <StarIcon fontSize="small" /> Loyalty
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                        Balance: <b>{customer.loyaltyPoints}</b>
                                    </Typography>
                                </Box>
                                <Switch 
                                    size="small"
                                    checked={usePoints} 
                                    onChange={(e) => setUsePoints(e.target.checked)}
                                    disabled={customer.loyaltyPoints <= 0}
                                    color="warning"
                                />
                            </Box>
                            {usePoints && (
                                <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 1, border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <IconButton size="small" onClick={() => setPointsToRedeem(prev => Math.max(0, prev - 1))} sx={{ color: '#fff', p: 0.5 }}>
                                            <RemoveIcon sx={{ fontSize: 16 }} />
                                        </IconButton>
                                        <Typography sx={{ color: '#fff', minWidth: '30px', textAlign: 'center', fontSize: '0.9rem' }}>{pointsToRedeem}</Typography>
                                        <IconButton size="small" onClick={() => setPointsToRedeem(prev => Math.min(customer.loyaltyPoints, prev + 1))} sx={{ color: '#fff', p: 0.5 }}>
                                            <AddIcon sx={{ fontSize: 16 }} />
                                        </IconButton>
                                    </Box>
                                    <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 600 }}>
                                        -LKR {(pointsToRedeem * 1).toFixed(2)}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    )}

                    {/* Special Discount Field */}
                    <Box sx={{ p: 2, bgcolor: 'rgba(59, 130, 246, 0.05)', borderRadius: 2, border: '1px solid rgba(59, 130, 246, 0.2)', display: 'flex', flexDirection: 'column' }}>
                        <Typography sx={{ color: '#60a5fa', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.9rem', mb: 2 }}>
                            <LocalOfferIcon fontSize="small" /> Discount
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 'auto' }}>
                            <TextField
                                size="small"
                                type="number"
                                placeholder="0"
                                value={discountPercent === 0 ? '' : discountPercent}
                                onChange={(e) => setDiscountPercent(Math.max(0, Math.min(100, e.target.value)))}
                                InputProps={{
                                    endAdornment: <InputAdornment position="end"><Typography sx={{ color: '#94a3b8' }}>%</Typography></InputAdornment>,
                                }}
                                sx={{ 
                                    width: '100px', 
                                    '& .MuiOutlinedInput-root': {
                                        color: '#fff',
                                        bgcolor: 'rgba(0,0,0,0.2)',
                                        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                                        '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                                        '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                                    }
                                }}
                            />
                            {orderDiscountAmount > 0 && (
                                <Typography sx={{ color: '#10b981', fontWeight: 600, fontSize: '0.9rem' }}>
                                    -LKR {orderDiscountAmount.toFixed(2)}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                </Box>

                {/* Order Summary Breakdown */}
                <Box sx={{ bgcolor: '#1e293b', borderRadius: 2, p: 2, mb: 3, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography sx={{ color: '#94a3b8', fontSize: '0.9rem' }}>Subtotal + Tax</Typography>
                        <Typography sx={{ color: '#fff', fontSize: '0.9rem' }}>LKR {total.toFixed(2)}</Typography>
                    </Box>
                    
                    {orderDiscountAmount > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography sx={{ color: '#10b981', fontSize: '0.9rem' }}>Order Discount ({discountPercent}%)</Typography>
                            <Typography sx={{ color: '#10b981', fontSize: '0.9rem' }}>- LKR {orderDiscountAmount.toFixed(2)}</Typography>
                        </Box>
                    )}
                    
                    {usePoints && pointsToRedeem > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography sx={{ color: '#f59e0b', fontSize: '0.9rem' }}>Points Redeemed ({pointsToRedeem})</Typography>
                            <Typography sx={{ color: '#f59e0b', fontSize: '0.9rem' }}>- LKR {(pointsToRedeem * 1).toFixed(2)}</Typography>
                        </Box>
                    )}

                    <Divider sx={{ my: 1.5, borderColor: 'rgba(255,255,255,0.1)', borderStyle: 'dashed' }} />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700 }}>Total Due</Typography>
                        <Typography variant="h4" sx={{ color: '#3b82f6', fontWeight: 800 }}>
                            LKR {finalTotal.toFixed(2)}
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, mb: 4, bgcolor: 'rgba(0,0,0,0.2)', p: 0.5, borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <Button
                        variant={paymentMethod === 'Cash' ? 'contained' : 'text'}
                        onClick={() => setPaymentMethod('Cash')}
                        disableElevation
                        sx={{ 
                            flex: 1, 
                            py: 1,
                            borderRadius: 1.5,
                            bgcolor: paymentMethod === 'Cash' ? '#3b82f6' : 'transparent',
                            color: paymentMethod === 'Cash' ? '#fff' : '#94a3b8',
                            fontWeight: 700,
                            '&:hover': { bgcolor: paymentMethod === 'Cash' ? '#2563eb' : 'rgba(255,255,255,0.05)' }
                        }}
                    >
                        CASH
                    </Button>
                    <Button
                        variant={paymentMethod === 'Card' ? 'contained' : 'text'}
                        onClick={() => setPaymentMethod('Card')}
                        disableElevation
                        sx={{ 
                            flex: 1, 
                            py: 1,
                            borderRadius: 1.5,
                            bgcolor: paymentMethod === 'Card' ? '#3b82f6' : 'transparent',
                            color: paymentMethod === 'Card' ? '#fff' : '#94a3b8',
                            fontWeight: 700,
                            '&:hover': { bgcolor: paymentMethod === 'Card' ? '#2563eb' : 'rgba(255,255,255,0.05)' }
                        }}
                    >
                        CARD
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
                    onClick={() => onComplete({ 
                        paymentMethod, 
                        amountPaid: parseFloat(amountGiven) || finalTotal, 
                        pointsRedeemed: usePoints ? pointsToRedeem : 0,
                        orderDiscountPercent: parseFloat(discountPercent) || 0
                    })}
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
