import React, { useState, useEffect } from 'react';
import {
    Box, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Typography, FormControl, InputLabel, Select, MenuItem,
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
import AddOutlinedIcon  from '@mui/icons-material/AddOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';

const Branch = () => {
    const theme  = useTheme();
    const colors = tokens(theme.palette.mode);
    const token  = sessionStorage.getItem('token');
    const decoded = token ? jwtDecode(token) : {};
    const myRole  = decoded.role || '';
    const canEdit = ['SuperAdmin','PartnerAdmin'].includes(myRole);

    const [rows, setRows]         = useState([]);
    const [partners, setPartners] = useState([]);
    const [openEdit, setOpenEdit] = useState(false);
    const [openAdd,  setOpenAdd]  = useState(false);
    const [selected, setSelected] = useState(null);
    const [imgFile,  setImgFile]  = useState(null);
    const [uploading,setUploading]= useState(false);
    const [preview,  setPreview]  = useState('');

    const blank = { name:'', address:'', city:'', phone:'', email:'', mapUrl:'', openTime:'', closeTime:'', status:'Active', partnerId:'' };
    const [form, setForm] = useState(blank);

    const dgSx = {
        border:'none',
        '& .MuiDataGrid-cell':          { borderBottom:`1px solid ${colors.primary[300]}` },
        '& .MuiDataGrid-columnHeaders': { background:colors.blueAccent[700], borderBottom:'none' },
        '& .MuiDataGrid-virtualScroller':{ background:colors.primary[400] },
        '& .MuiDataGrid-footerContainer':{ background:colors.blueAccent[700], borderTop:'none' },
    };

    const fetchData = async () => {
        try {
            const [brRes, ctRes] = await Promise.all([
                fetchWithAuth(`${API_BASE}/branches/manage`),
                fetchWithAuth(`${API_BASE}/courts/manage`),
            ]);
            const [branches, courts] = await Promise.all([brRes.json(), ctRes.json()]);
            const cnt = {};
            courts.forEach(c => { cnt[c.branchId] = (cnt[c.branchId]||0)+1; });
            setRows(branches.map((b,i) => ({
                ...b, id: i+1, numberOfCourts: cnt[b.branchId]||0,
            })));
        } catch (e) { console.error(e); }
    };

    const fetchPartners = async () => {
        if (myRole !== 'SuperAdmin') return;
        try {
            const res = await fetchWithAuth(`${API_BASE}/partners?status=1`); // status=1 = Active
            if (res.ok) setPartners(await res.json());
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        fetchData();
        fetchPartners();
        const id = setInterval(fetchData, 30000);
        return () => clearInterval(id);
    }, []);

    const uploadImg = async (file) => {
        if (!file) return null;
        setUploading(true);
        try {
            const r   = ref(imageDb, `files/${v4()}`);
            await uploadBytes(r, file);
            const url = await getDownloadURL(r);
            setUploading(false); return url;
        } catch { setUploading(false); toast.error('Tải ảnh thất bại.'); return null; }
    };

    const handleSave = async () => {
        if (!selected) return;
        try {
            const body = {
                name: form.name, address: form.address, phone: form.phone, email: form.email,
                status: form.status, openTime: form.openTime||null, closeTime: form.closeTime||null,
            };
            const res = await fetchWithAuth(`${API_BASE}/branches/${selected.branchId}`, {
                method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body),
            });
            if (res.ok) { toast.success('Cập nhật thành công!'); setOpenEdit(false); fetchData(); }
            else { const err = await res.json().catch(() => ({})); toast.error(err.error || 'Cập nhật thất bại.'); }
        } catch { toast.error('Lỗi kết nối.'); }
    };

    const handleAdd = async () => {
        if (!form.name) { toast.warning('Vui lòng nhập tên chi nhánh.'); return; }
        if (myRole === 'SuperAdmin' && !form.partnerId) { toast.warning('Vui lòng chọn đối tác.'); return; }
        try {
            const decoded2 = jwtDecode(sessionStorage.getItem('token'));
            const partnerId = myRole === 'SuperAdmin' ? form.partnerId : decoded2.partnerId;
            const body = {
                partnerId,
                name: form.name, address: form.address, city: form.city,
                phone: form.phone, email: form.email, mapUrl: form.mapUrl,
                openTime: form.openTime||null, closeTime: form.closeTime||null,
            };
            const res = await fetchWithAuth(`${API_BASE}/branches`, {
                method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body),
            });
            if (res.ok) { toast.success('Thêm chi nhánh thành công!'); setOpenAdd(false); fetchData(); }
            else { const err = await res.json().catch(() => ({})); toast.error(err.error || 'Thêm thất bại.'); }
        } catch { toast.error('Lỗi kết nối.'); }
    };

    const openEditDlg = (row) => {
        setSelected(row);
        setForm({ name:row.name||'', address:row.address||'', city:row.city||'',
            phone:row.phone||'', email:row.email||'', mapUrl:row.mapUrl||'',
            openTime:row.openTime||'', closeTime:row.closeTime||'', status:row.status||'Active' });
        setPreview(row.imageUrl||''); setImgFile(null);
        setOpenEdit(true);
    };

    const columns = [
        { field:'id', headerName:'STT', width:60 },
        {
            field:'imageUrl', headerName:'Ảnh', width:80,
            renderCell:({value}) => value
                ? <img src={value} alt="" style={{width:60,height:42,objectFit:'cover',borderRadius:4}}/>
                : <ImageOutlinedIcon sx={{color:'#9ca3af'}}/>
        },
        { field:'name', headerName:'Tên chi nhánh', flex:1.2 },
        { field:'city', headerName:'Thành phố', width:130 },
        { field:'address', headerName:'Địa chỉ', flex:1.5 },
        { field:'phone', headerName:'SĐT', width:130 },
        { field:'numberOfCourts', headerName:'Số sân', width:90, type:'number' },
        {
            field:'status', headerName:'Trạng thái', width:120,
            renderCell:({value}) => <Chip label={value==='Active'?'Hoạt động':'Tạm đóng'} color={value==='Active'?'success':'default'} size="small"/>
        },
        ...(canEdit ? [{
            field:'actions', headerName:'', width:100, sortable:false,
            renderCell:({row}) => (
                <Button size="small" startIcon={<EditOutlinedIcon/>} onClick={() => openEditDlg(row)}>Sửa</Button>
            ),
        }] : []),
    ];

    const FieldRow = ({ label, field, type='text', half=false }) => (
        <TextField fullWidth={!half} label={label} size="small" type={type} sx={{mb:1.5}}
            value={form[field]||''} onChange={e => setForm(p=>({...p,[field]:e.target.value}))}/>
    );

    return (
        <Box m="20px">
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Head title="Quản lý chi nhánh" subtitle="Danh sách chi nhánh thể thao"/>
                {canEdit && (
                    <Button variant="contained" startIcon={<AddOutlinedIcon/>}
                        sx={{background:colors.blueAccent[700]}}
                        onClick={() => { setForm(blank); setPreview(''); setImgFile(null); setOpenAdd(true); }}>
                        Thêm chi nhánh
                    </Button>
                )}
            </Box>
            <Box height="70vh" sx={dgSx}>
                <DataGrid rows={rows} columns={columns} rowHeight={60}
                    pageSizeOptions={[20,50]} initialState={{pagination:{paginationModel:{pageSize:20}}}}/>
            </Box>

            {/* Edit dialog */}
            <Dialog open={openEdit} onClose={() => setOpenEdit(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Chỉnh sửa chi nhánh</DialogTitle>
                <DialogContent dividers>
                    <FieldRow label="Tên chi nhánh" field="name"/>
                    <FieldRow label="Địa chỉ" field="address"/>
                    <Box display="flex" gap={1}><FieldRow label="Thành phố" field="city" half/><FieldRow label="SĐT" field="phone" half/></Box>
                    <FieldRow label="Email" field="email"/>
                    <Box display="flex" gap={1}><FieldRow label="Giờ mở" field="openTime" type="time" half/><FieldRow label="Giờ đóng" field="closeTime" type="time" half/></Box>
                    <FieldRow label="Link bản đồ" field="mapUrl"/>
                    <FormControl fullWidth size="small" sx={{mb:1.5}}>
                        <InputLabel>Trạng thái</InputLabel>
                        <Select value={form.status||'Active'} label="Trạng thái"
                            onChange={e => setForm(p=>({...p,status:e.target.value}))}>
                            <MenuItem value="Active">Hoạt động</MenuItem>
                            <MenuItem value="Closed">Đã đóng</MenuItem>
                            <MenuItem value="Maintenance">Bảo trì</MenuItem>
                        </Select>
                    </FormControl>
                    {preview && <img src={preview} alt="" style={{width:'100%',maxHeight:150,objectFit:'cover',borderRadius:6,marginBottom:8}}/>}
                    <Button component="label" variant="outlined" size="small" startIcon={<ImageOutlinedIcon/>}>
                        Chọn ảnh
                        <input hidden type="file" accept="image/*" onChange={e => {
                            const f = e.target.files?.[0];
                            if (f) { setImgFile(f); setPreview(URL.createObjectURL(f)); }
                        }}/>
                    </Button>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenEdit(false)}>Hủy</Button>
                    <Button variant="contained" onClick={handleSave} disabled={uploading}>
                        {uploading ? 'Đang tải...' : 'Lưu'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Add dialog */}
            <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Thêm chi nhánh mới</DialogTitle>
                <DialogContent dividers>
                    {myRole === 'SuperAdmin' && (
                        <FormControl fullWidth size="small" sx={{mb:1.5}}>
                            <InputLabel>Đối tác *</InputLabel>
                            <Select value={form.partnerId||''} label="Đối tác *"
                                onChange={e => setForm(p=>({...p,partnerId:e.target.value}))}>
                                {partners.map(p => <MenuItem key={p.partnerId} value={p.partnerId}>{p.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                    )}
                    <FieldRow label="Tên chi nhánh" field="name"/>
                    <FieldRow label="Địa chỉ" field="address"/>
                    <Box display="flex" gap={1}><FieldRow label="Thành phố" field="city" half/><FieldRow label="SĐT" field="phone" half/></Box>
                    <FieldRow label="Email" field="email"/>
                    <Box display="flex" gap={1}><FieldRow label="Giờ mở" field="openTime" type="time" half/><FieldRow label="Giờ đóng" field="closeTime" type="time" half/></Box>
                    {preview && <img src={preview} alt="" style={{width:'100%',maxHeight:150,objectFit:'cover',borderRadius:6,marginBottom:8}}/>}
                    <Button component="label" variant="outlined" size="small" startIcon={<ImageOutlinedIcon/>}>
                        Chọn ảnh
                        <input hidden type="file" accept="image/*" onChange={e => {
                            const f = e.target.files?.[0];
                            if (f) { setImgFile(f); setPreview(URL.createObjectURL(f)); }
                        }}/>
                    </Button>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAdd(false)}>Hủy</Button>
                    <Button variant="contained" onClick={handleAdd} disabled={uploading}>
                        {uploading ? 'Đang tải...' : 'Thêm'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Branch;
