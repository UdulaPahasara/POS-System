import React from 'react';
import { Box, Typography, IconButton, Button, Divider } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';

const Cart = ({ cartItems, updateQuantity, removeItem, clearCart, handleCheckout, subtotal, tax, total }) => {
    const getDiscountedPrice = (product) => {
        const price = Number(product.sellingPrice);
        if (!product.discount) return price;
        const type = product.discount.type || 'fixed';
        const amt = Number(product.discount.amount || 0);
        
        if (type === 'percentage') {
            return price * (1 - amt / 100);
        } else {
            return Math.max(0, price - amt);
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 3 }}>
            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, mb: 2 }}>Current Order</Typography>
            
            {/* Cart Items List */}
            <Box sx={{ flex: 1, overflowY: 'auto', pr: 1 }}>
                {cartItems.map((item, index) => (
                    <Box key={index} sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        mb: 2, 
                        p: 2, 
                        bgcolor: 'rgba(255,255,255,0.02)', 
                        borderRadius: 3,
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <Box sx={{ flex: 1 }}>
                            <Typography sx={{ color: '#fff', fontWeight: 600 }}>{item.product.name}</Typography>
                            {item.product.discount && item.product.discount.amount > 0 ? (
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                    <Typography variant="body2" sx={{ color: '#ef4444', textDecoration: 'line-through' }}>
                                        LKR {item.product.sellingPrice.toFixed(2)}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#10b981' }}>
                                        LKR {getDiscountedPrice(item.product).toFixed(2)}
                                    </Typography>
                                </Box>
                            ) : (
                                <Typography variant="body2" sx={{ color: '#60a5fa' }}>LKR {item.product.sellingPrice.toFixed(2)}</Typography>
                            )}
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton 
                                size="small" 
                                onClick={() => updateQuantity(item.product._id, -1)}
                                sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
                            >
                                <RemoveIcon fontSize="small" />
                            </IconButton>
                            
                            <Typography sx={{ color: '#fff', width: '20px', textAlign: 'center', fontWeight: 600 }}>
                                {item.quantity}
                            </Typography>
                            
                            <IconButton 
                                size="small" 
                                onClick={() => updateQuantity(item.product._id, 1)}
                                sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
                            >
                                <AddIcon fontSize="small" />
                            </IconButton>

                            <Typography sx={{ color: '#fff', fontWeight: 700, width: '60px', textAlign: 'right', ml: 1 }}>
                                LKR {(getDiscountedPrice(item.product) * item.quantity).toFixed(2)}
                            </Typography>
                            
                            <IconButton 
                                size="small" 
                                onClick={() => removeItem(item.product._id)}
                                sx={{ color: '#ef4444', ml: 1 }}
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    </Box>
                ))}

                {cartItems.length === 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <Typography sx={{ color: '#94a3b8' }}>Order is empty. Scan or select an item.</Typography>
                    </Box>
                )}
            </Box>

            {/* Totals Section */}
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed rgba(255,255,255,0.2)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ color: '#94a3b8' }}>Subtotal</Typography>
                    <Typography sx={{ color: '#fff', fontWeight: 600 }}>LKR {subtotal.toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography sx={{ color: '#94a3b8' }}>Tax</Typography>
                    <Typography sx={{ color: '#fff', fontWeight: 600 }}>LKR {tax.toFixed(2)}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, p: 2, bgcolor: 'rgba(59, 130, 246, 0.1)', borderRadius: 2 }}>
                    <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800 }}>Total</Typography>
                    <Typography variant="h5" sx={{ color: '#60a5fa', fontWeight: 800 }}>LKR {total.toFixed(2)}</Typography>
                </Box>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button 
                        variant="outlined" 
                        color="error" 
                        onClick={clearCart}
                        disabled={cartItems.length === 0}
                        sx={{ flex: '0 0 30%', textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
                    >
                        Void
                    </Button>
                    <Button 
                        variant="contained" 
                        onClick={handleCheckout}
                        disabled={cartItems.length === 0}
                        sx={{ flex: '1', bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, textTransform: 'none', borderRadius: 2, fontSize: '1.1rem', fontWeight: 700 }}
                    >
                        Pay Now
                    </Button>
                </Box>
            </Box>
        </Box>
    );
};

export default Cart;
