import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography } from '@mui/material';
import { Html5QrcodeScanner } from 'html5-qrcode';

const ScannerCore = ({ onScan }) => {
    useEffect(() => {
        let scanner;
        const timer = setTimeout(() => {
            const readerElement = document.getElementById("reader");
            if (readerElement) {
                scanner = new Html5QrcodeScanner(
                    "reader",
                    { fps: 10, qrbox: { width: 250, height: 150 } },
                    /* verbose= */ false
                );

                scanner.render(
                    (decodedText) => {
                        if (scanner) {
                            scanner.clear();
                        }
                        onScan(decodedText);
                    },
                    (error) => {}
                );
            }
        }, 150); // slight delay to ensure Dialog portal is mounted

        return () => {
            clearTimeout(timer);
            if (scanner) {
                scanner.clear().catch(error => {
                    console.error("Failed to clear html5QrcodeScanner. ", error);
                });
            }
        };
    }, [onScan]);

    return <Box id="reader" sx={{ width: '100%', mb: 2, '& video': { borderRadius: 2 } }}></Box>;
};

const CameraScannerDialog = ({ open, onClose, onScan }) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth TransitionProps={{ unmountOnExit: true }}>
            <DialogTitle sx={{ bgcolor: '#1e293b', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                Scan Barcode
            </DialogTitle>
            <DialogContent sx={{ bgcolor: '#1e293b', p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {open && <ScannerCore onScan={onScan} />}
                <Typography variant="body2" color="#94a3b8">
                    Hold barcode in front of camera
                </Typography>
            </DialogContent>
            <DialogActions sx={{ bgcolor: '#1e293b', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <Button onClick={onClose} sx={{ color: '#fff' }}>Cancel</Button>
            </DialogActions>
        </Dialog>
    );
};

export default CameraScannerDialog;
