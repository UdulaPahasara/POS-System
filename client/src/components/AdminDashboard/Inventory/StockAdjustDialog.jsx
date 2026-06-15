import React, { useState } from 'react';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, 
    Button, TextField, MenuItem, Typography, Box 
} from '@mui/material';

const StockAdjustDialog = ({ open, handleClose, product }) => {
    const [action, setAction] = useState('Add');
    const [quantity, setQuantity] = useState('');
    const [reason, setReason] = useState('');

    const handleSubmit = async () => {
        if (!quantity || quantity <= 0) {
            alert('Please enter a valid quantity');
            return;
        }

        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/products/${product._id}/stock`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action,
                    quantity: Number(quantity),
                    reason
                })
            });

            if (response.ok) {
                // Reset form and close dialog, tell parent to refresh
                setAction('Add');
                setQuantity('');
                setReason('');
                handleClose(true); // true means refresh needed
            } else {
                const resData = await response.json();
                alert(resData.message || 'Error adjusting stock');
            }
        } catch (error) {
            console.error('Error adjusting stock:', error);
            alert('Server error while adjusting stock');
        }
    };

    if (!product) return null;

    return (
        <Dialog 
            open={open} 
            onClose={() => handleClose(false)}
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
            <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: 600 }}>
                Adjust Stock: {product.name}
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>Current Stock</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#60a5fa' }}>{product.stock}</Typography>
                </Box>

                <TextField
                    select
                    fullWidth
                    label="Action"
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                    sx={inputStyles}
                    margin="normal"
                >
                    <MenuItem value="Add">Add Stock (Receive Shipment)</MenuItem>
                    <MenuItem value="Subtract">Subtract Stock (Damage/Loss)</MenuItem>
                    <MenuItem value="Set">Set Exact Stock (Recount)</MenuItem>
                </TextField>

                <TextField
                    fullWidth
                    label="Quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    sx={inputStyles}
                    margin="normal"
                    InputProps={{ inputProps: { min: 1 } }}
                />

                <TextField
                    fullWidth
                    label="Reason / Notes"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    sx={inputStyles}
                    margin="normal"
                    placeholder="e.g. New supplier delivery"
                />
            </DialogContent>
            <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <Button onClick={() => handleClose(false)} sx={{ color: '#94a3b8', textTransform: 'none' }}>
                    Cancel
                </Button>
                <Button onClick={handleSubmit} variant="contained" sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' }, textTransform: 'none' }}>
                    Confirm Adjustment
                </Button>
            </DialogActions>
        </Dialog>
    );
};

const inputStyles = {
    '& .MuiOutlinedInput-root': {
        color: '#fff',
        bgcolor: 'rgba(255, 255, 255, 0.03)',
        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
        '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
        '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
    },
    '& .MuiInputLabel-root': { color: '#94a3b8' },
    '& .MuiInputLabel-root.Mui-focused': { color: '#3b82f6' },
};

export default StockAdjustDialog;
