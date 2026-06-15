import React from 'react';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, 
    Button, TextField, Grid, MenuItem, Box, Typography, Divider, InputAdornment, IconButton
} from '@mui/material';
import { 
    CloudUpload as CloudUploadIcon,
    InfoOutlined as InfoIcon,
    MonetizationOnOutlined as MoneyIcon,
    ImageOutlined as ImageIcon,
    Inventory2Outlined as InventoryIcon,
    Close as CloseIcon,
    Print as PrintIcon
} from '@mui/icons-material';
import Barcode from 'react-barcode';

const ProductDialog = ({ open, handleClose, formData, setFormData, handleSubmit, isEditing }) => {
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const generateBarcode = () => {
        const randomBarcode = Math.floor(100000000000 + Math.random() * 900000000000).toString();
        setFormData(prev => ({ ...prev, barcodeValue: randomBarcode }));
    };

    const handlePrintBarcode = () => {
        if (!formData.barcodeValue) return;
        const printContent = document.getElementById('dialog-print-barcode-area');
        if (!printContent) return;
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

    return (
        <Dialog 
            open={open} 
            onClose={handleClose} 
            maxWidth="md" 
            fullWidth
            sx={{
                '& .MuiDialog-paper': {
                    bgcolor: '#0f172a',
                    color: '#fff',
                    borderRadius: 3,
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }
            }}
        >
            <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', p: 1, borderRadius: 2, display: 'flex' }}>
                        <InventoryIcon sx={{ color: '#3b82f6' }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {isEditing ? 'Edit Product' : 'Add New Product'}
                    </Typography>
                </Box>
                <IconButton onClick={handleClose} sx={{ color: '#94a3b8', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.05)' } }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            
            <DialogContent sx={{ p: { xs: 2, sm: 4 }, overflowX: 'hidden' }}>
                <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 5, mt: 1 }}>
                    
                    {/* Section 1: Basic Information */}
                    <Grid container spacing={4}>
                        <Grid item xs={12} md={3}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <InfoIcon sx={{ color: '#60a5fa', fontSize: 20 }} />
                                <Typography variant="subtitle2" sx={{ color: '#60a5fa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    Basic Details
                                </Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', lineHeight: 1.5 }}>
                                Core product identity and categorization for the catalog.
                            </Typography>
                        </Grid>
                        <Grid item xs={12} md={9}>
                            <Grid container spacing={2.5}>
                                <Grid item xs={12} sm={4}>
                                    <TextField fullWidth label="Product Name" name="name" value={formData.name} onChange={handleChange} required variant="outlined" sx={inputStyles} placeholder="e.g. Wireless Mouse" />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField fullWidth label="Category" name="category" select value={formData.category} onChange={handleChange} variant="outlined" sx={{ ...inputStyles, '& .MuiFormControl-root, & .MuiInputBase-root, & .MuiSelect-select': { width: '220px' } }}>
                                        <MenuItem value="Electronics">Electronics</MenuItem>
                                        <MenuItem value="Clothing">Clothing</MenuItem>
                                        <MenuItem value="Food">Food</MenuItem>
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField fullWidth label="SKU" name="sku" value={formData.sku} onChange={handleChange} required variant="outlined" sx={inputStyles} placeholder="e.g. ELEC-001" />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth label="Barcode" name="barcodeValue" value={formData.barcodeValue || ''} onChange={handleChange} variant="outlined" sx={inputStyles} placeholder="Scan or generate" InputProps={{ endAdornment: ( <InputAdornment position="end"> <Button variant="text" size="small" onClick={generateBarcode} sx={{ color: '#3b82f6', textTransform: 'none', fontWeight: 600, p: 0.5 }}> Generate </Button> </InputAdornment> ) }} />
                                    {formData.barcodeValue && (
                                        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: '#fff', p: 1, borderRadius: 1 }}>
                                            <Box id="dialog-print-barcode-area" sx={{ display: 'inline-block' }}>
                                                <Barcode value={formData.barcodeValue} width={1.5} height={40} fontSize={14} />
                                            </Box>
                                            <Button size="small" startIcon={<PrintIcon />} onClick={handlePrintBarcode} sx={{ mt: 1, textTransform: 'none' }}>Print</Button>
                                        </Box>
                                    )}
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth label="Brand" name="brand" value={formData.brand} onChange={handleChange} variant="outlined" sx={inputStyles} placeholder="e.g. Logitech" />
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>

                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />

                    {/* Section 2: Pricing & Inventory */}
                    <Grid container spacing={4}>
                        <Grid item xs={12} md={3}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <MoneyIcon sx={{ color: '#60a5fa', fontSize: 20 }} />
                                <Typography variant="subtitle2" sx={{ color: '#60a5fa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    Pricing & Stock
                                </Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', lineHeight: 1.5 }}>
                                Setup cost margins and low stock reorder thresholds.
                            </Typography>
                        </Grid>
                        <Grid item xs={12} md={9}>
                            <Grid container spacing={2.5}>
                                <Grid item xs={12} sm={4}>
                                    <TextField fullWidth label="Cost Price" name="costPrice" type="number" value={formData.costPrice} onChange={handleChange} required variant="outlined" sx={inputStyles} InputProps={{ startAdornment: <InputAdornment position="start"><Typography sx={{color:'#94a3b8'}}>LKR </Typography></InputAdornment> }} />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField fullWidth label="Selling Price" name="sellingPrice" type="number" value={formData.sellingPrice} onChange={handleChange} required variant="outlined" sx={inputStyles} InputProps={{ startAdornment: <InputAdornment position="start"><Typography sx={{color:'#94a3b8'}}>LKR </Typography></InputAdornment> }} />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField fullWidth label="Reorder Level" name="reorderLevel" type="number" value={formData.reorderLevel} onChange={handleChange} required variant="outlined" sx={inputStyles} placeholder="e.g. 10" />
                                </Grid>
                                {/* Discount Type */}
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        fullWidth
                                        select
                                        label="Discount Type"
                                        name="discountType"
                                        value={formData.discountType || 'fixed'}
                                        onChange={handleChange}
                                        variant="outlined"
                                        sx={inputStyles}
                                    >
                                        <MenuItem value="fixed">Fixed Amount</MenuItem>
                                        <MenuItem value="percentage">Percentage</MenuItem>
                                    </TextField>
                                </Grid>
                                {/* Discount Amount */}
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        fullWidth
                                        label="Discount Amount"
                                        name="discountAmount"
                                        type="number"
                                        value={formData.discountAmount || 0}
                                        onChange={handleChange}
                                        variant="outlined"
                                        sx={inputStyles}
                                        InputProps={{ startAdornment: (
                                            <InputAdornment position="start">
                                                {formData.discountType === 'percentage' ? '%' : 'LKR '}
                                            </InputAdornment>
                                        )}}
                                    />
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>

                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />

                    {/* Section 3: Media & Description */}
                    <Grid container spacing={4}>
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <ImageIcon sx={{ color: '#60a5fa', fontSize: 20 }} />
                                <Typography variant="subtitle2" sx={{ color: '#60a5fa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    Media & Description
                                </Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', lineHeight: 1.5, mb: 1 }}>
                                Product image and description shown on the POS screen and customer receipts.
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Grid container spacing={2.5}>
                                <Grid item xs={12} sm={8}>
                                    <TextField fullWidth label="Product Description" name="description" multiline rows={5} value={formData.description} onChange={handleChange} variant="outlined" sx={inputStyles} placeholder="Write a short description of the product..." />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Button variant="outlined" component="label" fullWidth sx={{ height: '100%', minHeight: '140px', color: formData.image ? '#4ade80' : '#94a3b8', borderColor: formData.image ? 'rgba(74, 222, 128, 0.5)' : 'rgba(255,255,255,0.1)', borderStyle: 'dashed', borderWidth: 2, borderRadius: 2, textTransform: 'none', transition: 'all 0.2s ease', '&:hover': { borderColor: '#3b82f6', bgcolor: 'rgba(59, 130, 246, 0.05)', transform: 'translateY(-2px)' } }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                                            <CloudUploadIcon sx={{ fontSize: 36, color: formData.image ? '#4ade80' : '#3b82f6' }} />
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {formData.image ? 'Image Selected' : 'Upload Image'}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                                                PNG, JPG, GIF up to 5MB
                                            </Typography>
                                        </Box>
                                        <input type="file" hidden accept="image/*" onChange={(e) => { if (e.target.files && e.target.files[0]) { setFormData(prev => ({ ...prev, image: e.target.files[0] })); } }} />
                                    </Button>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>

                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 2, borderTop: '1px solid rgba(255,255,255,0.05)', bgcolor: 'rgba(0,0,0,0.2)' }}>
                <Button onClick={handleClose} sx={{ color: '#94a3b8', fontWeight: 600, px: 3, '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}>
                    Cancel
                </Button>
                <Button 
                    onClick={handleSubmit} 
                    variant="contained" 
                    disableElevation
                    sx={{ bgcolor: '#3b82f6', fontWeight: 600, px: 4, py: 1, borderRadius: 2, textTransform: 'none', '&:hover': { bgcolor: '#2563eb' } }}
                >
                    {isEditing ? 'Save Changes' : 'Add Product'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

const inputStyles = {
    '& .MuiOutlinedInput-root': {
        color: '#fff',
        bgcolor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 2,
        transition: 'all 0.2s ease',
        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)', borderWidth: '1px' },
        '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
        '&.Mui-focused fieldset': { borderColor: '#3b82f6', borderWidth: '2px' },
        '&.Mui-focused': { bgcolor: 'rgba(59, 130, 246, 0.05)' }
    },
    '& .MuiInputLabel-root': { color: '#94a3b8' },
    '& .MuiInputLabel-root.Mui-focused': { color: '#3b82f6' },
    '& input[type=number]': { MozAppearance: 'textfield' },
    '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': { WebkitAppearance: 'none', margin: 0 },
};

export default ProductDialog;
