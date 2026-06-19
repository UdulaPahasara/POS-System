import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
    Paper, Typography, Button, Chip, Avatar, Snackbar, Alert 
} from '@mui/material';
import { Inventory2 as InventoryIcon, Edit as EditIcon } from '@mui/icons-material';
import StockAdjustDialog from './StockAdjustDialog';
import { useNotifications } from '../../../context/NotificationContext';
import { productsApi } from '../../../services/productsApi';

const StockTable = () => {
    const [products, setProducts] = useState([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [highlightId, setHighlightId] = useState(null);
    const location = useLocation();

    const fetchProducts = async () => {
        try {
            const data = await productsApi.getAllProducts();
            if (data) setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const { socket } = useNotifications();
    useEffect(() => {
        if (!socket) return;
        const handleUpdate = (data) => {
            if (data.type === 'PRODUCT' || data.type === 'SALE' || data.type === 'PURCHASE_ORDER' || data.type === 'PURCHASE_RETURN') {
                fetchProducts();
            }
        };
        socket.on('data_updated', handleUpdate);
        return () => socket.off('data_updated', handleUpdate);
    }, [socket]);

    useEffect(() => {
        if (products.length > 0 && location.state?.highlightProductId) {
            const id = location.state.highlightProductId;
            setHighlightId(id);
            setTimeout(() => {
                const element = document.getElementById(`product-row-${id}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);

            // Remove highlight after 5 seconds
            const timer = setTimeout(() => {
                setHighlightId(null);
                // Clean up state so refresh doesn't trigger it again
                window.history.replaceState({}, document.title)
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [products, location.state]);

    const handleOpenDialog = (product) => {
        setSelectedProduct(product);
        setDialogOpen(true);
    };

    const handleCloseDialog = (refresh = false) => {
        setDialogOpen(false);
        setSelectedProduct(null);
        if (refresh) {
            fetchProducts();
            setSnackbar({ open: true, message: 'Stock adjusted successfully!', severity: 'success' });
        }
    };

    const getStockStatus = (stock, reorderLevel) => {
        if (stock === 0) return <Chip label="Out of Stock" color="error" size="small" />;
        if (stock <= reorderLevel) return <Chip label="Low Stock" color="warning" size="small" />;
        return <Chip label="In Stock" color="success" size="small" />;
    };

    return (
        <>
            <TableContainer component={Paper} sx={{ bgcolor: '#1e293b', borderRadius: 2 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Product</TableCell>
                            <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>SKU</TableCell>
                            <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Current Stock</TableCell>
                            <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Reorder Level</TableCell>
                            <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Status</TableCell>
                            <TableCell align="right" sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {products.map((product) => (
                            <TableRow 
                                key={product._id} 
                                id={`product-row-${product._id}`}
                                sx={{ 
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' },
                                    transition: 'background-color 0.5s ease',
                                    bgcolor: highlightId === product._id ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                                    ...(highlightId === product._id && {
                                        boxShadow: 'inset 0 0 0 2px rgba(59, 130, 246, 0.5)'
                                    })
                                }}
                            >
                                <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Avatar 
                                        src={product.imageUrl ? `http://localhost:5000${product.imageUrl}` : undefined} 
                                        variant="rounded" 
                                        sx={{ width: 40, height: 40, bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}
                                    >
                                        {!product.imageUrl && <InventoryIcon fontSize="small" />}
                                    </Avatar>
                                    <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>{product.name}</Typography>
                                </TableCell>
                                <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{product.sku}</TableCell>
                                <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: 800 }}>{product.stock}</TableCell>
                                <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{product.reorderLevel}</TableCell>
                                <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    {getStockStatus(product.stock, product.reorderLevel)}
                                </TableCell>
                                <TableCell align="right" sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <Button 
                                        variant="outlined" 
                                        size="small" 
                                        startIcon={<EditIcon />}
                                        onClick={() => handleOpenDialog(product)}
                                        sx={{ color: '#60a5fa', borderColor: 'rgba(96, 165, 250, 0.5)', textTransform: 'none' }}
                                    >
                                        Adjust
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {selectedProduct && (
                <StockAdjustDialog 
                    open={dialogOpen} 
                    handleClose={handleCloseDialog} 
                    product={selectedProduct} 
                />
            )}

            <Snackbar 
                open={snackbar.open} 
                autoHideDuration={4000} 
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%', borderRadius: 2 }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default StockTable;
