import React, { useState, useEffect } from 'react';
import {
    Box, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useTheme } from '@mui/material';
import { tokens } from '../../theme';
import Head from '../../Components/Head';
import { jwtDecode } from 'jwt-decode';
import { fetchWithAuth } from '../../Components/fetchWithAuth/fetchWithAuth';
import { toast } from 'react-toastify';
import { API_BASE } from '../../config';
import AddOutlinedIcon    from '@mui/icons-material/AddOutlined';
import BlockOutlinedIcon  from '@mui/icons-material/BlockOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const OwnerStaff = () => {
    const theme  = useTheme();
    const colors = tokens(theme.palette.mode);
    const token  = sessionStorage.getItem('token');
    const decoded = token ? jwtDecode(token) : {};
    const myRole  = decoded.role || '';

    const [rows, setRows]     = useState([]);
    const [openAdd, setOpenAdd] = useState(false);
    const blankForm = { email:'', password:'', firstName:'', lastName:'', phone:'' };
    const [form, setForm] = useState(blankForm);

    const dgSx = {
        border:'none',
        '& .MuiDataGrid-cell':           { borderBottom:`1px solid ${colors.primary[300]}` },
        '& .MuiDataGrid-columnHeaders':  { background:colors.blueAccent[700], borderBottom:'none' },
        '& .MuiDataGrid-virtualScroller':{ background:colors.primary[400] },
        '& .MuiDataGrid-footerContainer':{ background:colors.blueAccent[700], borderTop:'none' },
    };

    const fetchStaff = async () => {
        if (!token) return;
        try {
            const res  = await fetchWithAuth(`${API_BASE}/users`);
            if (!res.ok) return;
            const data = await res.json();
            // Filter to show only Staff (not PartnerAdmin/BranchManager) unless SuperAdmin
            const staff = myRole === 'SuperAdmin'
                ? data
                : data.filter(u => u.roleCode === 'Staff' || u.roleCode === 'BranchManager');
            setRows(staff.map((u,i) => ({ ...u, id: u.userId || i })));
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchStaff();
        const id = setInterval(fetchStaff, 30000);
        return () => clearInterval(id);
    }, []);

    const handleAdd = async () => {
        if (!form.email || !form.password) {
            toast.warning('Email và mật khẩu không được để trống.'); return;
        }
        try {
            const res = await fetchWithAuth(`${API_BASE}/users/staff`, {
                method:'POST', headers:{'Content-Type':'application/json'},
                body: JSON.stringify({
                    email:     form.email,
                    password:  form.password,
                    firstName: form.firstName,
                    lastName:  form.lastName,
                    phone:     form.phone,
                    partnerId: null,
                    branchId:  null,
                }),
            });
            if (res.ok) {
                toast.success('Thêm nhân viên thành công!');
                setOpenAdd(false); setForm(blankForm); fetchStaff();
            } else {
                const err = await res.text();
                toast.error(err || 'Thêm nhân viên thất bại.');
            }
        } catch { toast.error('Lỗi kết nối.'); }
    };

    const toggleStatus = async (userId, current) => {
        try {
            const res = await fetchWithAuth(`${API_BASE}/users/${userId}/status`, { method:'PATCH' });
            if (res.ok) { toast.success(current ? 'Đã khóa.' : 'Đã mở khóa.'); fetchStaff(); }
        } catch { toast.error('Thao tác thất bại.'); }
    };

    const columns = [
        { field:'email', headerName:'Email', flex:1.5 },
        {
            field:'fullName', headerName:'Họ tên', flex:1,
            valueGetter:(_,row) => `${row.lastName||''} ${row.firstName||''}`.trim(),
        },
        { field:'phone', headerName:'SĐT', width:130 },
        { field:'branchName', headerName:'Chi nhánh', flex:1 },
        {
            field:'roleCode', headerName:'Vai trò', width:140,
            renderCell:({value}) => (
                <Chip label={value==='Staff'?'Nhân viên':value==='BranchManager'?'Quản lý CN':value}
                    color={value==='Staff'?'info':'warning'} size="small"/>
            ),
        },
        {
            field:'isActive', headerName:'Trạng thái', width:120,
            renderCell:({value}) => <Chip label={value?'Hoạt động':'Đã khóa'} color={value?'success':'error'} size="small"/>,
        },
        {
            field:'actions', headerName:'', width:110, sortable:false,
            renderCell:({row}) => (
                <Button size="small" color={row.isActive?'error':'success'}
                    startIcon={row.isActive?<BlockOutlinedIcon/>:<CheckCircleOutlineIcon/>}
                    onClick={() => toggleStatus(row.userId, row.isActive)}>
                    {row.isActive?'Khóa':'Mở'}
                </Button>
            ),
        },
    ];

    return (
        <Box m="20px">
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Head title="Nhân viên" subtitle="Quản lý nhân viên chi nhánh"/>
                <Button variant="contained" startIcon={<AddOutlinedIcon/>}
                    sx={{background:colors.blueAccent[700]}}
                    onClick={() => { setForm(blankForm); setOpenAdd(true); }}>
                    Thêm nhân viên
                </Button>
            </Box>
            <Box height="70vh" sx={dgSx}>
                <DataGrid rows={rows} columns={columns} rowHeight={52}
                    pageSizeOptions={[20,50]} initialState={{pagination:{paginationModel:{pageSize:20}}}}/>
            </Box>

            <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Thêm nhân viên mới</DialogTitle>
                <DialogContent sx={{display:'flex',flexDirection:'column',gap:2,pt:2}}>
                    <TextField label="Email *" value={form.email}
                        onChange={e => setForm({...form,email:e.target.value})} fullWidth size="small"/>
                    <TextField label="Mật khẩu *" type="password" value={form.password}
                        onChange={e => setForm({...form,password:e.target.value})} fullWidth size="small"/>
                    <Box display="flex" gap={2}>
                        <TextField label="Họ" value={form.lastName}
                            onChange={e => setForm({...form,lastName:e.target.value})} fullWidth size="small"/>
                        <TextField label="Tên" value={form.firstName}
                            onChange={e => setForm({...form,firstName:e.target.value})} fullWidth size="small"/>
                    </Box>
                    <TextField label="Số điện thoại" value={form.phone}
                        onChange={e => setForm({...form,phone:e.target.value})} fullWidth size="small"/>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAdd(false)}>Hủy</Button>
                    <Button variant="contained" onClick={handleAdd}>Thêm</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default OwnerStaff;
