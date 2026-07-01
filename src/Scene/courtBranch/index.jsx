import React, { useState, useEffect } from 'react';
import {
    Box, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Typography, FormControl, InputLabel, Select, MenuItem,
    Grid, Divider, IconButton, Stack,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useTheme } from '@mui/material';
import { tokens } from '../../theme';
import Head from '../../Components/Head';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';
import { fetchWithAuth } from '../../Components/fetchWithAuth/fetchWithAuth';
import { API_BASE } from '../../config';
import { uploadImage } from '../../Components/uploadImage/uploadImage';
import ConfirmDialog from '../../Components/ConfirmDialog/ConfirmDialog';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';

// All helper components are defined OUTSIDE Branch.
// Defining components inside a parent causes React to remount them on every
// parent re-render, which unmounts TextFields and loses keyboard focus.

const FormField = ({ label, field, type, form, setForm }) => (
    <TextField
        fullWidth
        label={label}
        size="small"
        type={type || 'text'}
        value={form[field] || ''}
        onChange={e => setForm(prev => ({ ...prev, [field]: e.target.value }))}
        InputLabelProps={type === 'time' ? { shrink: true } : undefined}
    />
);

const SectionLabel = ({ children }) => (
    <Typography
        variant="caption"
        fontWeight={700}
        color="text.secondary"
        sx={{ textTransform: 'uppercase', letterSpacing: 1, mb: 1.5, display: 'block' }}
    >
        {children}
    </Typography>
);

const ImageUploadArea = ({ preview, setPreview, setImgFile, colors }) => {
    const handleFile = e => {
        const f = e.target.files?.[0];
        if (f) { setImgFile(f); setPreview(URL.createObjectURL(f)); }
    };

    if (preview) {
        return (
            <Box sx={{ position: 'relative' }}>
                <img src={preview} alt="preview"
                    style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8 }} />
                <IconButton size="small"
                    onClick={() => { setPreview(''); setImgFile(null); }}
                    sx={{
                        position: 'absolute', top: 4, right: 4,
                        background: 'rgba(0,0,0,0.55)', color: '#fff',
                        '&:hover': { background: 'rgba(0,0,0,0.8)' },
                    }}>
                    <CloseOutlinedIcon fontSize="small" />
                </IconButton>
            </Box>
        );
    }

    return (
        <Box component="label" sx={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: 110,
            border: `2px dashed ${colors.primary[300]}`, borderRadius: 2,
            cursor: 'pointer', transition: 'border-color .2s',
            '&:hover': { borderColor: colors.blueAccent[400] },
        }}>
            <ImageOutlinedIcon sx={{ fontSize: 34, color: colors.primary[200], mb: 0.5 }} />
            <Typography variant="body2" color="text.secondary">Nhấn để chọn ảnh</Typography>
            <input hidden type="file" accept="image/*" onChange={handleFile} />
        </Box>
    );
};

