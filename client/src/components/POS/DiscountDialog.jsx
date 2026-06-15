import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, RadioGroup, FormControlLabel, Radio, Typography } from '@mui/material';

/**
 * DiscountDialog allows cashiers to apply a discount to the current order.
 * Supports Percentage (e.g., 10%) or Fixed amount (e.g., LKR 5).
 */
const DiscountDialog = ({ open, onClose, onApply }) => {
  const [type, setType] = useState('percentage'); // 'percentage' | 'fixed'
  const [value, setValue] = useState('');

  const handleApply = () => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) return;
    onApply({ type, amount: num });
    setValue('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Apply Discount</DialogTitle>
      <DialogContent dividers>
        <RadioGroup row value={type} onChange={e => setType(e.target.value)}>
          <FormControlLabel value="percentage" control={<Radio />} label="%" />
          <FormControlLabel value="fixed" control={<Radio />} label="LKR" />
        </RadioGroup>
        <TextField
          autoFocus
          fullWidth
          label={type === 'percentage' ? 'Percentage (0-100)' : 'Fixed Amount'}
          type="number"
          value={value}
          onChange={e => setValue(e.target.value)}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined" sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button onClick={handleApply} variant="contained" color="primary" sx={{ textTransform: 'none' }}>Apply</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DiscountDialog;
