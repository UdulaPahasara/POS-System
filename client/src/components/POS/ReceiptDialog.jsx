import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material';

const ReceiptDialog = ({ open, onClose, sale }) => {
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
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Receipt</DialogTitle>
            <DialogContent dividers>
                <Box sx={{ mb: 2, textAlign: 'center' }}>
                    <Typography variant="h6">Your Store Name</Typography>
                    <Typography variant="subtitle2">{new Date(date).toLocaleString()}</Typography>
                    {invoiceNumber && <Typography variant="caption" component="div">Invoice: {invoiceNumber}</Typography>}
                    {customer && customer.name && <Typography variant="caption" component="div">Customer: {customer.name}</Typography>}
                </Box>
                <Box>
                    {cartItems.map((item, idx) => {
                        const originalSubtotal = item.product.sellingPrice * item.quantity;
                        const discountedPrice = getDiscountedPrice(item.product);
                        const discountedSubtotal = discountedPrice * item.quantity;
                        const hasDiscount = item.product.discount && item.product.discount.amount > 0;
                        const isPercentage = item.product.discount?.type === 'percentage';
                        
                        totalDiscount += (originalSubtotal - discountedSubtotal);

                        return (
                            <Box key={idx} sx={{ mb: 1.5 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography>{item.product.name} x {item.quantity} {hasDiscount && `(@ LKR ${item.product.sellingPrice.toFixed(2)})`}</Typography>
                                    <Typography>LKR {originalSubtotal.toFixed(2)}</Typography>
                                </Box>
                                {hasDiscount && (
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', pl: 2 }}>
                                        <Typography variant="body2" sx={{ color: '#666' }}>
                                            Discount: {isPercentage ? `${item.product.discount.amount}% off` : `LKR ${item.product.discount.amount} off`}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#ef4444' }}>
                                            -LKR {(originalSubtotal - discountedSubtotal).toFixed(2)}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        );
                    })}
                </Box>
                <Box sx={{ mt: 2, borderTop: '1px solid #ddd', pt: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography>Subtotal</Typography>
                        <Typography>LKR {subtotal.toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography>Tax (10%)</Typography>
                        <Typography>LKR {tax.toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', mt: 1 }}>
                        <Typography>Total</Typography>
                        <Typography>LKR {total.toFixed(2)}</Typography>
                    </Box>
                    {pointsRedeemed > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#f59e0b', mt: 0.5 }}>
                            <Typography variant="body2">Points Discount</Typography>
                            <Typography variant="body2">-LKR {(pointsRedeemed * 100).toFixed(2)}</Typography>
                        </Box>
                    )}
                    {totalDiscount > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444', mt: 0.5 }}>
                            <Typography variant="body2">Total Savings</Typography>
                            <Typography variant="body2">-LKR {totalDiscount.toFixed(2)}</Typography>
                        </Box>
                    )}
                </Box>
                
                <Box sx={{ mt: 2, borderTop: '1px dashed #ddd', pt: 1 }}>
                    {paymentMethod && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">Payment Method</Typography>
                            <Typography variant="body2">{paymentMethod}</Typography>
                        </Box>
                    )}
                    {amountPaid !== undefined && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">Amount Paid</Typography>
                            <Typography variant="body2">LKR {amountPaid.toFixed(2)}</Typography>
                        </Box>
                    )}
                    {change !== undefined && change > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">Change Due</Typography>
                            <Typography variant="body2">LKR {change.toFixed(2)}</Typography>
                        </Box>
                    )}
                </Box>

                {pointsEarned > 0 && (
                    <Box sx={{ mt: 2, p: 1.5, bgcolor: 'rgba(245, 158, 11, 0.1)', borderRadius: 2, textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ color: '#f59e0b', fontWeight: 600 }}>
                            You earned {pointsEarned} Loyalty Points!
                        </Typography>
                    </Box>
                )}

                <Box sx={{ mt: 3, textAlign: 'center' }}>
                    <Typography variant="body2">Served by: {employeeName}</Typography>
                    <Typography variant="caption">Thank you for your purchase!</Typography>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => { window.print(); }} variant="contained" color="primary" sx={{ textTransform: 'none' }}>
                    Print
                </Button>
                <Button onClick={onClose} variant="outlined" sx={{ textTransform: 'none' }}>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ReceiptDialog;
