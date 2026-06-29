import React, { useState, useEffect } from 'react';
import {
    Box, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useTheme } from '@mui/material';
import { tokens } from '../../theme';
import Head from '../../Components/Head';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';
import { fetchWithAuth } from '../../Components/fetchWithAuth/fetchWithAuth';
import { API_BASE } from '../../config';
import AddOutlinedIcon   from '@mui/icons-material/AddOutlined';
import EditOutlinedIcon  from '@mui/icons-material/EditOutlined';
import ToggleOnOutlinedIcon  from '@mui/icons-material/ToggleOnOutlined';
import ToggleOffOutlinedIcon from '@mui/icons-material/ToggleOffOutlined';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '';
const blankForm = {
    code:'', name:'', description:'', discountType:'Percent',
    discountValue:'', minOrderAmount:'0', maxDiscount:'', usageLimit:'',
    validFrom:'', validTo:'',
};

const Discount = () => {
    const theme  = useTheme();
    const colors = tokens(theme.palette.mode);
    const token  = sessionStorage.getItem('token');
    const decoded = token ? jwtDecode(token) : {};
    const myRole  = decoded.role || '';
    const canEdit = ['SuperAdmin','PartnerAdmin'].includes(myRole);

    const [rows,     setRows]     = useState([]);
    const [openEdit, setOpenEdit] = useState(false);
    const [openAdd,  setOpenAdd]  = useState(false);
    const [selected, setSelected] = useState(null);
    const [form,     setForm]     = useState(blankForm);

    const dgSx = {
        border:'none',
        '& .MuiDataGrid-cell':           { borderBottom:`1px solid ${colors.primary[300]}` },
        '& .MuiDataGrid-columnHeaders':  { background:colors.blueAccent[700], borderBottom:'none' },
        '& .MuiDataGrid-virtualScroller':{ background:colors.primary[400] },
        '& .MuiDataGrid-footerContainer':{ background:colors.blueAccent[700], borderTop:'none' },
    };

    const fetchData = async () => {
        try {
            const res  = await fetchWithAuth(`${API_BASE}/promotions`);
            if (!res.ok) return;
            const data = await res.json();
            setRows(data.map((p,i) => ({ ...p, id: i+1 })));
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        fetchData();
        const id = setInterval(fetchData, 30000);
        return () => clearInterval(id);
    }, []);

    const buildBody = (src) => ({
        code:           src.code.toUpperCase(),
        name:           src.name,
        description:    src.description || null,
        discountType:   src.discountType,
        discountValue:  parseFloat(src.discountValue)||0,
        minOrderAmount: parseFloat(src.minOrderAmount)||0,
        maxDiscount:    src.maxDiscount ? parseFloat(src.maxDiscount) : null,
        usageLimit:     src.usageLimit  ? parseInt(src.usageLimit)    : null,
        validFrom:      src.validFrom,
        validTo:        src.validTo,
    });

    const handleSave = async () => {
        if (!selected) return;
        try {
            const res = await fetchWithAuth(`${API_BASE}/promotions/${selected.promotionId}`, {
                method:'PUT', headers:{'Content-Type':'application/json'},
                body: JSON.stringify(buildBody(selected)),
            });
            if (res.ok) { toast.success('Cập nhật thành công!'); setOpenEdit(false); fetchData(); }
            else toast.error('Cập nhật thất bại.');
        } catch { toast.error('Lỗi kết nối.'); }
    };

    const handleAdd = async () => {
        if (!form.code || !form.name || !form.validFrom || !form.validTo) {
            toast.warning('Vui lòng điền đầy đủ thông tin.'); return;
        }
        try {
            const res = await fetchWithAuth(`${API_BASE}/promotions`, {
                method:'POST', headers:{'Content-Type':'application/json'},
                body: JSON.stringify(buildBody(form)),
            });
            if (res.ok) { toast.success('Thêm khuyến mãi thành công!'); setOpenAdd(false); setForm(blankForm); fetchData(); }
            else toast.error('Thêm thất bại.');
        } catch { toast.error('Lỗi kết nối.'); }
    };

    const handleToggle = async (id, current) => {
        try {
            const res = await fetchWithAuth(`${API_BASE}/promotions/${id}/status`, { method:'PATCH' });
            if (res.ok) { toast.success(current ? 'Đã tắt khuyến mãi.' : 'Đã bật khuyến mãi.'); fetchData(); }
        } catch { toast.error('Thao tác thất bại.'); }
    };

    const columns = [
        { field:'id', headerName:'STT', width:60 },
        { field:'code', headerName:'Mã KM', width:110 },
        { field:'name', headerName:'Tên khuyến mãi', flex:1.5 },
        {
            field:'discountType', headerName:'Loại', width:100,
            renderCell:({value}) => <Chip label={value==='Percent'?'%':'Cố định'} color={value==='Percent'?'primary':'info'} size="small"/>,
        },
        {
            field:'discountValue', headerName:'Giá trị', width:100,
            renderCell:({value, row}) => row.discountType==='Percent'?`${value}%`:`${Number(value).toLocaleString('vi-VN')}đ`,
        },
        {
            field:'validFrom', headerName:'Từ ngày', width:110,
            renderCell:({value}) => fmtDate(value),
        },
        {
            field:'validTo', headerName:'Đến ngày', width:110,
            renderCell:({value}) => fmtDate(value),
        },
        {
            field:'usageCount', headerName:'Đã dùng', width:90, type:'number',
            renderCell:({value, row}) => `${value}/${row.usageLimit||'∞'}`,
        },
        {
            field:'isActive', headerName:'Trạng thái', width:110,
            renderCell:({value}) => <Chip label={value?'Đang dùng':'Đã tắt'} color={value?'success':'default'} size="small"/>,
        },
        ...(canEdit ? [{
            field:'actions', headerName:'', width:140, sortable:false,
            renderCell:({row}) => (
                <Box display="flex" gap={0.5} alignItems="center" height="100%">
                    <Button size="small" startIcon={<EditOutlinedIcon/>}
                        onClick={() => { setSelected({...row}); setOpenEdit(true); }}>Sửa</Button>
                    <Button size="small" color={row.isActive?'warning':'success'}
                        startIcon={row.isActive?<ToggleOffOutlinedIcon/>:<ToggleOnOutlinedIcon/>}
                        onClick={() => handleToggle(row.promotionId, row.isActive)}>
                        {row.isActive?'Tắt':'Bật'}
                    </Button>
                </Box>
            ),
        }] : []),
    ];

    const FormFields = ({ src, set }) => (
        <>
            <Box display="flex" gap={1}>
                <TextField label="Mã khuyến mãi" size="small" sx={{flex:1}} value={src.code}
                    onChange={e => set(p=>({...p,code:e.target.value.toUpperCase()}))}/>
                <TextField label="Tên" size="small" sx={{flex:2}} value={src.name}
                    onChange={e => set(p=>({...p,name:e.target.value}))}/>
            </Box>
            <TextField label="Mô tả" size="small" multiline rows={2} value={src.description||''}
                onChange={e => set(p=>({...p,description:e.target.value}))} fullWidth/>
            <Box display="flex" gap={1}>
                <FormControl size="small" sx={{flex:1}}>
                    <InputLabel>Loại giảm</InputLabel>
                    <Select value={src.discountType} label="Loại giảm"
                        onChange={e => set(p=>({...p,discountType:e.target.value}))}>
                        <MenuItem value="Percent">Phần trăm (%)</MenuItem>
                        <MenuItem value="Fixed">Cố định (đ)</MenuItem>
                    </Select>
                </FormControl>
                <TextField label="Giá trị" size="small" type="number" sx={{flex:1}} value={src.discountValue}
                    onChange={e => set(p=>({...p,discountValue:e.target.value}))}/>
            </Box>
            <Box display="flex" gap={1}>
                <TextField label="Đơn hàng tối thiểu" size="small" type="number" sx={{flex:1}} value={src.minOrderAmount}
                    onChange={e => set(p=>({...p,minOrderAmount:e.target.value}))}/>
                <TextField label="Giảm tối đa (để trống=không giới hạn)" size="small" type="number" sx={{flex:1}} value={src.maxDiscount||''}
                    onChange={e => set(p=>({...p,maxDiscount:e.target.value}))}/>
            </Box>
            <Box display="flex" gap={1}>
                <TextField label="Số lần dùng tối đa" size="small" type="number" sx={{flex:1}} value={src.usageLimit||''}
                    onChange={e => set(p=>({...p,usageLimit:e.target.value}))}/>
            </Box>
            <Box display="flex" gap={1}>
                <TextField label="Từ ngày" size="small" type="date" sx={{flex:1}} InputLabelProps={{shrink:true}}
                    value={src.validFrom ? src.validFrom.substring(0,10) : ''}
                    onChange={e => set(p=>({...p,validFrom:e.target.value}))}/>
                <TextField label="Đến ngày" size="small" type="date" sx={{flex:1}} InputLabelProps={{shrink:true}}
                    value={src.validTo ? src.validTo.substring(0,10) : ''}
                    onChange={e => set(p=>({...p,validTo:e.target.value}))}/>
            </Box>
        </>
    );

    return (
        <Box m="20px">
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Head title="Khuyến mãi" subtitle="Quản lý chương trình khuyến mãi"/>
                {canEdit && (
                    <Button variant="contained" startIcon={<AddOutlinedIcon/>}
                        sx={{background:colors.blueAccent[700]}}
                        onClick={() => { setForm(blankForm); setOpenAdd(true); }}>
                        Thêm khuyến mãi
                    </Button>
                )}
            </Box>
            <Box height="70vh" sx={dgSx}>
                <DataGrid rows={rows} columns={columns}
                    pageSizeOptions={[20,50]} initialState={{pagination:{paginationModel:{pageSize:20}}}}/>
            </Box>

            {/* Edit dialog */}
            <Dialog open={openEdit} onClose={() => setOpenEdit(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Chỉnh sửa khuyến mãi</DialogTitle>
                <DialogContent sx={{display:'flex',flexDirection:'column',gap:1.5,pt:2}}>
                    {selected && <FormFields src={selected} set={setSelected}/>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenEdit(false)}>Hủy</Button>
                    <Button variant="contained" onClick={handleSave}>Lưu</Button>
                </DialogActions>
            </Dialog>

            {/* Add dialog */}
            <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Thêm khuyến mãi mới</DialogTitle>
                <DialogContent sx={{display:'flex',flexDirection:'column',gap:1.5,pt:2}}>
                    <FormFields src={form} set={setForm}/>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAdd(false)}>Hủy</Button>
                    <Button variant="contained" onClick={handleAdd}>Thêm</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Discount;
