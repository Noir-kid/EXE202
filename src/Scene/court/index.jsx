import React, { useState, useEffect } from 'react';
import {
    Box, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, FormControl, InputLabel, Select, MenuItem, Typography,
    Grid, Divider, Stack, IconButton,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useTheme } from '@mui/material';
import { tokens } from '../../theme';
import Head from '../../Components/Head';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';
import { fetchWithAuth } from '../../Components/fetchWithAuth/fetchWithAuth';
import { API_BASE } from '../../config';
import { v4 } from 'uuid';
import { uploadBytes, getDownloadURL, ref } from 'firebase/storage';
import { imageDb } from '../../Components/googleSignin/config.js';
import AddOutlinedIcon   from '@mui/icons-material/AddOutlined';
import EditOutlinedIcon  from '@mui/icons-material/EditOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import SportsOutlinedIcon from '@mui/icons-material/SportsOutlined';

const SPORT_TYPES = [
    { id: 1, name: 'Cầu lông' }, { id: 2, name: 'Tennis' },
    { id: 3, name: 'Bóng đá'  }, { id: 4, name: 'Bóng rổ' },
    { id: 5, name: 'Bóng chuyền' }, { id: 6, name: 'Bơi lội' },
];

const STATUS_LABEL = { Active: 'Hoạt động', Maintenance: 'Bảo trì', Inactive: 'Vô hiệu' };
const STATUS_COLOR = { Active: 'success',   Maintenance: 'warning',  Inactive: 'default' };

const SectionLabel = ({ children }) => (
    <Typography
        variant="caption" fontWeight={700} color="text.secondary"
        sx={{ textTransform: 'uppercase', letterSpacing: 1, mb: 1.5, display: 'block' }}
    >
        {children}
    </Typography>
);

