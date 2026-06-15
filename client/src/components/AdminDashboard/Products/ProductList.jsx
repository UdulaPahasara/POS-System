import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Paper, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, IconButton, Button,
    Chip, InputAdornment, TextField, Avatar,
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
    Snackbar, Alert
} from '@mui/material';
import { 
    Edit as EditIcon, 
    Delete as DeleteIcon, 
    Add as AddIcon,
    Search as SearchIcon,
    Inventory2 as InventoryIcon,
    QrCode as QrCodeIcon,
    Print as PrintIcon
} from '@mui/icons-material';
import ProductDialog from './ProductDialog';
import Barcode from 'react-barcode';

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    
    // New states for Delete Dialog and Snackbar
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // States for Barcode Dialog
    const [barcodeDialogOpen, setBarcodeDialogOpen] = useState(false);
    const [selectedBarcodeProduct, setSelectedBarcodeProduct] = useState(null);

    const defaultForm = {
        name: '', sku: '', barcodeValue: '', brand: '', category: 'Electronics', 
        costPrice: '', sellingPrice: '', reorderLevel: '', description: '', image: '',
        discountType: 'fixed', discountAmount: 0
    };
    const [formData, setFormData] = useState(defaultForm);

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
            console.error('Error fetching products:', error);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

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
            discountType: product.discount?.type || 'fixed',
            discountAmount: product.discount?.amount || 0
        });
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
    };

    const handleSubmit = async () => {
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                if (key !== '_id' && key !== 'id' && formData[key] !== null && formData[key] !== undefined) {
                    data.append(key, formData[key]);
                }
            });

            const url = isEditing ? `http://localhost:5000/api/products/${formData._id}` : 'http://localhost:5000/api/products';
            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Authorization': `Bearer ${token}` },
                body: data
            });

            if (response.ok) {
                fetchProducts();
                handleCloseDialog();
                setSnackbar({ 
                    open: true, 
                    message: isEditing ? 'Product updated successfully!' : 'Product added successfully!', 
                    severity: 'success' 
                });
            } else {
                const resData = await response.json();
                setSnackbar({ 
                    open: true, 
                    message: resData.message || 'Error saving product', 
                    severity: 'error' 
                });
            }
        } catch (error) {
            console.error('Error saving product:', error);
            setSnackbar({ open: true, message: 'Server error saving product', severity: 'error' });
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
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/products/${productToDelete}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                fetchProducts();
                setSnackbar({ open: true, message: 'Product deleted successfully!', severity: 'success' });
            } else {
                setSnackbar({ open: true, message: 'Failed to delete product', severity: 'error' });
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            setSnackbar({ open: true, message: 'Server error deleting product', severity: 'error' });
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

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ color: '#fff', fontWeight: 600 }}>Products</Typography>
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
                <TextField
                    fullWidth
                    placeholder="Search by product name or SKU..."
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
            </Paper>

            <TableContainer component={Paper} sx={{ bgcolor: '#1e293b', borderRadius: 2 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Image</TableCell>
                            <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Product Name</TableCell>
                            <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>SKU</TableCell>
                            <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Category</TableCell>
                            <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Price</TableCell>
                            <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Stock</TableCell>
                            <TableCell align="right" sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredProducts.map((product) => (
                            <TableRow key={product._id} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
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
                                    <Chip label={product.category} size="small" sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }} />
                                </TableCell>
                                <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>LKR {product.sellingPrice}</TableCell>
                                <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <Chip 
                                        label={product.stock} 
                                        size="small" 
                                        color={product.stock <= product.reorderLevel ? "error" : "success"}
                                    />
                                </TableCell>
                                <TableCell align="right" sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <IconButton onClick={() => handleOpenBarcode(product)} sx={{ color: '#a855f7' }} size="small" title="Print Barcode">
                                        <QrCodeIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton onClick={() => handleOpenEdit(product)} sx={{ color: '#60a5fa' }} size="small">
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton onClick={() => handleOpenDeleteDialog(product._id)} sx={{ color: '#ef4444' }} size="small">
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
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
                autoHideDuration={4000} 
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled" sx={{ width: '100%', borderRadius: 2 }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ProductList;
