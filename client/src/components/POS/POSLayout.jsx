import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, IconButton, TextField, InputAdornment, Snackbar, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import ProductGrid from './ProductGrid';
import Cart from './Cart';
import CheckoutDialog from './CheckoutDialog';
import CustomerSelect from './CustomerSelect';
import ReceiptDialog from './ReceiptDialog';
import CameraScannerDialog from './CameraScannerDialog';
import emailjs from '@emailjs/browser';

const POSLayout = () => {
    const navigate = useNavigate();
    // Get current user
    const userString = localStorage.getItem('user') || sessionStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : { role: 'Cashier', username: 'Unknown' };
    const userRoleName = user?.role && typeof user.role === 'object' ? user.role.roleName : (user?.role || 'Cashier');

    // UI state for customer handling & receipt
    const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [receiptOpen, setReceiptOpen] = useState(false);
    const [saleInfo, setSaleInfo] = useState(null);

    const [products, setProducts] = useState([]);
    const [cartItems, setCartItems] = useState([]);
    
    // Checkout State
    const [checkoutOpen, setCheckoutOpen] = useState(false);

    // Barcode Scanner State
    const [scannerOpen, setScannerOpen] = useState(false);
    const [manualBarcode, setManualBarcode] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                const response = await fetch('http://localhost:5000/api/products', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setProducts(data);
                }
            } catch (error) {
                console.error("Error fetching products:", error);
            }
        };
        fetchProducts();
    }, []);

    const addToCart = (product) => {
        setCartItems(prev => {
            const existing = prev.find(item => item.product._id === product._id);
            if (existing) {
                return prev.map(item => 
                    item.product._id === product._id 
                        ? { ...item, quantity: item.quantity + 1 } 
                        : item
                );
            }
            return [...prev, { product, quantity: 1, discount: 0 }];
        });
    };

    const updateQuantity = (productId, delta) => {
        setCartItems(prev => prev.map(item => {
            if (item.product._id === productId) {
                const newQty = item.quantity + delta;
                return newQty > 0 ? { ...item, quantity: newQty } : item;
            }
            return item;
        }));
    };

    const removeItem = (productId) => {
        setCartItems(prev => prev.filter(item => item.product._id !== productId));
    };

    const clearCart = () => {
        if(window.confirm('Are you sure you want to void this order?')) {
            setCartItems([]);
        }
    };

    const handleCheckout = () => {
        if (cartItems.length === 0) {
            alert("Cart is empty!");
            return;
        }
        setCheckoutOpen(true);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        navigate('/login');
    };

    // Math calculations
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

    const handleBarcodeScan = (barcode) => {
        const trimmedBarcode = barcode.trim().toLowerCase();
        if (!trimmedBarcode) return;

        const product = products.find(p => 
            (p.barcodeValue && p.barcodeValue.toLowerCase() === trimmedBarcode) || 
            (p.sku && p.sku.toLowerCase() === trimmedBarcode)
        );

        if (product) {
            addToCart(product);
            setSnackbar({ open: true, message: `Added ${product.name} to cart.`, severity: 'success' });
            setManualBarcode(''); // clear input if it was manual
        } else {
            setSnackbar({ open: true, message: `Product not found for barcode: ${barcode}`, severity: 'error' });
        }
    };

    const handleManualBarcodeEnter = (e) => {
        if (e.key === 'Enter') {
            handleBarcodeScan(manualBarcode);
        }
    };

    const subtotal = cartItems.reduce((sum, item) => sum + (getDiscountedPrice(item.product) * item.quantity), 0);
    const tax = cartItems.reduce((sum, item) => {
        const itemTaxRate = item.product.category && item.product.category.taxRate ? item.product.category.taxRate / 100 : 0;
        return sum + (getDiscountedPrice(item.product) * item.quantity * itemTaxRate);
    }, 0);
    const total = subtotal + tax;

    return (
        <Box sx={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', bgcolor: '#0f172a' }}>
            
            {/* Left Side: Product Grid (65%) */}
            <Box sx={{ flex: '0 0 65%', display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                {/* Header Navbar */}
                <Box sx={{ height: '70px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', px: 3, bgcolor: '#1e293b' }}>
                    {['Admin', 'Manager', 'Inventory Staff'].includes(userRoleName) && (
                        <IconButton onClick={() => {
                            const basePath = userRoleName === 'Admin' ? '/admin' : userRoleName === 'Manager' ? '/manager' : '/inventory-staff';
                            navigate(`${basePath}/${userRoleName === 'Inventory Staff' ? 'inventory-dashboard' : 'dashboard'}`);
                        }} sx={{ color: '#94a3b8', mr: 2 }}>
                            <ArrowBackIcon />
                        </IconButton>
                    )}
                    <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700, flexGrow: 1 }}>
                        POS System
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mr: 3 }}>
                        User: {user.username} ({userRoleName})
                    </Typography>
                    
                    {/* Barcode Scanner Actions */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
                        <TextField 
                            variant="outlined" 
                            size="small" 
                            placeholder="Scan or type barcode"
                            value={manualBarcode}
                            onChange={(e) => setManualBarcode(e.target.value)}
                            onKeyDown={handleManualBarcodeEnter}
                            sx={{
                                width: '200px',
                                '& .MuiOutlinedInput-root': {
                                    color: '#fff',
                                    '& fieldset': { border: 'none' }
                                }
                            }}
                        />
                        <Button
                            variant="contained"
                            color="secondary"
                            size="small"
                            onClick={() => setScannerOpen(true)}
                            sx={{ minWidth: '40px', p: 1, borderRadius: '0 4px 4px 0' }}
                        >
                            <QrCodeScannerIcon fontSize="small" />
                        </Button>
                    </Box>

                    {/* Customer selector */}
                    <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => setCustomerDialogOpen(true)}
                        sx={{ mx: 1, textTransform: 'none' }}
                    >
                        {selectedCustomer ? selectedCustomer.name : 'Select Customer'}
                    </Button>
                    <Button 
                        variant="outlined" 
                        color="error" 
                        size="small"
                        onClick={handleLogout}
                        sx={{ textTransform: 'none', borderRadius: 2 }}
                    >
                        Logout
                    </Button>
                </Box>
                
                {/* Main Product Area */}
                <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
                    <ProductGrid products={products} onAddToCart={addToCart} />
                </Box>
            </Box>

            {/* Right Side: Cart (35%) */}
            <Box sx={{ flex: '0 0 35%', display: 'flex', flexDirection: 'column', bgcolor: '#1e293b' }}>
                <Cart 
                    cartItems={cartItems} 
                    updateQuantity={updateQuantity} 
                    removeItem={removeItem} 
                    clearCart={clearCart}
                    handleCheckout={handleCheckout}
                    subtotal={subtotal}
                    tax={tax}
                    total={total}
                />
            </Box>

            {/* Checkout Dialog */}
            <CheckoutDialog 
                open={checkoutOpen}
                onClose={() => setCheckoutOpen(false)}
                total={total}
                customer={selectedCustomer}
                onComplete={async ({ paymentMethod, amountPaid, pointsRedeemed }) => {
                    try {
                        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                        const response = await fetch('http://localhost:5000/api/sales', {
                            method: 'POST',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}` 
                            },
                            body: JSON.stringify({
                                cartItems,
                                customer: selectedCustomer,
                                paymentMethod,
                                amountPaid,
                                pointsRedeemed
                            })
                        });

                        if (response.ok) {
                            const data = await response.json();
                            
                            // Map backend data to frontend receipt format
                            const saleData = {
                                ...data,
                                employeeName: user.username,
                                cartItems: data.items.map(i => ({
                                    product: {
                                        name: i.name,
                                        sellingPrice: i.sellingPrice,
                                        discount: i.discount
                                    },
                                    quantity: i.quantity
                                })),
                                date: data.createdAt
                            };

                            setSaleInfo(saleData);
                            setReceiptOpen(true);
                            setCheckoutOpen(false);
                            setCartItems([]);
                            setSelectedCustomer(null);

                            // Send Email Receipt if Customer has email
                            if (saleData.customer && saleData.customer.email) {
                                const itemsHtml = saleData.cartItems.map(item => {
                                    const hasDiscount = item.product.discount && item.product.discount.amount > 0;
                                    const priceText = hasDiscount ? `(Discounted)` : '';
                                    return `
                                    <tr>
                                        <td style="padding: 10px; border-bottom: 1px solid #eee;">
                                            ${item.product.name} x ${item.quantity} ${priceText}
                                        </td>
                                        <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">
                                            LKR ${(item.product.sellingPrice * item.quantity).toFixed(2)}
                                        </td>
                                    </tr>
                                    `;
                                }).join('');

                                const templateParams = {
                                    to_email: saleData.customer.email,
                                    to_name: saleData.customer.name,
                                    customer_name: saleData.customer.name,
                                    customer_email: saleData.customer.email,
                                    invoice_number: saleData.invoice?.invoiceNumber || saleData.invoiceNumber || 'N/A',
                                    date: new Date(saleData.date).toLocaleString(),
                                    subtotal: saleData.subtotal.toFixed(2),
                                    tax: saleData.tax.toFixed(2),
                                    points_discount: (saleData.pointsRedeemed * 100).toFixed(2),
                                    total: saleData.total.toFixed(2),
                                    employee_name: saleData.employeeName,
                                    items_html: itemsHtml
                                };

                                emailjs.send(
                                    'service_xptdo89', 
                                    'template_9ze4384', 
                                    templateParams, 
                                    'FGdpdlZ02HmY4dEEl'
                                ).then((response) => {
                                    console.log('SUCCESS!', response.status, response.text);
                                    setSnackbar({ open: true, message: 'Receipt emailed successfully!', severity: 'success' });
                                }).catch((err) => {
                                    console.log('FAILED...', err);
                                    setSnackbar({ open: true, message: 'Failed to send receipt email', severity: 'error' });
                                });
                            }
                        } else {
                            const errData = await response.json();
                            alert(`Checkout failed: ${errData.message || 'Unknown error'}`);
                        }
                    } catch (error) {
                        console.error('Checkout error:', error);
                        alert('An error occurred during checkout');
                    }
                }}
            />
            {/* Customer selection dialog */}
            <CustomerSelect
                open={customerDialogOpen}
                onClose={() => setCustomerDialogOpen(false)}
                onSelect={(cust) => { setSelectedCustomer(cust); setCustomerDialogOpen(false); }}
            />
            {/* Receipt / Invoice dialog */}
            <ReceiptDialog
                open={receiptOpen}
                onClose={() => setReceiptOpen(false)}
                sale={saleInfo}
            />

            {/* Camera Scanner Dialog */}
            <CameraScannerDialog 
                open={scannerOpen} 
                onClose={() => setScannerOpen(false)}
                onScan={(barcode) => {
                    setScannerOpen(false);
                    handleBarcodeScan(barcode);
                }}
            />

            {/* Snackbar */}
            <Snackbar 
                open={snackbar.open} 
                autoHideDuration={3000} 
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} variant="filled" sx={{ width: '100%', borderRadius: 2 }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default POSLayout;
