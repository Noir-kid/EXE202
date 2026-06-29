import React, { useState, useEffect } from 'react';
import {
    Box, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel, Typography,
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
import AddOutlinedIcon    from '@mui/icons-material/AddOutlined';
import EditOutlinedIcon   from '@mui/icons-material/EditOutlined';
import ImageOutlinedIcon  from '@mui/icons-material/ImageOutlined';

const SPORT_TYPES = [
    { id:1, name:'Cầu lông' }, { id:2, name:'Tennis' }, { id:3, name:'Bóng đá' },
    { id:4, name:'Bóng rổ' }, { id:5, name:'Bóng chuyền' }, { id:6, name:'Bơi lội' },
];

const STATUS_LABEL = { Active:'Hoạt động', Maintenance:'Bảo trì', Inactive:'Vô hiệu' };
const STATUS_COLOR = { Active:'success', Maintenance:'warning', Inactive:'default' };

const Court = () => {
    const theme  = useTheme();
    const colors = tokens(theme.palette.mode);
    const token  = sessionStorage.getItem('token');
    const decoded = token ? jwtDecode(token) : {};
    const myRole  = decoded.role || '';

    const canAdd    = ['SuperAdmin','PartnerAdmin'].includes(myRole);
    const canEdit   = ['SuperAdmin','PartnerAdmin','BranchManager'].includes(myRole);
    const canStatus = ['SuperAdmin','PartnerAdmin','BranchManager','Staff'].includes(myRole);

    const [state, setState] = useState({ rows:[], branches:[] });
    const [openEdit, setOpenEdit]   = useState(false);
    const [openAdd,  setOpenAdd]    = useState(false);
    const [selected, setSelected]   = useState(null);
    const [imgFiles, setImgFiles]   = useState([]);
    const [uploading,setUploading]  = useState(false);

    const blankForm = { name:'', branchId:'', sportTypeId:1, description:'', basePrice:'', imageUrls:'' };
    const [form, setForm] = useState(blankForm);

    const dgSx = {
        border:'none',
        '& .MuiDataGrid-cell':           { borderBottom:`1px solid ${colors.primary[300]}` },
        '& .MuiDataGrid-columnHeaders':  { background:colors.blueAccent[700], borderBottom:'none' },
        '& .MuiDataGrid-virtualScroller':{ background:colors.primary[400] },
        '& .MuiDataGrid-footerContainer':{ background:colors.blueAccent[700], borderTop:'none' },
    };

    const fetchData = async () => {
        try {
            const [ctRes, brRes] = await Promise.all([
                fetchWithAuth(`${API_BASE}/courts/manage`),
                fetchWithAuth(`${API_BASE}/branches/manage`),
            ]);
            const [courts, branches] = await Promise.all([ctRes.json(), brRes.json()]);
            setState({ rows: courts.map((c,i) => ({ ...c, id: i+1 })), branches });
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        fetchData();
        const id = setInterval(fetchData, 30000);
        return () => clearInterval(id);
    }, []);

    const uploadImages = async () => {
        if (!imgFiles.length) return null;
        setUploading(true);
        const urls = [];
        for (const file of imgFiles) {
            const r = ref(imageDb, `files/${v4()}`);
            await uploadBytes(r, file);
            urls.push(await getDownloadURL(r));
        }
        setUploading(false);
        return urls.join('|');
    };

    const handleSave = async () => {
        if (!selected) return;
        try {
            const uploaded = await uploadImages();
            const body = {
                name:        selected.name,
                description: selected.description,
                basePrice:   parseFloat(selected.basePrice),
                imageUrls:   uploaded || selected.imageUrls,
                status:      selected.status,
            };
            const res = await fetchWithAuth(`${API_BASE}/courts/${selected.courtId}`, {
                method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body),
            });
            if (res.ok) { toast.success('Cập nhật sân thành công!'); setOpenEdit(false); fetchData(); }
            else toast.error('Cập nhật thất bại.');
        } catch { toast.error('Lỗi kết nối.'); }
    };

    const handleAdd = async () => {
        if (!form.branchId) { toast.warning('Vui lòng chọn chi nhánh.'); return; }
        if (!form.name)     { toast.warning('Vui lòng nhập tên sân.'); return; }
        try {
            const uploaded = await uploadImages();
            const body = {
                branchId:    form.branchId,
                sportTypeId: form.sportTypeId,
                name:        form.name,
                description: form.description,
                imageUrls:   uploaded || '',
                basePrice:   parseFloat(form.basePrice)||0,
            };
            const res = await fetchWithAuth(`${API_BASE}/courts`, {
                method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body),
            });
            if (res.ok) { toast.success('Thêm sân thành công!'); setOpenAdd(false); setForm(blankForm); setImgFiles([]); fetchData(); }
            else toast.error('Thêm sân thất bại.');
        } catch { toast.error('Lỗi kết nối.'); }
    };

    const handleStatusToggle = async (row) => {
        const next = row.status === 'Active' ? 'Maintenance' : 'Active';
        try {
            const res = await fetchWithAuth(`${API_BASE}/courts/${row.courtId}/status`, {
                method:'PATCH', headers:{'Content-Type':'application/json'},
                body: JSON.stringify({ status: next }),
            });
            if (res.ok) { toast.success(`Đã chuyển sang ${STATUS_LABEL[next]}`); fetchData(); }
        } catch { toast.error('Thao tác thất bại.'); }
    };

    const firstImg = (s) => s ? s.split('|')[0] : null;

    const columns = [
        { field:'id', headerName:'STT', width:60 },
        {
            field:'imageUrls', headerName:'Ảnh', width:80,
            renderCell:({value}) => {
                const src = firstImg(value);
                return src
                    ? <img src={src} alt="" style={{width:60,height:42,objectFit:'cover',borderRadius:4}}/>
                    : <ImageOutlinedIcon sx={{color:'#9ca3af'}}/>;
            },
        },
        { field:'name', headerName:'Tên sân', flex:1 },
        { field:'sportName', headerName:'Môn thể thao', width:130 },
        { field:'branchName', headerName:'Chi nhánh', flex:1 },
        {
            field:'basePrice', headerName:'Giá/giờ', width:120,
            renderCell:({value}) => `${Number(value).toLocaleString('vi-VN')}đ`,
        },
        {
            field:'status', headerName:'Trạng thái', width:120,
            renderCell:({value}) => <Chip label={STATUS_LABEL[value]||value} color={STATUS_COLOR[value]||'default'} size="small"/>,
        },
        {
            field:'actions', headerName:'', width:canEdit?160:100, sortable:false,
            renderCell:({row}) => (
                <Box display="flex" gap={0.5} alignItems="center" height="100%">
                    {canStatus && (
                        <Button size="small" color={row.status==='Active'?'warning':'success'}
                            onClick={() => handleStatusToggle(row)}>
                            {row.status==='Active'?'Bảo trì':'Mở'}
                        </Button>
                    )}
                    {canEdit && (
                        <Button size="small" startIcon={<EditOutlinedIcon/>}
                            onClick={() => { setSelected({...row}); setImgFiles([]); setOpenEdit(true); }}>
                            Sửa
                        </Button>
                    )}
                </Box>
            ),
        },
    ];

    const { rows: dataRows, branches } = state;

    return (
        <Box m="20px">
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Head title="Quản lý sân" subtitle="Danh sách sân thể thao"/>
                {canAdd && (
                    <Button variant="contained" startIcon={<AddOutlinedIcon/>}
                        sx={{background:colors.blueAccent[700]}}
                        onClick={() => { setForm(blankForm); setImgFiles([]); setOpenAdd(true); }}>
                        Thêm sân
                    </Button>
                )}
            </Box>
            <Box height="70vh" sx={dgSx}>
                <DataGrid rows={dataRows} columns={columns} rowHeight={60}
                    pageSizeOptions={[20,50]} initialState={{pagination:{paginationModel:{pageSize:20}}}}/>
            </Box>

            {/* Edit dialog */}
            <Dialog open={openEdit} onClose={() => setOpenEdit(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Chỉnh sửa sân — {selected?.name}</DialogTitle>
                <DialogContent sx={{display:'flex',flexDirection:'column',gap:1.5,pt:2}}>
                    {selected && (
                        <>
                            <TextField label="Tên sân" size="small" value={selected.name||''}
                                onChange={e => setSelected({...selected, name:e.target.value})} fullWidth/>
                            <TextField label="Giá/giờ (VNĐ)" size="small" type="number" value={selected.basePrice||''}
                                onChange={e => setSelected({...selected, basePrice:e.target.value})} fullWidth/>
                            <TextField label="Mô tả" size="small" multiline rows={3} value={selected.description||''}
                                onChange={e => setSelected({...selected, description:e.target.value})} fullWidth/>
                            <FormControl fullWidth size="small">
                                <InputLabel>Trạng thái</InputLabel>
                                <Select value={selected.status||'Active'} label="Trạng thái"
                                    onChange={e => setSelected({...selected, status:e.target.value})}>
                                    <MenuItem value="Active">Hoạt động</MenuItem>
                                    <MenuItem value="Maintenance">Bảo trì</MenuItem>
                                    <MenuItem value="Inactive">Vô hiệu</MenuItem>
                                </Select>
                            </FormControl>
                            {firstImg(selected.imageUrls) && (
                                <img src={firstImg(selected.imageUrls)} alt="" style={{maxHeight:100,objectFit:'cover',borderRadius:6}}/>
                            )}
                            <Button component="label" variant="outlined" size="small" startIcon={<ImageOutlinedIcon/>}>
                                {uploading ? 'Đang tải...' : 'Chọn ảnh mới'}
                                <input type="file" hidden multiple accept="image/*"
                                    onChange={e => setImgFiles(Array.from(e.target.files))}/>
                            </Button>
                            {imgFiles.length > 0 && <Typography fontSize={12} color="text.secondary">{imgFiles.length} ảnh đã chọn</Typography>}
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenEdit(false)}>Hủy</Button>
                    <Button variant="contained" onClick={handleSave} disabled={uploading}>Lưu</Button>
                </DialogActions>
            </Dialog>

            {/* Add dialog */}
            <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Thêm sân mới</DialogTitle>
                <DialogContent sx={{display:'flex',flexDirection:'column',gap:1.5,pt:2}}>
                    <TextField label="Tên sân" size="small" value={form.name}
                        onChange={e => setForm({...form,name:e.target.value})} fullWidth/>
                    <FormControl fullWidth size="small">
                        <InputLabel>Chi nhánh</InputLabel>
                        <Select value={form.branchId} label="Chi nhánh"
                            onChange={e => setForm({...form,branchId:e.target.value})}>
                            {branches.map(b => <MenuItem key={b.branchId} value={b.branchId}>{b.name}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth size="small">
                        <InputLabel>Môn thể thao</InputLabel>
                        <Select value={form.sportTypeId} label="Môn thể thao"
                            onChange={e => setForm({...form,sportTypeId:e.target.value})}>
                            {SPORT_TYPES.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <TextField label="Giá/giờ (VNĐ)" size="small" type="number" value={form.basePrice}
                        onChange={e => setForm({...form,basePrice:e.target.value})} fullWidth/>
                    <TextField label="Mô tả" size="small" multiline rows={3} value={form.description}
                        onChange={e => setForm({...form,description:e.target.value})} fullWidth/>
                    <Button component="label" variant="outlined" size="small" startIcon={<ImageOutlinedIcon/>}>
                        {uploading ? 'Đang tải...' : 'Chọn ảnh'}
                        <input type="file" hidden multiple accept="image/*"
                            onChange={e => setImgFiles(Array.from(e.target.files))}/>
                    </Button>
                    {imgFiles.length > 0 && <Typography fontSize={12} color="text.secondary">{imgFiles.length} ảnh đã chọn</Typography>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAdd(false)}>Hủy</Button>
                    <Button variant="contained" onClick={handleAdd} disabled={uploading}>Thêm</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Court;
