import React, { useState, useEffect } from 'react';
import {
    Box, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, FormControl, InputLabel, Select, MenuItem, Typography, IconButton,
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
import AddOutlinedIcon    from '@mui/icons-material/AddOutlined';
import DeleteOutlineIcon  from '@mui/icons-material/DeleteOutline';
import CloseOutlinedIcon  from '@mui/icons-material/CloseOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';

const STATUS_LABEL = { Scheduled: 'Đã lên lịch', InProgress: 'Đang bảo trì', Completed: 'Hoàn tất', Cancelled: 'Đã hủy' };
const STATUS_COLOR = { Scheduled: 'warning', InProgress: 'info', Completed: 'success', Cancelled: 'default' };
const blankForm = { courtId: '', startTime: '', endTime: '', reason: '' };

const Maintenance = () => {
    const theme   = useTheme();
    const colors  = tokens(theme.palette.mode);
    const token   = sessionStorage.getItem('token');
    const decoded = token ? jwtDecode(token) : {};
    const myRole  = decoded.role || '';
    const canEdit = ['SuperAdmin', 'PartnerAdmin', 'BranchManager'].includes(myRole);

    const [rows, setRows]     = useState([]);
    const [courts, setCourts] = useState([]);
    const [openForm, setOpenForm] = useState(false);
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
            const [mRes, cRes] = await Promise.all([
                fetchWithAuth(`${API_BASE}/maintenance-schedules`),
                fetchWithAuth(`${API_BASE}/courts/manage`),
            ]);
            const [maint, cts] = await Promise.all([mRes.json(), cRes.json()]);
            setRows(maint.map(m => ({ ...m, id: m.maintenanceId })));
            setCourts(cts);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        fetchData();
        const timer = setInterval(fetchData, 30000);
        return () => clearInterval(timer);
    }, []);

    const showError = async (res, fallback) => {
        try {
            const j = await res.json();
            toast.error(j.error || j.title || j.message || fallback);
        } catch { toast.error(fallback); }
    };

    const handleAdd = async () => {
        if (!form.courtId)   { toast.warning('Vui lòng chọn sân.'); return; }
        if (!form.startTime || !form.endTime) { toast.warning('Vui lòng chọn thời gian bắt đầu/kết thúc.'); return; }
        if (!form.reason)    { toast.warning('Vui lòng nhập lý do bảo trì.'); return; }
        setSaving(true);
        try {
            const body = {
                courtId:   form.courtId,
                startTime: new Date(form.startTime).toISOString(),
                endTime:   new Date(form.endTime).toISOString(),
                reason:    form.reason,
            };
            const res = await fetchWithAuth(`${API_BASE}/maintenance-schedules`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
            });
            if (!res.ok) { await showError(res, 'Tạo lịch bảo trì thất bại.'); return; }
            toast.success('Đã tạo lịch bảo trì.');
            setOpenForm(false); setForm(blankForm);
            fetchData();
        } catch { toast.error('Lỗi kết nối.'); }
        finally { setSaving(false); }
    };

    const handleSetStatus = async (row, status) => {
        try {
            const res = await fetchWithAuth(`${API_BASE}/maintenance-schedules/${row.maintenanceId}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
            });
            if (res.ok) { toast.success(`Đã chuyển sang "${STATUS_LABEL[status]}"`); fetchData(); }
            else await showError(res, 'Cập nhật thất bại.');
        } catch { toast.error('Lỗi kết nối.'); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            const res = await fetchWithAuth(`${API_BASE}/maintenance-schedules/${deleteTarget.maintenanceId}`, { method: 'DELETE' });
            if (res.ok) { toast.success('Đã xóa lịch bảo trì.'); setDeleteTarget(null); fetchData(); }
            else await showError(res, 'Xóa thất bại.');
        } catch { toast.error('Lỗi kết nối.'); }
        finally { setDeleting(false); }
    };

    const columns = [
        { field: 'courtName',  headerName: 'Sân',      flex: 1 },
        { field: 'branchName', headerName: 'Chi nhánh', flex: 1 },
        {
            field: 'startTime', headerName: 'Từ', width: 150,
            renderCell: ({ value }) => new Date(value).toLocaleString('vi-VN'),
        },
        {
            field: 'endTime', headerName: 'Đến', width: 150,
            renderCell: ({ value }) => new Date(value).toLocaleString('vi-VN'),
        },
        { field: 'reason', headerName: 'Lý do', flex: 1 },
        {
            field: 'status', headerName: 'Trạng thái', width: 130,
            renderCell: ({ value }) => (
                <Chip label={STATUS_LABEL[value] || value} color={STATUS_COLOR[value] || 'default'} size="small" />
            ),
        },
        {
            field: 'actions', headerName: '', width: 180, sortable: false,
            renderCell: ({ row }) => canEdit && (
                <Box display="flex" gap={0.5} alignItems="center" height="100%">
                    {row.status === 'Scheduled' && (
                        <>
                            <IconButton size="small" color="info" title="Bắt đầu bảo trì"
                                onClick={() => handleSetStatus(row, 'InProgress')}>
                                <CheckCircleOutlineIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error" title="Hủy"
                                onClick={() => handleSetStatus(row, 'Cancelled')}>
                                <CancelOutlinedIcon fontSize="small" />
                            </IconButton>
                        </>
                    )}
                    {row.status === 'InProgress' && (
                        <IconButton size="small" color="success" title="Hoàn tất"
                            onClick={() => handleSetStatus(row, 'Completed')}>
                            <CheckCircleOutlineIcon fontSize="small" />
                        </IconButton>
                    )}
                    <IconButton size="small" color="error" title="Xóa"
                        onClick={() => setDeleteTarget(row)}>
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
                <Head title="Bảo trì sân" subtitle="Quản lý lịch bảo trì / đóng sân tạm thời" />
                {canEdit && (
                    <Button variant="contained" startIcon={<AddOutlinedIcon />}
                        sx={{ background: colors.blueAccent[800], textTransform: 'none', fontWeight: 600, px: 2.5 }}
                        onClick={() => { setForm(blankForm); setOpenForm(true); }}>
                        Thêm lịch bảo trì
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
                    <Typography fontWeight={700} fontSize={17}>Thêm lịch bảo trì</Typography>
                    <IconButton size="small" onClick={() => setOpenForm(false)} sx={{ color: 'inherit' }}>
                        <CloseOutlinedIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ px: 3, py: 2 }}>
                    <Box display="flex" flexDirection="column" gap={2} sx={{ pt: 1 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Sân *</InputLabel>
                            <Select value={form.courtId} label="Sân *"
                                onChange={e => setForm(p => ({ ...p, courtId: e.target.value }))}>
                                {courts.map(c => (
                                    <MenuItem key={c.courtId} value={c.courtId}>{c.name} — {c.branchName}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField label="Từ *" size="small" fullWidth type="datetime-local"
                            InputLabelProps={{ shrink: true }}
                            value={form.startTime}
                            onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))} />
                        <TextField label="Đến *" size="small" fullWidth type="datetime-local"
                            InputLabelProps={{ shrink: true }}
                            value={form.endTime}
                            onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))} />
                        <TextField label="Lý do *" size="small" fullWidth multiline rows={2}
                            placeholder="Ví dụ: Thay lưới, sơn lại sân..."
                            value={form.reason}
                            onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 1.5 }}>
                    <Button onClick={() => setOpenForm(false)} sx={{ textTransform: 'none' }}>Hủy</Button>
                    <Button variant="contained" onClick={handleAdd} disabled={saving}
                        sx={{ textTransform: 'none', fontWeight: 600, minWidth: 90 }}>
                        {saving ? 'Đang lưu...' : 'Tạo lịch'}
                    </Button>
                </DialogActions>
            </Dialog>

            <ConfirmDialog
                open={!!deleteTarget}
                title="Xóa lịch bảo trì"
                message={`Bạn có chắc muốn xóa lịch bảo trì "${deleteTarget?.reason}"?`}
                loading={deleting}
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </Box>
    );
};

export default Maintenance;
