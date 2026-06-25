import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
    Box, Typography, Paper, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, IconButton, Button,
    Chip, InputAdornment, TextField, Avatar, Grid, MenuItem,
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
    Snackbar, Alert, Fade
} from '@mui/material';
import { 
    Edit as EditIcon, 
    Delete as DeleteIcon, 
    Add as AddIcon,
    Search as SearchIcon,
    Inventory2 as InventoryIcon,
    BarcodeReader as BarcodeIcon,
    Print as PrintIcon,
    QrCodeScanner as ScannerIcon
} from '@mui/icons-material';
import ProductDialog from './ProductDialog';
import Barcode from 'react-barcode';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNotifications } from '../../../context/NotificationContext';
import { productsApi } from '../../../services/productsApi';
import { categoriesApi } from '../../../services/categoriesApi';
import { branchesApi } from '../../../services/branchesApi';

const ProductList = () => {
    const location = useLocation();
    const [highlightedProductId, setHighlightedProductId] = useState(null);
    const [products, setProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [categories, setCategories] = useState([]);
    
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const isAdmin = user?.role?.roleName === 'Admin' || user?.role === 'Admin';
    const [branches, setBranches] = useState([]);
    const [selectedBranchId, setSelectedBranchId] = useState('global');
    
    // New states for Delete Dialog and Snackbar
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // States for Barcode Dialog
    const [barcodeDialogOpen, setBarcodeDialogOpen] = useState(false);
    const [selectedBarcodeProduct, setSelectedBarcodeProduct] = useState(null);

    // States for Barcode Scanner
    const [barcodeSearchQuery, setBarcodeSearchQuery] = useState('');
    const [scannerDialogOpen, setScannerDialogOpen] = useState(false);

    const defaultForm = {
        name: '', sku: '', barcodeValue: '', brand: '', category: '',
        costPrice: '', sellingPrice: '', reorderLevel: '', description: '', image: '',
        discountType: 'none', discountAmount: 0
    };
    const [formData, setFormData] = useState(defaultForm);

    const fetchProducts = async () => {
        try {
            const data = await productsApi.getAllProducts(selectedBranchId);
            if (data) setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const fetchCategories = async () => {
        try {
            const data = await categoriesApi.getAllCategories();
            if (data) setCategories(data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchBranches = async () => {
        try {
            const data = await branchesApi.getAllBranches();
            if (data) setBranches(data);
        } catch (error) {
            console.error('Error fetching branches:', error);
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchCategories();
        if (isAdmin) fetchBranches();
    }, [selectedBranchId]);

    const { socket } = useNotifications();
    useEffect(() => {
        if (!socket) return;
        const handleUpdate = (data) => {
            if (data.type === 'PRODUCT' || data.type === 'CATEGORY' || data.type === 'SALE' || data.type === 'PURCHASE_ORDER' || data.type === 'PURCHASE_RETURN') {
                fetchProducts();
                if (data.type === 'CATEGORY') fetchCategories();
            }
        };
        socket.on('data_updated', handleUpdate);
        return () => socket.off('data_updated', handleUpdate);
    }, [socket]);

    useEffect(() => {
        if (location.state?.highlightProductId && products.length > 0) {
            const id = location.state.highlightProductId;
            setHighlightedProductId(id);
            
            setTimeout(() => {
                const element = document.getElementById('product-row-' + id);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
            
            const timer = setTimeout(() => {
                setHighlightedProductId(null);
                // Clean up state
                window.history.replaceState({}, document.title);
            }, 3000);
            
            return () => clearTimeout(timer);
        }
    }, [location.state, products]);

    const handleOpenAdd = () => {
        setIsEditing(false);
        const autoBarcode = Math.floor(100000000000 + Math.random() * 900000000000).toString();
        setFormData({ ...defaultForm, barcodeValue: autoBarcode });
        setDialogOpen(true);
    };

    const handleOpenEdit = (product) => {
        setIsEditing(true);
        setFormData({
            ...product,
            category: product.category?._id || product.category || '',
            discountType: product.discount?.type || 'none',
            discountAmount: product.discount?.amount || 0
        });
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
    };

    const handleSubmit = async () => {
        try {
            const data = new FormData();
            // Only save branchData entries the user explicitly configured (sellingPrice > 0)
            const validBranchData = (formData.branchData || []).filter(b => b.sellingPrice > 0);
            // Derive effective global sellingPrice from branchData (required by schema)
            const effectiveSellingPrice = formData.sellingPrice || validBranchData[0]?.sellingPrice || 0;

            Object.keys(formData).forEach(key => {
                if (key === 'branchData') {
                    data.append(key, JSON.stringify(validBranchData));
                } else if (key === 'sellingPrice') {
                    data.append(key, effectiveSellingPrice);
                } else if (key !== '_id' && key !== 'id' && formData[key] !== null && formData[key] !== undefined) {
                    data.append(key, formData[key]);
                }
            });

            if (isEditing) {
                await productsApi.updateProduct(formData._id, data, selectedBranchId);
            } else {
                await productsApi.createProduct(data, selectedBranchId);
            }

            fetchProducts();
            handleCloseDialog();
            setSnackbar({ 
                open: true, 
                message: isEditing ? 'Product updated successfully!' : 'Product added successfully!', 
                severity: 'success' 
            });
        } catch (error) {
            console.error('Error saving product:', error);
            setSnackbar({ open: true, message: error.message || 'Server error saving product', severity: 'error' });
        }
    };

    const handleOpenDeleteDialog = (id) => {
        setProductToDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleCloseDeleteDialog = () => {
        setDeleteDialogOpen(false);
        setProductToDelete(null);
    };

    const confirmDelete = async () => {
        if (!productToDelete) return;
        try {
            // Pass selectedBranchId so deletion only removes this branch, not the whole product
            await productsApi.deleteProduct(productToDelete, selectedBranchId);
            fetchProducts();
            setSnackbar({ open: true, message: selectedBranchId ? 'Product removed from this branch!' : 'Product deleted successfully!', severity: 'success' });
        } catch (error) {
            console.error('Error deleting product:', error);
            setSnackbar({ open: true, message: error.message || 'Server error deleting product', severity: 'error' });
        }
        handleCloseDeleteDialog();
    };

    const handleOpenBarcode = (product) => {
        setSelectedBarcodeProduct(product);
        setBarcodeDialogOpen(true);
    };

    const handleCloseBarcode = () => {
        setBarcodeDialogOpen(false);
        setSelectedBarcodeProduct(null);
    };

    const handlePrintBarcode = () => {
        const printContent = document.getElementById('print-barcode-area');
        const windowPrint = window.open('', '', 'width=800,height=600');
        windowPrint.document.write('<html><head><title>Print Barcode</title>');
        windowPrint.document.write('<style>body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }</style>');
        windowPrint.document.write('</head><body>');
        windowPrint.document.write(printContent.innerHTML);
        windowPrint.document.write('</body></html>');
        windowPrint.document.close();
        windowPrint.focus();
        setTimeout(() => {
            windowPrint.print();
            windowPrint.close();
        }, 250);
    };

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    useEffect(() => {
        let html5QrcodeScanner = null;
        let timeoutId;
        
        if (scannerDialogOpen) {
            // Wait for MUI Dialog transition to insert element into DOM
            timeoutId = setTimeout(() => {
                const element = document.getElementById("reader");
                if (element) {
                    html5QrcodeScanner = new Html5QrcodeScanner(
                        "reader",
                        { 
                            fps: 10, 
                            qrbox: { width: 350, height: 150 }, // Rectangular box for 1D Barcodes
                            aspectRatio: 1.777778
                        },
                        /* verbose= */ false
                    );
                    html5QrcodeScanner.render(
                        (decodedText) => {
                            setBarcodeSearchQuery(decodedText);
                            setScannerDialogOpen(false);
                        },
                        (errorMessage) => {
                            // ignore generic parse errors while scanning
                        }
                    );
                } else {
                    console.error("Scanner element not found");
                }
            }, 100);
        }
        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            if (html5QrcodeScanner) {
                html5QrcodeScanner.clear().catch(error => {
                    console.error("Failed to clear html5QrcodeScanner. ", error);
                });
            }
        };
    }, [scannerDialogOpen]);

    const filteredProducts = products.filter(p => {
        if (barcodeSearchQuery) {
            return p.barcodeValue === barcodeSearchQuery || p.sku === barcodeSearchQuery;
        }
        const catName = typeof p.category === 'object' ? (p.category?.name || '') : (p.category || '');
        return p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
               p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
               catName.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <Box>
            <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' }, 
                justifyContent: 'space-between', 
                alignItems: { xs: 'stretch', sm: 'center' },
                gap: 2,
                mb: 3 
            }}>
                <Typography 
                    variant="h4" 
                    sx={{ color: '#fff', fontWeight: 600, fontSize: { xs: '1.75rem', sm: '2.125rem' } }}
                >
                    Products
                </Typography>
                <Button 
                    variant="contained" 
                    startIcon={<AddIcon sx={{ mr: { xs: -1, sm: 0 } }} />}
                    onClick={handleOpenAdd}
                    sx={{ 
                        bgcolor: '#3b82f6', 
                        '&:hover': { bgcolor: '#2563eb' },
                        whiteSpace: 'nowrap',
                        textTransform: 'none',
                        fontWeight: 600,
                        px: { xs: 2, sm: 3 },
                        borderRadius: 2
                    }}
                >
                    <Box component="span" sx={{ display: { xs: 'none', sm: 'block' } }}>Add Product</Box>
                    <Box component="span" sx={{ display: { xs: 'block', sm: 'none' } }}>Add</Box>
                </Button>
            </Box>

            <Paper sx={{ p: 2, bgcolor: '#1e293b', borderRadius: 2, mb: 3 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: isAdmin ? '2fr 5fr 3fr' : '7fr 3fr' }, gap: 2 }}>
                    {isAdmin && (
                        <TextField
                            select
                            fullWidth
                            value={selectedBranchId}
                            onChange={(e) => setSelectedBranchId(e.target.value)}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    color: '#fff',
                                    bgcolor: 'rgba(255,255,255,0.05)',
                                    '& fieldset': { border: 'none' }
                                }
                            }}
                        >
                            <MenuItem value="global">All Branches / Global</MenuItem>
                            {branches.map(b => (
                                <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>
                            ))}
                        </TextField>
                    )}
                    <TextField
                        fullWidth
                        placeholder="Search by product name, SKU, or Category..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: '#94a3b8' }} />
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                color: '#fff',
                                bgcolor: 'rgba(255,255,255,0.05)',
                                '& fieldset': { border: 'none' }
                            }
                        }}
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                            fullWidth
                            placeholder="Barcode Search..."
                            value={barcodeSearchQuery}
                            onChange={(e) => setBarcodeSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <BarcodeIcon sx={{ color: '#94a3b8' }} />
                                    </InputAdornment>
                                ),
                                endAdornment: barcodeSearchQuery ? (
                                    <InputAdornment position="end">
                                        <Button 
                                            size="small" 
                                            onClick={() => setBarcodeSearchQuery('')}
                                            sx={{ minWidth: 'auto', p: 0.5, color: '#ef4444' }}
                                        >
                                            Clear
                                        </Button>
                                    </InputAdornment>
                                ) : null
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    color: '#fff',
                                    bgcolor: 'rgba(255,255,255,0.05)',
                                    '& fieldset': { border: 'none' }
                                }
                            }}
                        />
                        <Button 
                            variant="contained" 
                            onClick={() => setScannerDialogOpen(true)}
                            sx={{ 
                                bgcolor: '#3b82f6', 
                                '&:hover': { bgcolor: '#2563eb' },
                                whiteSpace: 'nowrap',
                                px: 3,
                                borderRadius: 1.5,
                                textTransform: 'none',
                                fontWeight: 600
                            }}
                            startIcon={<ScannerIcon />}
                        >
                            Scan
                        </Button>
                    </Box>
                </Box>
            </Paper>

            <TableContainer component={Paper} sx={{ 
                bgcolor: '#1e293b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 2,
                animation: `slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.1s both`,
                '@keyframes slideUp': {
                    '0%': { opacity: 0, transform: 'translateY(30px)' },
                    '100%': { opacity: 1, transform: 'translateY(0)' }
                }
            }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Image</TableCell>
                            <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Product Name</TableCell>
                            <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>SKU</TableCell>
                            <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Category</TableCell>
                            {/* Branch selected: show Price column */}
                            {selectedBranchId !== 'global' && (
                                <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Price</TableCell>
                            )}
                            <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Stock</TableCell>
                            {/* Global view: show Available In column */}
                            {isAdmin && selectedBranchId === 'global' && (
                                <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Available In</TableCell>
                            )}
                            {/* Branch selected: show Actions column */}
                            {selectedBranchId !== 'global' && (
                                <TableCell align="right" sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Actions</TableCell>
                            )}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredProducts.map((product, index) => (
                            <Fade in={true} timeout={500} style={{ transitionDelay: `${index * 150}ms` }} key={product._id}>
                                <TableRow 
                                    id={`product-row-${product._id}`}
                                    sx={{ 
                                        '&:hover': { 
                                            bgcolor: 'rgba(255, 255, 255, 0.04)',
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 8px 25px -5px rgba(0,0,0,0.5)',
                                            zIndex: 10,
                                            position: 'relative'
                                        },
                                        bgcolor: highlightedProductId === product._id ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                                        transition: 'all 0.2s ease-in-out'
                                    }}
                                >
                                <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <Avatar 
                                        src={product.imageUrl ? `http://localhost:5000${product.imageUrl}` : undefined} 
                                        variant="rounded" 
                                        sx={{ width: 44, height: 44, bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}
                                    >
                                        {!product.imageUrl && <InventoryIcon />}
                                    </Avatar>
                                </TableCell>
                                <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <Typography variant="body2" fontWeight="600">{product.name}</Typography>
                                    <Typography variant="caption" color="#94a3b8">{product.brand}</Typography>
                                </TableCell>
                                <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{product.sku}</TableCell>
                                <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <Chip label={product.category?.name || (typeof product.category === 'string' ? product.category : 'Unknown')} size="small" sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }} />
                                </TableCell>
                                {/* Branch selected: show Price cell */}
                                {selectedBranchId !== 'global' && (
                                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>LKR {product.sellingPrice}</TableCell>
                                )}
                                <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <Chip 
                                        label={product.stock} 
                                        size="small" 
                                        color={product.stock <= product.reorderLevel ? "error" : "success"}
                                    />
                                </TableCell>
                                {/* Global: Available In chips */}
                                {isAdmin && selectedBranchId === 'global' && (
                                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                            {product.branchData && product.branchData.map(b => {
                                                const branchRef = b.branch;
                                                const brName = branchRef?.name || branches.find(br => br._id === (branchRef?._id || branchRef))?.name;
                                                return brName ? (
                                                    <Chip
                                                        key={b._id || brName}
                                                        label={brName}
                                                        size="small"
                                                        sx={{ bgcolor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', fontSize: '0.7rem', fontWeight: 600 }}
                                                    />
                                                ) : null;
                                            })}
                                        </Box>
                                    </TableCell>
                                )}
                                {/* Branch selected: Action buttons */}
                                {selectedBranchId !== 'global' && (
                                    <TableCell align="right" sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <IconButton onClick={() => handleOpenBarcode(product)} sx={{ color: '#a855f7' }} size="small" title="Print Barcode">
                                            <BarcodeIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton onClick={() => handleOpenEdit(product)} sx={{ color: '#60a5fa' }} size="small">
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton onClick={() => handleOpenDeleteDialog(product._id)} sx={{ color: '#ef4444' }} size="small">
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                )}
                                </TableRow>
                            </Fade>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <ProductDialog 
                open={dialogOpen} 
                handleClose={handleCloseDialog}
                formData={formData}
                setFormData={setFormData}
                handleSubmit={handleSubmit}
                isEditing={isEditing}
                categories={categories}
                branches={branches}
                defaultBranchId={selectedBranchId}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleCloseDeleteDialog}
                sx={{
                    '& .MuiDialog-paper': {
                        bgcolor: '#1e293b',
                        color: '#fff',
                        borderRadius: 3,
                        minWidth: { xs: '90%', sm: '400px' },
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 600 }}>Delete Product</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: '#94a3b8' }}>
                        Are you sure you want to delete this product? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2, pt: 0 }}>
                    <Button onClick={handleCloseDeleteDialog} sx={{ color: '#94a3b8', textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
                    <Button onClick={confirmDelete} variant="contained" color="error" sx={{ textTransform: 'none', borderRadius: 1.5, fontWeight: 600 }}>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Barcode Print Dialog */}
            <Dialog
                open={barcodeDialogOpen}
                onClose={handleCloseBarcode}
                sx={{
                    '& .MuiDialog-paper': {
                        bgcolor: '#1e293b',
                        color: '#fff',
                        borderRadius: 3,
                        minWidth: { xs: '90%', sm: '400px' },
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Product Barcode
                    <IconButton onClick={handlePrintBarcode} sx={{ color: '#3b82f6' }}>
                        <PrintIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                    {selectedBarcodeProduct && (
                        <Box id="print-barcode-area" sx={{ bgcolor: '#fff', p: 2, borderRadius: 1, display: 'inline-block' }}>
                            <Barcode 
                                value={selectedBarcodeProduct.barcodeValue || selectedBarcodeProduct.sku || 'UNKNOWN'} 
                                width={2}
                                height={60}
                                fontSize={16}
                            />
                        </Box>
                    )}
                    <Typography variant="body2" sx={{ mt: 2, color: '#94a3b8' }}>
                        {selectedBarcodeProduct?.name}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleCloseBarcode} sx={{ color: '#94a3b8', textTransform: 'none', fontWeight: 600 }}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar Notification */}
            <Snackbar 
                open={snackbar.open} 
                autoHideDuration={5000} 
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled" sx={{ width: '100%', borderRadius: 2 }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {/* Webcam Scanner Dialog */}
            <Dialog
                open={scannerDialogOpen}
                onClose={() => setScannerDialogOpen(false)}
                sx={{
                    '& .MuiDialog-paper': {
                        bgcolor: '#1e293b',
                        color: '#fff',
                        borderRadius: 3,
                        minWidth: { xs: '90%', sm: '500px' },
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 600 }}>Scan Product Barcode</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box id="reader" sx={{ width: '100%', maxWidth: '400px', mt: 2 }}></Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setScannerDialogOpen(false)} sx={{ color: '#94a3b8', textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ProductList;
