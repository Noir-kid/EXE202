import React, { useState, useEffect } from 'react';
import {
    Box, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, FormControl, InputLabel, Select, MenuItem, Typography,
    IconButton, Switch, FormControlLabel,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useTheme } from '@mui/material';
import { tokens } from '../../theme';
import Head from '../../Components/Head';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';
import { fetchWithAuth } from '../../Components/fetchWithAuth/fetchWithAuth';
import { API_BASE } from '../../config';
import ConfirmDialog from '../../Components/ConfirmDialog/ConfirmDialog';
import AddOutlinedIcon   from '@mui/icons-material/AddOutlined';
import EditOutlinedIcon  from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';

const blankForm = { branchId: '', date: '', reason: '', isRecurringYearly: false };

const Holiday = () => {
    const theme   = useTheme();
    const colors  = tokens(theme.palette.mode);
    const token   = sessionStorage.getItem('token');
    const decoded = token ? jwtDecode(token) : {};
    const myRole  = decoded.role || '';
    const isSuperAdmin = myRole === 'SuperAdmin';
    const canEdit = ['SuperAdmin', 'PartnerAdmin', 'BranchManager'].includes(myRole);

    const [rows, setRows]         = useState([]);
    const [branches, setBranches] = useState([]);
    const [openForm, setOpenForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(blankForm);
    const [saving, setSaving] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const dgSx = {
        border: 'none',
        borderRadius: 2,
        overflow: 'hidden',
        '& .MuiDataGrid-cell': { borderBottom: 'none', color: colors.grey[100] },
        '& .MuiDataGrid-row':          { borderBottom: `1px solid rgba(148,163,184,0.07)` },
        '& .MuiDataGrid-row.row-even': { background: colors.bg.card },
        '& .MuiDataGrid-row.row-odd':  { background: colors.bg.secondary },
        '& .MuiDataGrid-row:hover':    { background: `${colors.bg.cardHover} !important` },
        '& .MuiDataGrid-columnHeaders': { background: colors.blueAccent[800], borderBottom: 'none' },
        '& .MuiDataGrid-columnHeaderTitle': {
            fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.06em',
            textTransform: 'uppercase', color: colors.blueAccent[200],
        },
        '& .MuiDataGrid-virtualScroller':  { background: colors.bg.secondary },
        '& .MuiDataGrid-footerContainer':  { background: colors.blueAccent[800], borderTop: 'none' },
        '& .MuiTablePagination-root':      { color: colors.grey[200] },
        '& .MuiTablePagination-selectIcon':{ color: colors.grey[200] },
        '& .MuiDataGrid-sortIcon':         { color: colors.blueAccent[300] },
        '& .MuiDataGrid-menuIconButton':   { color: colors.grey[300] },
    };

    const fetchData = async () => {
        try {
            const [hRes, bRes] = await Promise.all([
                fetchWithAuth(`${API_BASE}/holidays`),
                fetchWithAuth(`${API_BASE}/branches/manage`),
            ]);
            const [holidays, brs] = await Promise.all([hRes.json(), bRes.json()]);
            setRows(holidays.map(h => ({ ...h, id: h.holidayId })));
            setBranches(brs);
        } catch (e) { console.error(e); }
    };

    useEffect(() => { fetchData(); }, []);

    const showError = async (res, fallback) => {
        try {
            const j = await res.json();
            toast.error(j.error || j.title || j.message || fallback);
        } catch { toast.error(fallback); }
    };

    const openAddDialog = () => {
        setEditingId(null);
        setForm({ ...blankForm, branchId: isSuperAdmin ? '' : (branches[0]?.branchId || '') });
        setOpenForm(true);
    };

    const openEditDialog = (row) => {
        setEditingId(row.holidayId);
        setForm({
            branchId: row.branchId || '',
            date: row.date,
            reason: row.reason,
            isRecurringYearly: row.isRecurringYearly,
        });
        setOpenForm(true);
    };

    const handleSave = async () => {
        if (!form.date)   { toast.warning('Vui lòng chọn ngày.'); return; }
        if (!form.reason) { toast.warning('Vui lòng nhập lý do.'); return; }
        setSaving(true);
        try {
            const body = {
                branchId: form.branchId || null,
                date: form.date,
                reason: form.reason,
                isRecurringYearly: form.isRecurringYearly,
            };
            const url = editingId ? `${API_BASE}/holidays/${editingId}` : `${API_BASE}/holidays`;
            const res = await fetchWithAuth(url, {
                method: editingId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
            });
            if (!res.ok) { await showError(res, 'Lưu ngày nghỉ thất bại.'); return; }
            toast.success(editingId ? 'Đã cập nhật ngày nghỉ.' : 'Đã thêm ngày nghỉ.');
            setOpenForm(false);
            fetchData();
        } catch { toast.error('Lỗi kết nối.'); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            const res = await fetchWithAuth(`${API_BASE}/holidays/${deleteTarget.holidayId}`, { method: 'DELETE' });
            if (res.ok) { toast.success('Đã xóa ngày nghỉ.'); setDeleteTarget(null); fetchData(); }
            else await showError(res, 'Xóa thất bại.');
        } catch { toast.error('Lỗi kết nối.'); }
        finally { setDeleting(false); }
    };

    const columns = [
        {
            field: 'date', headerName: 'Ngày', width: 130,
            renderCell: ({ value }) => new Date(value + 'T00:00:00').toLocaleDateString('vi-VN'),
        },
        { field: 'reason', headerName: 'Lý do', flex: 1 },
        {
            field: 'branchName', headerName: 'Phạm vi', width: 180,
            renderCell: ({ row }) => row.branchName
                ? <Chip label={row.branchName} size="small" />
                : <Chip label="Toàn hệ thống" size="small" color="info" />,
        },
        {
            field: 'isRecurringYearly', headerName: 'Lặp hàng năm', width: 130,
            renderCell: ({ value }) => value ? 'Có' : 'Không',
        },
        {
            field: 'actions', headerName: '', width: 120, sortable: false,
            renderCell: ({ row }) => canEdit && (
                <Box display="flex" gap={0.5} alignItems="center" height="100%">
                    <IconButton size="small" onClick={() => openEditDialog(row)}>
                        <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteTarget(row)}>
                        <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                </Box>
            ),
        },
    ];

    const dlgTitleSx = {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        pb: 1.5, background: colors.blueAccent[800],
    };

    return (
        <Box m="20px">
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Head title="Ngày nghỉ" subtitle="Quản lý ngày lễ / ngày đóng cửa" />
                {canEdit && (
                    <Button variant="contained" startIcon={<AddOutlinedIcon />}
                        sx={{ background: colors.blueAccent[800], textTransform: 'none', fontWeight: 600, px: 2.5 }}
                        onClick={openAddDialog}>
                        Thêm ngày nghỉ
                    </Button>
                )}
            </Box>

            <Box height="70vh" sx={dgSx}>
                <DataGrid
                    rows={rows} columns={columns} rowHeight={56}
                    pageSizeOptions={[20, 50]}
                    initialState={{ pagination: { paginationModel: { pageSize: 20 } } }}
                    disableRowSelectionOnClick
                    getRowClassName={p => p.indexRelativeToCurrentPage % 2 === 0 ? 'row-even' : 'row-odd'}
                />
            </Box>

            <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="sm" fullWidth
                PaperProps={{ sx: { borderRadius: 2 } }}>
                <DialogTitle sx={dlgTitleSx}>
                    <Typography fontWeight={700} fontSize={17}>
                        {editingId ? 'Sửa ngày nghỉ' : 'Thêm ngày nghỉ'}
                    </Typography>
                    <IconButton size="small" onClick={() => setOpenForm(false)} sx={{ color: 'inherit' }}>
                        <CloseOutlinedIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ px: 3, py: 2 }}>
                    <Box display="flex" flexDirection="column" gap={2} sx={{ pt: 1 }}>
                        <TextField label="Ngày *" size="small" fullWidth type="date"
                            InputLabelProps={{ shrink: true }}
                            value={form.date}
                            onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
                        <TextField label="Lý do *" size="small" fullWidth
                            placeholder="Ví dụ: Tết Nguyên Đán, Bảo trì hệ thống..."
                            value={form.reason}
                            onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} />
                        <FormControl fullWidth size="small">
                            <InputLabel>Phạm vi áp dụng</InputLabel>
                            <Select value={form.branchId} label="Phạm vi áp dụng"
                                onChange={e => setForm(p => ({ ...p, branchId: e.target.value }))}>
                                {isSuperAdmin && <MenuItem value="">Toàn hệ thống</MenuItem>}
                                {branches.map(b => (
                                    <MenuItem key={b.branchId} value={b.branchId}>{b.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControlLabel
                            control={<Switch checked={form.isRecurringYearly}
                                onChange={e => setForm(p => ({ ...p, isRecurringYearly: e.target.checked }))} />}
                            label="Lặp lại hàng năm (VD: Tết, Quốc khánh)" />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 1.5 }}>
                    <Button onClick={() => setOpenForm(false)} sx={{ textTransform: 'none' }}>Hủy</Button>
                    <Button variant="contained" onClick={handleSave} disabled={saving}
                        sx={{ textTransform: 'none', fontWeight: 600, minWidth: 90 }}>
                        {saving ? 'Đang lưu...' : 'Lưu'}
                    </Button>
                </DialogActions>
            </Dialog>

            <ConfirmDialog
                open={!!deleteTarget}
                title="Xóa ngày nghỉ"
                message={`Bạn có chắc muốn xóa ngày nghỉ "${deleteTarget?.reason}"?`}
                loading={deleting}
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </Box>
    );
};

export default Holiday;
