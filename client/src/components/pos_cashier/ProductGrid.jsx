import React, { useState } from 'react';
import { Box, Typography, TextField, InputAdornment, Grid, Card, CardContent, CardMedia, Chip } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const ProductGrid = ({ products, onAddToCart, customerSelectorNode }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    const getCategoryName = (c) => typeof c === 'object' ? c?.name : c;
    
    // Extract unique categories
    const categories = ['All', ...new Set(products.map(p => getCategoryName(p.category) || 'Unknown'))];

    // Filter products
    const filteredProducts = products.filter(p => {
        const catName = getCategoryName(p.category) || 'Unknown';
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              catName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'All' || catName === activeCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Search and Filter Bar */}
            <Box sx={{ mb: 3 }}>
                <TextField
                    fullWidth
                    placeholder="Search by Name, SKU, Barcode, or Category..."
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
                            bgcolor: '#1e293b',
                            borderRadius: 3,
                            '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                            '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                            '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                        }
                    }}
                />
            </Box>

            {/* Customer Selector Block */}
            {customerSelectorNode && (
                <Box sx={{ mb: 3 }}>
                    {customerSelectorNode}
                </Box>
            )}

            {/* Category Chips */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3, pb: 1 }}>
                {categories.map(cat => (
                    <Chip
                        key={cat}
                        label={cat}
                        onClick={() => setActiveCategory(cat)}
                        sx={{
                            bgcolor: activeCategory === cat ? '#3b82f6' : '#1e293b',
                            color: activeCategory === cat ? '#fff' : '#94a3b8',
                            fontSize: '0.9rem',
                            fontWeight: activeCategory === cat ? 600 : 400,
                            px: 1,
                            py: 2,
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: activeCategory === cat ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                            '&:hover': { bgcolor: activeCategory === cat ? '#2563eb' : 'rgba(255,255,255,0.05)' }
                        }}
                    />
                ))}
            </Box>

            {/* Product Cards */}
            <Grid container spacing={2} sx={{ 
                overflowY: 'auto', 
                pr: 1,
                '&::-webkit-scrollbar': { display: 'none' },
                msOverflowStyle: 'none',
                scrollbarWidth: 'none',
            }}>
                {filteredProducts.map(product => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
                        <Card 
                            onClick={() => product.stock > 0 && onAddToCart(product)}
                            sx={{ 
                                bgcolor: '#1e293b', 
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 3,
                                cursor: product.stock > 0 ? 'pointer' : 'not-allowed',
                                opacity: product.stock > 0 ? 1 : 0.5,
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                '&:hover': product.stock > 0 ? {
                                    transform: 'translateY(-4px)',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                                    borderColor: 'rgba(59, 130, 246, 0.5)'
                                } : {}
                            }}
                        >
                            {product.imageUrl ? (
                                <CardMedia
                                    component="img"
                                    height="120"
                                    image={`http://localhost:5000${product.imageUrl}`}
                                    alt={product.name}
                                    sx={{ objectFit: 'contain', bgcolor: '#fff', p: 1 }}
                                />
                            ) : (
                                <Box sx={{ height: 120, bgcolor: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>No Image</Typography>
                                </Box>
                            )}
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                <Typography variant="caption" sx={{ display: 'block', color: product.stock > 0 ? '#10b981' : '#ef4444', fontWeight: 700, mb: 0.5, textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.7rem' }}>
                                    {product.stock > 0 ? `${product.stock} left in stock` : 'Out of Stock'}
                                </Typography>
                                <Typography variant="body1" sx={{ color: '#fff', fontWeight: 600, noWrap: true, mb: 0.5 }}>
                                    {product.name}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography variant="h6" sx={{ color: '#60a5fa', fontWeight: 700 }}>
                                        LKR {product.sellingPrice.toFixed(2)}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
                {filteredProducts.length === 0 && (
                    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', p: 5 }}>
                        <Typography sx={{ color: '#94a3b8' }}>No products found.</Typography>
                    </Box>
                )}
            </Grid>
        </Box>
    );
};

export default ProductGrid;