const BranchForm = ({ form, setForm, isEdit, myRole, partners, preview, setPreview, setImgFile, colors }) => (
    <Box sx={{ pt: 1 }}>
        {myRole === 'SuperAdmin' && !isEdit && (
            <>
                <SectionLabel>Đối tác</SectionLabel>
                <FormControl fullWidth size="small" sx={{ mb: 2.5 }}>
                    <InputLabel>Đối tác *</InputLabel>
                    <Select
                        value={form.partnerId || ''}
                        label="Đối tác *"
                        onChange={e => setForm(p => ({ ...p, partnerId: e.target.value }))}
                    >
                        {partners.map(p => (
                            <MenuItem key={p.partnerId} value={p.partnerId}>{p.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Divider sx={{ mb: 2 }} />
            </>
        )}

        <SectionLabel>Thông tin cơ bản</SectionLabel>
        <Stack spacing={2} sx={{ mb: 2.5 }}>
            <FormField label="Tên chi nhánh *" field="name" form={form} setForm={setForm} />
            <Grid container spacing={1.5}>
                <Grid item xs={7}>
                    <FormField label="Địa chỉ" field="address" form={form} setForm={setForm} />
                </Grid>
                <Grid item xs={5}>
                    <FormField label="Thành phố" field="city" form={form} setForm={setForm} />
                </Grid>
            </Grid>
        </Stack>

        <Divider sx={{ mb: 2 }} />
        <SectionLabel>Liên hệ</SectionLabel>
        <Stack spacing={2} sx={{ mb: 2.5 }}>
            <Grid container spacing={1.5}>
                <Grid item xs={6}>
                    <FormField label="Số điện thoại" field="phone" form={form} setForm={setForm} />
                </Grid>
                <Grid item xs={6}>
                    <FormField label="Email" field="email" type="email" form={form} setForm={setForm} />
                </Grid>
            </Grid>
            <FormField label="Link Google Maps" field="mapUrl" form={form} setForm={setForm} />
        </Stack>

        <Divider sx={{ mb: 2 }} />
        <SectionLabel>Giờ hoạt động</SectionLabel>
        <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
            <Grid item xs={6}>
                <FormField label="Giờ mở cửa" field="openTime" type="time" form={form} setForm={setForm} />
            </Grid>
            <Grid item xs={6}>
                <FormField label="Giờ đóng cửa" field="closeTime" type="time" form={form} setForm={setForm} />
            </Grid>
        </Grid>

        {isEdit && (
            <>
                <Divider sx={{ mb: 2 }} />
                <SectionLabel>Trạng thái</SectionLabel>
                <FormControl fullWidth size="small" sx={{ mb: 2.5 }}>
                    <InputLabel>Trạng thái</InputLabel>
                    <Select
                        value={form.status || 'Active'}
                        label="Trạng thái"
                        onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                    >
                        <MenuItem value="Active">Hoạt động</MenuItem>
                        <MenuItem value="Closed">Đã đóng</MenuItem>
                        <MenuItem value="Maintenance">Bảo trì</MenuItem>
                    </Select>
                </FormControl>
            </>
        )}

        <Divider sx={{ mb: 2 }} />
        <SectionLabel>Ảnh đại diện</SectionLabel>
        <ImageUploadArea
            preview={preview}
            setPreview={setPreview}
            setImgFile={setImgFile}
            colors={colors}
        />
    </Box>
);

const STATUS_MAP = {
    Active:      { label: 'Hoạt động', color: 'success' },
    Closed:      { label: 'Đã đóng',   color: 'error'   },
    Maintenance: { label: 'Bảo trì',   color: 'warning' },
};

const Branch = () => {
    const theme   = useTheme();
    const colors  = tokens(theme.palette.mode);
    const token   = sessionStorage.getItem('token');
    const decoded = token ? jwtDecode(token) : {};
    const myRole  = decoded.role || '';
    const canEdit = ['SuperAdmin', 'PartnerAdmin'].includes(myRole);

    const [rows, setRows]           = useState([]);
    const [partners, setPartners]   = useState([]);
    const [openEdit, setOpenEdit]   = useState(false);
    const [openAdd, setOpenAdd]     = useState(false);
    const [selected, setSelected]   = useState(null);
    const [imgFile, setImgFile]     = useState(null);
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview]     = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting]   = useState(false);

    const blank = {
        name: '', address: '', city: '', phone: '', email: '',
        mapUrl: '', openTime: '', closeTime: '', status: 'Active', partnerId: '',
    };
    const [form, setForm] = useState(blank);

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
            const [brRes, ctRes] = await Promise.all([
                fetchWithAuth(`${API_BASE}/branches/manage`),
                fetchWithAuth(`${API_BASE}/courts/manage`),
            ]);
            const [branches, courts] = await Promise.all([brRes.json(), ctRes.json()]);
            const cnt = {};
            courts.forEach(c => { cnt[c.branchId] = (cnt[c.branchId] || 0) + 1; });
            setRows(branches.map((b, i) => ({ ...b, id: b.branchId, stt: i + 1, numberOfCourts: cnt[b.branchId] || 0 })));
        } catch (e) { console.error(e); }
    };

    const fetchPartners = async () => {
        if (myRole !== 'SuperAdmin') return;
        try {
            const res = await fetchWithAuth(`${API_BASE}/partners?status=1`);
            if (res.ok) setPartners(await res.json());
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        fetchData();
        fetchPartners();
        const id = setInterval(fetchData, 30000);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const uploadImg = async (file) => {
        if (!file) return null;
        setUploading(true);
        try {
            const url = await uploadImage(file, 'branches');
            setUploading(false);
            return url;
        } catch {
            setUploading(false);
            toast.error('Tải ảnh thất bại.');
            return null;
        }
    };

    const handleSave = async () => {
        if (!selected) return;
        try {
            const imgUrl = imgFile ? await uploadImg(imgFile) : undefined;
            const body = {
                name: form.name, address: form.address, phone: form.phone,
                email: form.email, status: form.status,
                openTime: form.openTime || null, closeTime: form.closeTime || null,
                ...(imgUrl && { imageUrl: imgUrl }),
            };
            const res = await fetchWithAuth(`${API_BASE}/branches/${selected.branchId}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
            });
            if (res.ok) {
                toast.success('Cập nhật thành công!');
                setOpenEdit(false);
                fetchData();
            } else {
                const err = await res.json().catch(() => ({}));
                toast.error(err.error || 'Cập nhật thất bại.');
            }
        } catch { toast.error('Lỗi kết nối.'); }
    };

    const handleAdd = async () => {
        if (!form.name) { toast.warning('Vui lòng nhập tên chi nhánh.'); return; }
        if (myRole === 'SuperAdmin' && !form.partnerId) { toast.warning('Vui lòng chọn đối tác.'); return; }
        try {
            const decoded2  = jwtDecode(sessionStorage.getItem('token'));
            const partnerId = myRole === 'SuperAdmin' ? form.partnerId : decoded2.partnerId;
            const imgUrl    = imgFile ? await uploadImg(imgFile) : undefined;
            const body = {
                partnerId, name: form.name, address: form.address, city: form.city,
                phone: form.phone, email: form.email, mapUrl: form.mapUrl,
                openTime: form.openTime || null, closeTime: form.closeTime || null,
                ...(imgUrl && { imageUrl: imgUrl }),
            };
            const res = await fetchWithAuth(`${API_BASE}/branches`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
            });
            if (res.ok) {
                toast.success('Thêm chi nhánh thành công!');
                setOpenAdd(false);
                fetchData();
            } else {
                const err = await res.json().catch(() => ({}));
                toast.error(err.error || 'Thêm thất bại.');
            }
        } catch { toast.error('Lỗi kết nối.'); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            const res = await fetchWithAuth(`${API_BASE}/branches/${deleteTarget.branchId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Đã xóa chi nhánh.');
                setDeleteTarget(null);
                fetchData();
            } else {
                const err = await res.json().catch(() => ({}));
                toast.error(err.error || 'Xóa thất bại.');
            }
        } catch { toast.error('Lỗi kết nối.'); }
        finally { setDeleting(false); }
    };

    const openEditDlg = (row) => {
        setSelected(row);
        setForm({
            name: row.name || '', address: row.address || '', city: row.city || '',
            phone: row.phone || '', email: row.email || '', mapUrl: row.mapUrl || '',
            openTime: row.openTime || '', closeTime: row.closeTime || '',
            status: row.status || 'Active',
        });
        setPreview(row.imageUrl || '');
        setImgFile(null);
        setOpenEdit(true);
    };

    const columns = [
        { field: 'stt', headerName: 'STT', width: 60 },
        {
            field: 'imageUrl', headerName: 'Ảnh', width: 80,
            renderCell: ({ value }) => value
                ? <img src={value} alt="" style={{ width: 60, height: 42, objectFit: 'cover', borderRadius: 6 }} />
                : <Box sx={{ width: 60, height: 42, borderRadius: 1, background: colors.primary[300],
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <StorefrontOutlinedIcon sx={{ color: colors.primary[100], fontSize: 20 }} />
                  </Box>,
        },
        { field: 'name',           headerName: 'Tên chi nhánh', flex: 1.2 },
        { field: 'city',           headerName: 'Thành phố',     width: 130 },
        { field: 'address',        headerName: 'Địa chỉ',       flex: 1.5 },
        { field: 'phone',          headerName: 'SĐT',           width: 130 },
        { field: 'numberOfCourts', headerName: 'Số sân',        width: 80, type: 'number' },
        {
            field: 'status', headerName: 'Trạng thái', width: 130,
            renderCell: ({ value }) => {
                const s = STATUS_MAP[value] || { label: value, color: 'default' };
                return <Chip label={s.label} color={s.color} size="small" sx={{ fontWeight: 600 }} />;
            },
        },
        ...(canEdit ? [{
            field: 'actions', headerName: '', width: 170, sortable: false,
            renderCell: ({ row }) => (
                <Box display="flex" gap={0.5} alignItems="center" height="100%">
                    <Button size="small" startIcon={<EditOutlinedIcon />}
                        sx={{ textTransform: 'none', fontWeight: 500 }}
                        onClick={() => openEditDlg(row)}>
                        Sửa
                    </Button>
                    {row.status !== 'Closed' && (
                        <Button size="small" color="error" startIcon={<DeleteOutlineIcon />}
                            sx={{ textTransform: 'none', fontWeight: 500 }}
                            onClick={() => setDeleteTarget(row)}>
                            Xóa
                        </Button>
                    )}
                </Box>
            ),
        }] : []),
    ];

    const dlgTitleSx = {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        pb: 1.5, background: colors.blueAccent[800],
    };

    const formProps = { form, setForm, myRole, partners, preview, setPreview, setImgFile, colors };

    return (
        <Box m="20px">
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Head title="Quản lý chi nhánh" subtitle="Danh sách chi nhánh thể thao" />
                {canEdit && (
                    <Button variant="contained" startIcon={<AddOutlinedIcon />}
                        sx={{ background: colors.blueAccent[800], textTransform: 'none', fontWeight: 600, px: 2.5 }}
                        onClick={() => { setForm(blank); setPreview(''); setImgFile(null); setOpenAdd(true); }}>
                        Thêm chi nhánh
                    </Button>
                )}
            </Box>

            <Box height="70vh" sx={dgSx}>
                <DataGrid rows={rows} columns={columns} rowHeight={60}
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
                    <Typography fontWeight={700} fontSize={17}>Chỉnh sửa chi nhánh</Typography>
                    <IconButton size="small" onClick={() => setOpenEdit(false)} sx={{ color: 'inherit' }}>
                        <CloseOutlinedIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ px: 3, py: 2 }}>
                    <BranchForm {...formProps} isEdit />
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 1.5 }}>
                    <Button onClick={() => setOpenEdit(false)} sx={{ textTransform: 'none' }}>Hủy</Button>
                    <Button variant="contained" onClick={handleSave} disabled={uploading}
                        sx={{ textTransform: 'none', fontWeight: 600, minWidth: 110 }}>
                        {uploading ? 'Đang tải...' : 'Lưu thay đổi'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Add dialog */}
            <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="sm" fullWidth
                PaperProps={{ sx: { borderRadius: 2 } }}>
                <DialogTitle sx={dlgTitleSx}>
                    <Typography fontWeight={700} fontSize={17}>Thêm chi nhánh mới</Typography>
                    <IconButton size="small" onClick={() => setOpenAdd(false)} sx={{ color: 'inherit' }}>
                        <CloseOutlinedIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ px: 3, py: 2 }}>
                    <BranchForm {...formProps} isEdit={false} />
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 1.5 }}>
                    <Button onClick={() => setOpenAdd(false)} sx={{ textTransform: 'none' }}>Hủy</Button>
                    <Button variant="contained" onClick={handleAdd} disabled={uploading}
                        sx={{ textTransform: 'none', fontWeight: 600, minWidth: 110 }}>
                        {uploading ? 'Đang tải...' : 'Thêm chi nhánh'}
                    </Button>
                </DialogActions>
            </Dialog>

            <ConfirmDialog
                open={!!deleteTarget}
                title="Xóa chi nhánh"
                message={`Bạn có chắc muốn xóa chi nhánh "${deleteTarget?.name}"? Chi nhánh sẽ chuyển sang trạng thái "Đã đóng". Không thể xóa nếu còn booking đang chờ/đã xác nhận.`}
                loading={deleting}
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </Box>
    );
};

export default Branch;
