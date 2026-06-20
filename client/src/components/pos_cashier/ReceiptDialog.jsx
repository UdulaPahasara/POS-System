import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Divider } from '@mui/material';
import { settingsApi } from '../../services/settingsApi';

const ReceiptDialog = ({ open, onClose, sale }) => {
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        if (open) {
            settingsApi.getSettings()
                .then(data => { if (data) setSettings(data); })
                .catch(err => console.error("Failed to load settings", err));
        }
    }, [open]);

    if (!sale) return null;
    
    const { cartItems, subtotal, tax, total, date, employeeName, invoice, payments, customer } = sale;
    const invoiceNumber = invoice?.invoiceNumber || sale.invoiceNumber;
    const payment = payments && payments.length > 0 ? payments[0] : null;
    const paymentMethod = payment?.paymentMethod || sale.paymentMethod;
    const amountPaid = payment?.amount !== undefined ? payment.amount : sale.amountPaid;
    const change = payment?.change !== undefined ? payment.change : sale.change;
    const pointsEarned = sale.pointsEarned || 0;
    const pointsRedeemed = sale.pointsRedeemed || 0;

    let totalDiscount = 0;

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
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ fontWeight: 700, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#0f172a' }}>
                Transaction Receipt
            </DialogTitle>
            <DialogContent sx={{ p: 4, bgcolor: '#ffffff' }}>
                {/* Dynamic Header */}
                <Box sx={{ mb: 4, textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5 }}>
                        {settings?.storeName || 'Your Store Name'}
                    </Typography>
                    {settings?.storeAddress && (
                        <Typography variant="body2" sx={{ color: '#475569', mb: 0.5 }}>{settings.storeAddress}</Typography>
                    )}
                    {(settings?.storePhone || settings?.storeEmail) && (
                        <Typography variant="body2" sx={{ color: '#475569' }}>
                            {settings?.storePhone} {settings?.storePhone && settings?.storeEmail ? '|' : ''} {settings?.storeEmail}
                        </Typography>
                    )}
                    
                    <Box sx={{ mt: 3, p: 2, bgcolor: '#f1f5f9', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                        <Typography variant="subtitle2" sx={{ color: '#0f172a', fontWeight: 600 }}>{new Date(date).toLocaleString()}</Typography>
                        {invoiceNumber && <Typography variant="caption" sx={{ color: '#475569', display: 'block', mt: 0.5 }}>Invoice: {invoiceNumber}</Typography>}
                        {customer && customer.name && <Typography variant="caption" sx={{ color: '#475569', display: 'block', mt: 0.5 }}>Customer: {customer.name}</Typography>}
                    </Box>
                </Box>

                {/* Items List */}
                <Box sx={{ mb: 2 }}>
                    {cartItems.map((item, idx) => {
                        const originalSubtotal = item.product.sellingPrice * item.quantity;
                        const discountedPrice = getDiscountedPrice(item.product);
                        const discountedSubtotal = discountedPrice * item.quantity;
                        const hasDiscount = item.product.discount && item.product.discount.amount > 0;
                        const isPercentage = item.product.discount?.type === 'percentage';
                        
                        totalDiscount += (originalSubtotal - discountedSubtotal);

                        return (
                            <Box key={idx} sx={{ mb: 2.5 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Box>
                                        <Typography sx={{ color: '#0f172a', fontWeight: 600, fontSize: '1.05rem' }}>{item.product.name}</Typography>
                                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                                            {item.quantity} x LKR {item.product.sellingPrice.toFixed(2)}
                                        </Typography>
                                    </Box>
                                    <Typography sx={{ color: '#0f172a', fontWeight: 600 }}>LKR {originalSubtotal.toFixed(2)}</Typography>
                                </Box>
                                {hasDiscount && (
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5, pl: 1.5, borderLeft: '2px solid #ef4444' }}>
                                        <Typography variant="body2" sx={{ color: '#ef4444', fontWeight: 500 }}>
                                            Discount ({isPercentage ? `${item.product.discount.amount}%` : `LKR ${item.product.discount.amount}`})
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#ef4444', fontWeight: 600 }}>
                                            -LKR {(originalSubtotal - discountedSubtotal).toFixed(2)}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        );
                    })}
                </Box>

                {/* Totals Block */}
                <Divider sx={{ my: 2, borderStyle: 'dashed', borderColor: '#cbd5e1' }} />
                
                <Box sx={{ pt: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography sx={{ color: '#475569', fontWeight: 500 }}>Subtotal</Typography>
                        <Typography sx={{ color: '#0f172a', fontWeight: 600 }}>LKR {subtotal.toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography sx={{ color: '#475569', fontWeight: 500 }}>Tax</Typography>
                        <Typography sx={{ color: '#0f172a', fontWeight: 600 }}>LKR {tax.toFixed(2)}</Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: '#f1f5f9', borderRadius: 2, mb: 2, border: '1px solid #e2e8f0' }}>
                        <Typography variant="h5" sx={{ color: '#0f172a', fontWeight: 800 }}>Total</Typography>
                        <Typography variant="h5" sx={{ color: '#0f172a', fontWeight: 800 }}>LKR {total.toFixed(2)}</Typography>
                    </Box>

                    {pointsRedeemed > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#f59e0b', mb: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>Points Discount</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>-LKR {(pointsRedeemed * 100).toFixed(2)}</Typography>
                        </Box>
                    )}
                    {totalDiscount > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>Total Savings</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>-LKR {totalDiscount.toFixed(2)}</Typography>
                        </Box>
                    )}
                </Box>
                
                {/* Footer details */}
                <Divider sx={{ my: 2, borderStyle: 'dashed', borderColor: '#cbd5e1' }} />
                
                <Box sx={{ pt: 1 }}>
                    {paymentMethod && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2" sx={{ color: '#64748b' }}>Payment Method</Typography>
                            <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: 600 }}>{paymentMethod}</Typography>
                        </Box>
                    )}
                    {amountPaid !== undefined && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2" sx={{ color: '#64748b' }}>Amount Paid</Typography>
                            <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: 600 }}>LKR {amountPaid.toFixed(2)}</Typography>
                        </Box>
                    )}
                    {change !== undefined && change > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" sx={{ color: '#64748b' }}>Change Due</Typography>
                            <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 700 }}>LKR {change.toFixed(2)}</Typography>
                        </Box>
                    )}
                </Box>

                {pointsEarned > 0 && (
                    <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: 2, textAlign: 'center' }}>
                        <Typography sx={{ color: '#d97706', fontWeight: 700 }}>
                            ⭐ You earned {pointsEarned} Loyalty Points!
                        </Typography>
                    </Box>
                )}

                <Box sx={{ mt: 4, textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>Served by: <span style={{ fontWeight: 600, color: '#0f172a' }}>{employeeName}</span></Typography>
                    <Typography variant="body1" sx={{ color: '#0f172a', fontWeight: 700, mt: 1 }}>Thank you for shopping with us!</Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>Please come again.</Typography>
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                <Button onClick={onClose} sx={{ color: '#64748b', fontWeight: 600, textTransform: 'none', mr: 1 }}>
                    Close
                </Button>
                <Button onClick={() => { window.print(); }} variant="contained" color="primary" sx={{ fontWeight: 600, textTransform: 'none', px: 4, borderRadius: 2 }}>
                    Print Receipt
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ReceiptDialog;