const Court = () => {
    const theme   = useTheme();
    const colors  = tokens(theme.palette.mode);
    const token   = sessionStorage.getItem('token');
    const decoded = token ? jwtDecode(token) : {};
    const myRole  = decoded.role || '';

    const canAdd    = ['SuperAdmin', 'PartnerAdmin'].includes(myRole);
    const canEdit   = ['SuperAdmin', 'PartnerAdmin', 'BranchManager'].includes(myRole);
    const canStatus = ['SuperAdmin', 'PartnerAdmin', 'BranchManager', 'Staff'].includes(myRole);

    const [rows, setRows]       = useState([]);
    const [branches, setBranches] = useState([]);
    const [openEdit, setOpenEdit] = useState(false);
    const [openAdd,  setOpenAdd]  = useState(false);
    const [selected, setSelected] = useState(null);
    const [imgFiles, setImgFiles] = useState([]);
    const [uploading, setUploading] = useState(false);

    const blankForm = { name: '', branchId: '', sportTypeId: 1, description: '', basePrice: '' };
    const [form, setForm] = useState(blankForm);

    const dgSx = {
        border: 'none',
        borderRadius: 2,
        overflow: 'hidden',
        '& .MuiDataGrid-cell': {
            borderBottom: 'none',
            color: colors.grey[100],
        },
        '& .MuiDataGrid-row':          { borderBottom: `1px solid rgba(148,163,184,0.07)` },
        '& .MuiDataGrid-row.row-even': { background: colors.bg.card },
        '& .MuiDataGrid-row.row-odd':  { background: colors.bg.secondary },
        '& .MuiDataGrid-row:hover':    { background: `${colors.bg.cardHover} !important` },
        '& .MuiDataGrid-columnHeaders': {
            background: colors.blueAccent[800],
            borderBottom: 'none',
        },
        '& .MuiDataGrid-columnHeaderTitle': {
            fontWeight: 700,
            fontSize: '0.75rem',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: colors.blueAccent[200],
        },
        '& .MuiDataGrid-virtualScroller': {
            background: colors.bg.secondary,
        },
        '& .MuiDataGrid-footerContainer': {
            background: colors.blueAccent[800],
            borderTop: 'none',
        },
        '& .MuiTablePagination-root': { color: colors.grey[200] },
        '& .MuiTablePagination-selectIcon': { color: colors.grey[200] },
        '& .MuiDataGrid-sortIcon': { color: colors.blueAccent[300] },
        '& .MuiDataGrid-menuIconButton': { color: colors.grey[300] },
    };

    const fetchData = async () => {
        try {
            const [ctRes, brRes] = await Promise.all([
                fetchWithAuth(`${API_BASE}/courts/manage`),
                fetchWithAuth(`${API_BASE}/branches/manage`),
            ]);
            const [courts, brs] = await Promise.all([ctRes.json(), brRes.json()]);
            setRows(courts.map((c, i) => ({ ...c, id: c.courtId, stt: i + 1 })));
            setBranches(brs);
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

    const uploadImages = async (courtId, files, existingHasImage) => {
        setUploading(true);
        try {
            for (let i = 0; i < files.length; i++) {
                const r   = ref(imageDb, `files/${v4()}`);
                await uploadBytes(r, files[i]);
                const url = await getDownloadURL(r);
                await fetchWithAuth(`${API_BASE}/courts/${courtId}/images`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url, isPrimary: i === 0 && !existingHasImage, sortOrder: i }),
                });
            }
        } finally { setUploading(false); }
    };

    const handleSave = async () => {
        if (!selected) return;
        if (!selected.name)   { toast.warning('Tên sân không được trống.'); return; }
        if (!selected.basePrice || parseFloat(selected.basePrice) <= 0) {
            toast.warning('Giá phải lớn hơn 0.'); return;
        }
        try {
            const body = {
                name:        selected.name,
                description: selected.description || null,
                basePrice:   parseFloat(selected.basePrice),
                status:      selected.status,
            };
            const res = await fetchWithAuth(`${API_BASE}/courts/${selected.courtId}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
            });
            if (!res.ok) { await showError(res, 'Cập nhật thất bại.'); return; }
            if (imgFiles.length > 0) await uploadImages(selected.courtId, imgFiles, !!selected.imageUrl);
            toast.success('Cập nhật sân thành công!');
            setOpenEdit(false);
            fetchData();
        } catch { setUploading(false); toast.error('Lỗi kết nối.'); }
    };

    const handleAdd = async () => {
        if (!form.branchId) { toast.warning('Vui lòng chọn chi nhánh.'); return; }
        if (!form.name)     { toast.warning('Vui lòng nhập tên sân.'); return; }
        if (!form.basePrice || parseFloat(form.basePrice) <= 0) {
            toast.warning('Giá phải lớn hơn 0.'); return;
        }
        try {
            const body = {
                branchId:    form.branchId,
                sportTypeId: parseInt(form.sportTypeId, 10),
                name:        form.name,
                description: form.description || null,
                basePrice:   parseFloat(form.basePrice),
            };
            const res = await fetchWithAuth(`${API_BASE}/courts`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
            });
            if (!res.ok) { await showError(res, 'Thêm sân thất bại.'); return; }
            const created = await res.json();
            if (imgFiles.length > 0) await uploadImages(created.courtId, imgFiles, false);
            toast.success('Thêm sân thành công!');
            setOpenAdd(false); setForm(blankForm); setImgFiles([]);
            fetchData();
        } catch { setUploading(false); toast.error('Lỗi kết nối.'); }
    };

    const handleStatusToggle = async (row) => {
        const next = row.status === 'Active' ? 'Maintenance'
                   : row.status === 'Maintenance' ? 'Active' : 'Active';
        try {
            const res = await fetchWithAuth(`${API_BASE}/courts/${row.courtId}/status`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: next }),
            });
            if (res.ok) { toast.success(`Đã chuyển sang ${STATUS_LABEL[next]}`); fetchData(); }
        } catch { toast.error('Thao tác thất bại.'); }
    };

    const columns = [
        { field: 'stt', headerName: 'STT', width: 60 },
        {
            field: 'imageUrl', headerName: 'Ảnh', width: 80,
            renderCell: ({ value }) => value
                ? <img src={value} alt="" style={{ width: 60, height: 42, objectFit: 'cover', borderRadius: 6 }} />
                : <Box sx={{ width: 60, height: 42, borderRadius: 1, background: colors.bg.card,
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <SportsOutlinedIcon sx={{ color: colors.grey[400], fontSize: 20 }} />
                  </Box>,
        },
        { field: 'name',       headerName: 'Tên sân',      flex: 1 },
        { field: 'sportName',  headerName: 'Môn thể thao', width: 130 },
        { field: 'branchName', headerName: 'Chi nhánh',    flex: 1 },
        {
            field: 'basePrice', headerName: 'Giá/giờ', width: 120,
            renderCell: ({ value }) => `${Number(value).toLocaleString('vi-VN')}đ`,
        },
        {
            field: 'status', headerName: 'Trạng thái', width: 120,
            renderCell: ({ value }) => (
                <Chip
                    label={STATUS_LABEL[value] || value}
                    color={STATUS_COLOR[value] || 'default'}
                    size="small" sx={{ fontWeight: 600 }}
                />
            ),
        },
        {
            field: 'actions', headerName: '', width: canEdit ? 160 : 100, sortable: false,
            renderCell: ({ row }) => (
                <Box display="flex" gap={0.5} alignItems="center" height="100%">
                    {canStatus && (
                        <Button size="small"
                            color={row.status === 'Active' ? 'warning' : 'success'}
                            sx={{ textTransform: 'none' }}
                            onClick={() => handleStatusToggle(row)}>
                            {row.status === 'Active' ? 'Bảo trì' : 'Mở'}
                        </Button>
                    )}
                    {canEdit && (
                        <Button size="small" startIcon={<EditOutlinedIcon />}
                            sx={{ textTransform: 'none' }}
                            onClick={() => { setSelected({ ...row }); setImgFiles([]); setOpenEdit(true); }}>
                            Sửa
                        </Button>
                    )}
                </Box>
            ),
        },
    ];

    const dlgTitleSx = {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        pb: 1.5, background: colors.blueAccent[800],
    };

    const ImgPickerBtn = ({ label }) => (
        <Box>
            <Button component="label" variant="outlined" size="small"
                startIcon={<ImageOutlinedIcon />} fullWidth sx={{ textTransform: 'none' }}>
                {uploading ? 'Đang tải...' : label}
                <input type="file" hidden multiple accept="image/*"
                    onChange={e => setImgFiles(Array.from(e.target.files))} />
            </Button>
            {imgFiles.length > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Đã chọn {imgFiles.length} ảnh
                </Typography>
            )}
        </Box>
    );

    return (
        <Box m="20px">
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Head title="Quản lý sân" subtitle="Danh sách sân thể thao" />
                {canAdd && (
                    <Button variant="contained" startIcon={<AddOutlinedIcon />}
                        sx={{ background: colors.blueAccent[800], textTransform: 'none', fontWeight: 600, px: 2.5 }}
                        onClick={() => { setForm(blankForm); setImgFiles([]); setOpenAdd(true); }}>
                        Thêm sân
                    </Button>
                )}
            </Box>

            <Box height="70vh" sx={dgSx}>
                <DataGrid
                    rows={rows} columns={columns} rowHeight={60}
                    pageSizeOptions={[20, 50]}
                    initialState={{ pagination: { paginationModel: { pageSize: 20 } } }}
                    disableRowSelectionOnClick
                    getRowClassName={p => p.indexRelativeToCurrentPage % 2 === 0 ? 'row-even' : 'row-odd'}
                />
            </Box>

            {/* Edit dialog */}
            <Dialog open={openEdit} onClose={() => setOpenEdit(false)} maxWidth="sm" fullWidth
                PaperProps={{ sx: { borderRadius: 2 } }}>
                <DialogTitle sx={dlgTitleSx}>
                    <Typography fontWeight={700} fontSize={17}>Chỉnh sửa sân</Typography>
                    <IconButton size="small" onClick={() => setOpenEdit(false)} sx={{ color: 'inherit' }}>
                        <CloseOutlinedIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ px: 3, py: 2 }}>
                    {selected && (
                        <Box sx={{ pt: 1 }}>
                            <SectionLabel>Thông tin cơ bản</SectionLabel>
                            <Stack spacing={2} sx={{ mb: 2.5 }}>
                                <TextField label="Tên sân *" size="small" fullWidth
                                    value={selected.name || ''}
                                    onChange={e => setSelected(p => ({ ...p, name: e.target.value }))} />
                                <Grid container spacing={1.5}>
                                    <Grid item xs={7}>
                                        <TextField label="Giá/giờ (VNĐ) *" size="small" fullWidth type="number"
                                            value={selected.basePrice || ''}
                                            onChange={e => setSelected(p => ({ ...p, basePrice: e.target.value }))} />
                                    </Grid>
                                    <Grid item xs={5}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Trạng thái</InputLabel>
                                            <Select value={selected.status || 'Active'} label="Trạng thái"
                                                onChange={e => setSelected(p => ({ ...p, status: e.target.value }))}>
                                                <MenuItem value="Active">Hoạt động</MenuItem>
                                                <MenuItem value="Maintenance">Bảo trì</MenuItem>
                                                <MenuItem value="Inactive">Vô hiệu</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </Grid>
                                <TextField label="Mô tả" size="small" fullWidth multiline rows={3}
                                    value={selected.description || ''}
                                    onChange={e => setSelected(p => ({ ...p, description: e.target.value }))} />
                            </Stack>

                            <Divider sx={{ mb: 2 }} />
                            <SectionLabel>Ảnh sân</SectionLabel>
                            {selected.imageUrl && (
                                <Box sx={{ mb: 1.5 }}>
                                    <img src={selected.imageUrl} alt=""
                                        style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8 }} />
                                </Box>
                            )}
                            <ImgPickerBtn label="Chọn ảnh mới" />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 1.5 }}>
                    <Button onClick={() => setOpenEdit(false)} sx={{ textTransform: 'none' }}>Hủy</Button>
                    <Button variant="contained" onClick={handleSave} disabled={uploading}
                        sx={{ textTransform: 'none', fontWeight: 600, minWidth: 90 }}>
                        {uploading ? 'Đang tải...' : 'Lưu thay đổi'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Add dialog */}
            <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="sm" fullWidth
                PaperProps={{ sx: { borderRadius: 2 } }}>
                <DialogTitle sx={dlgTitleSx}>
                    <Typography fontWeight={700} fontSize={17}>Thêm sân mới</Typography>
                    <IconButton size="small" onClick={() => setOpenAdd(false)} sx={{ color: 'inherit' }}>
                        <CloseOutlinedIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ px: 3, py: 2 }}>
                    <Box sx={{ pt: 1 }}>
                        <SectionLabel>Thông tin cơ bản</SectionLabel>
                        <Stack spacing={2} sx={{ mb: 2.5 }}>
                            <TextField label="Tên sân *" size="small" fullWidth
                                value={form.name}
                                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                            <Grid container spacing={1.5}>
                                <Grid item xs={7}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Chi nhánh *</InputLabel>
                                        <Select value={form.branchId} label="Chi nhánh *"
                                            onChange={e => setForm(p => ({ ...p, branchId: e.target.value }))}>
                                            {branches.map(b => (
                                                <MenuItem key={b.branchId} value={b.branchId}>{b.name}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={5}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Môn thể thao</InputLabel>
                                        <Select value={form.sportTypeId} label="Môn thể thao"
                                            onChange={e => setForm(p => ({ ...p, sportTypeId: e.target.value }))}>
                                            {SPORT_TYPES.map(s => (
                                                <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>
                            <TextField label="Giá/giờ (VNĐ) *" size="small" fullWidth type="number"
                                value={form.basePrice}
                                onChange={e => setForm(p => ({ ...p, basePrice: e.target.value }))} />
                            <TextField label="Mô tả" size="small" fullWidth multiline rows={3}
                                value={form.description}
                                onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                        </Stack>

                        <Divider sx={{ mb: 2 }} />
                        <SectionLabel>Ảnh sân</SectionLabel>
                        <ImgPickerBtn label="Chọn ảnh" />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 1.5 }}>
                    <Button onClick={() => setOpenAdd(false)} sx={{ textTransform: 'none' }}>Hủy</Button>
                    <Button variant="contained" onClick={handleAdd} disabled={uploading}
                        sx={{ textTransform: 'none', fontWeight: 600, minWidth: 90 }}>
                        {uploading ? 'Đang tải...' : 'Thêm sân'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Court;
