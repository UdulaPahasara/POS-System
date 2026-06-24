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
import { Html5QrcodeScanner } from 'html5-qrcode';

const ProductDialog = ({ open, handleClose, formData, setFormData, handleSubmit, isEditing, categories = [] }) => {
    
    const [isScanning, setIsScanning] = React.useState(false);

    React.useEffect(() => {
        let scanner = null;
        if (isScanning && open) {
            // Slight delay to ensure the div is rendered
            setTimeout(() => {
                scanner = new Html5QrcodeScanner(
                    "reader",
                    { fps: 10, qrbox: {width: 250, height: 100} },
                    false
                );
                scanner.render(
                    (decodedText) => {
                        setFormData(prev => ({ ...prev, barcodeValue: decodedText }));
                        setIsScanning(false);
                        scanner.clear();
                    },
                    (error) => {
                        // ignore errors during scanning
                    }
                );
            }, 100);
        }
        return () => {
            if (scanner) {
                scanner.clear().catch(error => {
                    console.error("Failed to clear html5QrcodeScanner. ", error);
                });
            }
        };
    }, [isScanning, setFormData, open]);

    const generateBarcode = () => {
        const randomBarcode = Math.floor(100000000000 + Math.random() * 900000000000).toString();
        setFormData(prev => ({ ...prev, barcodeValue: randomBarcode }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
                                        {categories.map((cat) => (
                                            <MenuItem key={cat._id} value={cat._id}>{cat.name}</MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField fullWidth label="SKU" name="sku" value={formData.sku} onChange={handleChange} required variant="outlined" sx={inputStyles} placeholder="e.g. ELEC-001" />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth label="Barcode" name="barcodeValue" value={formData.barcodeValue || ''} onChange={handleChange} variant="outlined" sx={inputStyles} placeholder="Scan or type" />
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
                                        <Button variant="outlined" size="small" onClick={() => setIsScanning(!isScanning)} sx={{ color: '#3b82f6', borderColor: 'rgba(59, 130, 246, 0.5)', textTransform: 'none', fontWeight: 600 }}> 
                                            {isScanning ? 'Cancel Scan' : 'Scan Barcode'} 
                                        </Button>
                                        <Button variant="outlined" size="small" onClick={generateBarcode} sx={{ color: '#3b82f6', borderColor: 'rgba(59, 130, 246, 0.5)', textTransform: 'none', fontWeight: 600 }}> 
                                            Generate Random 
                                        </Button>
                                    </Box>
                                    {isScanning && (
                                        <Box sx={{ mt: 2, bgcolor: '#fff', p: 1, borderRadius: 1 }}>
                                            <div id="reader" width="100%"></div>
                                        </Box>
                                    )}
                                    {formData.barcodeValue && !isScanning && (
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
                                    <TextField fullWidth label={isEditing ? "Stock Quantity" : "Initial Stock"} name="stock" type="number" value={formData.stock !== undefined ? formData.stock : ''} onChange={handleChange} required variant="outlined" sx={inputStyles} placeholder="e.g. 50" />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField fullWidth label="Reorder Level" name="reorderLevel" type="number" value={formData.reorderLevel !== undefined ? formData.reorderLevel : ''} onChange={handleChange} required variant="outlined" sx={inputStyles} placeholder="e.g. 10" />
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
                                        <MenuItem value="none">None</MenuItem>
                                        <MenuItem value="fixed">Fixed Amount</MenuItem>
                                        <MenuItem value="percentage">Percentage</MenuItem>
                                    </TextField>
                                </Grid>
                                {/* Discount Amount */}
                                {formData.discountType !== 'none' && (
                                    <Grid item xs={12} sm={4}>
                                        <Box sx={{ position: 'relative', width: '100%' }}>
                                            <TextField
                                                key={`discount-field-${formData.discountType || 'none'}`}
                                                fullWidth
                                                label={formData.discountType === 'percentage' ? 'Discount Percentage' : 'Discount Amount'}
                                                name="discountAmount"
                                                type="number"
                                                value={formData.discountAmount === 0 ? '' : (formData.discountAmount !== undefined ? formData.discountAmount : '')}
                                                onChange={handleChange}
                                                variant="outlined"
                                                sx={{ 
                                                    ...inputStyles,
                                                    '& input': { pr: formData.discountType === 'percentage' ? '30px' : undefined }
                                                }}
                                                InputProps={{
                                                    startAdornment: formData.discountType !== 'percentage' ? (
                                                        <InputAdornment position="start">
                                                            <Typography sx={{color:'#94a3b8'}}>LKR </Typography>
                                                        </InputAdornment>
                                                    ) : null
                                                }}
                                            />
                                            {formData.discountType === 'percentage' && (
                                                <Box sx={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                                                    <Typography sx={{ color: '#94a3b8', fontSize: '1rem' }}>%</Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    </Grid>
                                )}
                            </Grid>
                        </Grid>
                    </Grid>

                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />

                    {/* Section 3: Media & Description */}
                    <Grid container spacing={4}>
                        <Grid item xs={12} md={3}>
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
                        <Grid item xs={12} md={9}>
                            <Grid container spacing={2.5}>
                                <Grid item xs={12} sm={9}>
                                    <TextField fullWidth label="Product Description" name="description" multiline rows={5} value={formData.description} onChange={handleChange} variant="outlined" sx={inputStyles} placeholder="Write a short description of the product..." />
                                </Grid>
                                <Grid item xs={12} sm={3} sx={{ display: 'flex', flexDirection: 'column' }}>
                                    <Box 
                                        component="label" 
                                        sx={{ 
                                            display: 'flex', 
                                            flexDirection: 'column', 
                                            alignItems: 'center', 
                                            justifyContent: 'center', 
                                            width: '100%', 
                                            flex: 1, 
                                            minHeight: '140px', 
                                            borderColor: formData.image ? 'rgba(74, 222, 128, 0.5)' : 'rgba(255,255,255,0.1)', 
                                            borderStyle: 'dashed', 
                                            borderWidth: 2, 
                                            borderRadius: 2, 
                                            transition: 'all 0.2s ease', 
                                            '&:hover': { borderColor: '#3b82f6', bgcolor: 'rgba(59, 130, 246, 0.05)' }, 
                                            position: 'relative', 
                                            overflow: 'hidden',
                                            cursor: 'pointer',
                                            boxSizing: 'border-box',
                                            p: 2
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, opacity: formData.image ? 0 : 1, transition: 'opacity 0.2s' }}>
                                            <CloudUploadIcon sx={{ fontSize: 36, color: '#3b82f6' }} />
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#94a3b8', textAlign: 'center' }}>
                                                Upload Image
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                                                PNG, JPG, GIF
                                            </Typography>
                                        </Box>
                                        {formData.image && (
                                            <Box sx={{ position: 'absolute', inset: 0, p: 1 }}>
                                                <img 
                                                    src={typeof formData.image === 'string' ? `http://localhost:5000${formData.image}` : URL.createObjectURL(formData.image)} 
                                                    alt="Product Preview" 
                                                    style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '4px' }} 
                                                />
                                                <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.6)', opacity: 0, transition: 'opacity 0.2s', '&:hover': { opacity: 1 }, borderRadius: '4px' }}>
                                                    <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>Change</Typography>
                                                </Box>
                                            </Box>
                                        )}
                                        <input type="file" hidden accept="image/*" onChange={(e) => { if (e.target.files && e.target.files[0]) { setFormData(prev => ({ ...prev, image: e.target.files[0] })); } }} />
                                    </Box>
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
