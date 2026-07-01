import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, Button } from '@mui/material';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';

export default function ConfirmDialog({
    open, title = 'Xác nhận', message, confirmLabel = 'Xóa', loading = false,
    onConfirm, onCancel,
}) {
    return (
        <Dialog open={open} onClose={loading ? undefined : onCancel} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningAmberOutlinedIcon color="error" fontSize="small" />
                {title}
            </DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary">{message}</Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel} disabled={loading}>Hủy</Button>
                <Button variant="contained" color="error" onClick={onConfirm} disabled={loading}>
                    {loading ? 'Đang xử lý...' : confirmLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
