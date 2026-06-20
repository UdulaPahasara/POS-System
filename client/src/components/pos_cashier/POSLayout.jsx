import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, IconButton, TextField, InputAdornment, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import PersonIcon from '@mui/icons-material/Person';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ClearIcon from '@mui/icons-material/Clear';
import LogoutIcon from '@mui/icons-material/Logout';
import ProductGrid from './ProductGrid';
import Cart from './Cart';
import CheckoutDialog from './CheckoutDialog';
import CustomerSelect from './CustomerSelect';
import ReceiptDialog from './ReceiptDialog';
import CameraScannerDialog from './CameraScannerDialog';
import emailjs from '@emailjs/browser';
import { useNotifications } from '../../context/NotificationContext';
import { productsApi } from '../../services/productsApi';
import { posApi } from '../../services/posApi';
import { settingsApi } from '../../services/settingsApi';

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

    // Logout State
    const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

    // Custom Confirm Dialog State
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [confirmDialogConfig, setConfirmDialogConfig] = useState({ title: '', message: '', onConfirm: null });

    // Hold Cart State
    const [heldCarts, setHeldCarts] = useState([]);
    const [heldCartsDialogOpen, setHeldCartsDialogOpen] = useState(false);

    // Barcode Scanner State
    const [scannerOpen, setScannerOpen] = useState(false);
    const [manualBarcode, setManualBarcode] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [systemSettings, setSystemSettings] = useState(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [productsData, settingsData] = await Promise.all([
                    productsApi.getAllProducts(),
                    settingsApi.getSettings()
                ]);
                if (productsData) setProducts(productsData);
                if (settingsData) setSystemSettings(settingsData);
            } catch (error) {
                console.error("Error fetching initial data:", error);
            }
        };
        fetchInitialData();
    }, []);

    const { socket } = useNotifications();
    useEffect(() => {
        if (!socket) return;
        const handleUpdate = (data) => {
            if (data.type === 'PRODUCT' || data.type === 'CATEGORY' || data.type === 'SALE' || data.type === 'PURCHASE_ORDER' || data.type === 'PURCHASE_RETURN') {
                const fetchProducts = async () => {
                    try {
                        const data = await productsApi.getAllProducts();
                        if (data) setProducts(data);
                    } catch (error) {
                        console.error("Error fetching products:", error);
                    }
                };
                fetchProducts();
            }
        };
        socket.on('data_updated', handleUpdate);
        return () => socket.off('data_updated', handleUpdate);
    }, [socket]);

    const addToCart = (product) => {
        const existing = cartItems.find(item => item.product._id === product._id);
        if (existing && existing.quantity >= product.stock) {
            setSnackbar({ open: true, message: `Cannot add more ${product.name}. Only ${product.stock} in stock.`, severity: 'warning' });
            return false;
        }
        if (!existing && product.stock <= 0) {
            setSnackbar({ open: true, message: `${product.name} is out of stock.`, severity: 'warning' });
            return false;
        }

        setCartItems(prev => {
            const existingInPrev = prev.find(item => item.product._id === product._id);
            if (existingInPrev) {
                return prev.map(item => 
                    item.product._id === product._id 
                        ? { ...item, quantity: item.quantity + 1 } 
                        : item
                );
            }
            return [...prev, { product, quantity: 1, discount: 0 }];
        });
        return true;
    };

    const updateQuantity = (productId, delta) => {
        const item = cartItems.find(i => i.product._id === productId);
        if (item) {
            const newQty = item.quantity + delta;
            if (delta > 0 && newQty > item.product.stock) {
                setSnackbar({ open: true, message: `Cannot add more ${item.product.name}. Only ${item.product.stock} in stock.`, severity: 'warning' });
                return;
            }
            
            setCartItems(prev => prev.map(i => {
                if (i.product._id === productId) {
                    return newQty > 0 ? { ...i, quantity: newQty } : i;
                }
                return i;
            }));
        }
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

    const handleHoldCart = () => {
        if (cartItems.length === 0) {
            setSnackbar({ open: true, message: "Cannot hold an empty cart.", severity: 'warning' });
            return;
        }

        const newHeldCart = {
            id: Date.now().toString(),
            items: [...cartItems],
            customer: selectedCustomer,
            timestamp: new Date(),
            name: selectedCustomer ? `${selectedCustomer.name} (${cartItems.length} items)` : `Guest (${cartItems.length} items)`
        };

        setHeldCarts(prev => [...prev, newHeldCart]);
        setCartItems([]);
        setSelectedCustomer(null);
    };

    const restoreHeldCart = (heldCart) => {
        if (cartItems.length > 0) {
            setConfirmDialogConfig({
                title: 'Restore Held Cart',
                message: 'Restoring this cart will completely void your current active cart. Do you wish to continue?',
                onConfirm: () => {
                    setCartItems(heldCart.items);
                    setSelectedCustomer(heldCart.customer);
                    setHeldCarts(prev => prev.filter(c => c.id !== heldCart.id));
                    setHeldCartsDialogOpen(false);
                }
            });
            setConfirmDialogOpen(true);
            return;
        }
        
        setCartItems(heldCart.items);
        setSelectedCustomer(heldCart.customer);
        setHeldCarts(prev => prev.filter(c => c.id !== heldCart.id));
        setHeldCartsDialogOpen(false);
    };

    const deleteHeldCart = (id) => {
        setConfirmDialogConfig({
            title: 'Delete Held Cart',
            message: 'Are you sure you want to permanently delete this held cart?',
            onConfirm: () => {
                setHeldCarts(prev => prev.filter(c => c.id !== id));
            }
        });
        setConfirmDialogOpen(true);
    };

    const handleLogoutClick = () => {
        setLogoutDialogOpen(true);
    };

    const handleLogoutConfirm = () => {
        setLogoutDialogOpen(false);
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
        let itemTaxRate = item.product.category && item.product.category.taxRate ? item.product.category.taxRate : 0;
        if (itemTaxRate === 0 && systemSettings?.defaultTaxRate) {
            itemTaxRate = systemSettings.defaultTaxRate;
        }
        return sum + (getDiscountedPrice(item.product) * item.quantity * (itemTaxRate / 100));
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

                    {/* Logout */}
                    <Button 
                        variant="outlined" 
                        color="error" 
                        size="small"
                        onClick={handleLogoutClick}
                        startIcon={<LogoutIcon />}
                        sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
                    >
                        Logout
                    </Button>
                </Box>
                
                {/* Main Product Area */}
                <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
                    <ProductGrid 
                        products={products} 
                        onAddToCart={(prod) => addToCart(prod)} 
                        customerSelectorNode={
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'rgba(59, 130, 246, 0.05)', p: 1.5, borderRadius: 3, border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    {selectedCustomer ? <PersonIcon sx={{ color: '#60a5fa' }} /> : <PersonAddIcon sx={{ color: '#94a3b8' }} />}
                                    <Typography sx={{ color: selectedCustomer ? '#fff' : '#94a3b8', fontWeight: 600, fontSize: '1.1rem' }}>
                                        {selectedCustomer ? `Customer: ${selectedCustomer.name}` : 'Guest Checkout'}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Button
                                        variant={selectedCustomer ? "outlined" : "contained"}
                                        color="primary"
                                        onClick={() => setCustomerDialogOpen(true)}
                                        sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
                                    >
                                        {selectedCustomer ? 'Change Customer' : 'Select or Add Customer'}
                                    </Button>
                                    {selectedCustomer && (
                                        <Button 
                                            color="error" 
                                            onClick={() => setSelectedCustomer(null)}
                                            sx={{ ml: 1, textTransform: 'none', fontWeight: 600 }}
                                        >
                                            Clear
                                        </Button>
                                    )}
                                </Box>
                            </Box>
                        }
                    />
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
                    heldCartsCount={heldCarts.length}
                    onHoldCart={handleHoldCart}
                    onOpenHeldCarts={() => setHeldCartsDialogOpen(true)}
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
                        const data = await posApi.submitSale({
                            cartItems,
                            customer: selectedCustomer,
                            paymentMethod,
                            amountPaid,
                            pointsRedeemed
                        });
                            
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

            {/* Held Carts Dialog */}
            <Dialog
                open={heldCartsDialogOpen}
                onClose={() => setHeldCartsDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { bgcolor: '#1e293b', color: '#fff', borderRadius: 2, border: '1px solid rgba(255,255,255,0.1)' }
                }}
            >
                <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: 600 }}>Held Carts</DialogTitle>
                <DialogContent sx={{ pt: 3, pb: 3, minHeight: '200px' }}>
                    {heldCarts.length === 0 ? (
                        <Typography sx={{ color: '#94a3b8', textAlign: 'center', mt: 4 }}>No held carts available.</Typography>
                    ) : (
                        heldCarts.map(cart => (
                            <Box key={cart.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, mb: 1, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
                                <Box>
                                    <Typography sx={{ color: '#fff', fontWeight: 600 }}>{cart.name}</Typography>
                                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>{new Date(cart.timestamp).toLocaleTimeString()} - Total: LKR {cart.items.reduce((sum, item) => sum + (getDiscountedPrice(item.product) * item.quantity), 0).toFixed(2)}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button size="small" variant="outlined" color="info" onClick={() => restoreHeldCart(cart)} sx={{ textTransform: 'none' }}>Restore</Button>
                                    <Button size="small" variant="outlined" color="error" onClick={() => deleteHeldCart(cart.id)} sx={{ textTransform: 'none' }}>Delete</Button>
                                </Box>
                            </Box>
                        ))
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <Button onClick={() => setHeldCartsDialogOpen(false)} sx={{ color: '#94a3b8' }}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Custom Action Confirmation Dialog */}
            <Dialog
                open={confirmDialogOpen}
                onClose={() => setConfirmDialogOpen(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: { bgcolor: '#ffffff', color: '#0f172a', borderRadius: 3, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }
                }}
            >
                <DialogTitle sx={{ fontWeight: 700, fontSize: '1.2rem', pb: 1 }}>{confirmDialogConfig.title}</DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: '#475569', fontSize: '1rem', lineHeight: 1.5 }}>{confirmDialogConfig.message}</Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2.5, pt: 1 }}>
                    <Button onClick={() => setConfirmDialogOpen(false)} sx={{ color: '#64748b', textTransform: 'none', fontWeight: 600, mr: 1 }}>Cancel</Button>
                    <Button 
                        variant="contained" 
                        color="error" 
                        onClick={() => {
                            if (confirmDialogConfig.onConfirm) confirmDialogConfig.onConfirm();
                            setConfirmDialogOpen(false);
                        }} 
                        sx={{ textTransform: 'none', fontWeight: 600, px: 3, borderRadius: 2 }}
                    >
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Logout Confirmation Dialog */}
            <Dialog
                open={logoutDialogOpen}
                onClose={() => setLogoutDialogOpen(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: { bgcolor: '#ffffff', color: '#0f172a', borderRadius: 3, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }
                }}
            >
                <DialogTitle sx={{ fontWeight: 700, fontSize: '1.2rem', pb: 1 }}>Confirm Logout</DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: '#475569', fontSize: '1rem', lineHeight: 1.5 }}>
                        Are you sure you want to securely logout from the POS system?
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2.5, pt: 1 }}>
                    <Button onClick={() => setLogoutDialogOpen(false)} sx={{ color: '#64748b', textTransform: 'none', fontWeight: 600, mr: 1 }}>
                        Cancel
                    </Button>
                    <Button onClick={handleLogoutConfirm} variant="contained" color="error" sx={{ textTransform: 'none', fontWeight: 600, px: 3, borderRadius: 2 }}>
                        Logout
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default POSLayout;
