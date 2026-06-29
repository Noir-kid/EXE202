import React, { useState, useEffect } from 'react';
import { Box, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useTheme } from '@mui/material';
import { tokens } from '../../theme';
import Head from '../../Components/Head';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';
import { fetchWithAuth } from '../../Components/fetchWithAuth/fetchWithAuth';
import { API_BASE } from '../../config';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const ROLE_LABELS = {
    SuperAdmin: 'Super Admin', PartnerAdmin: 'Chủ sân',
    BranchManager: 'Quản lý CN', Staff: 'Nhân viên', Customer: 'Khách hàng',
};
const ROLE_COLORS = {
    SuperAdmin: 'error', PartnerAdmin: 'success',
    BranchManager: 'warning', Staff: 'info', Customer: 'default',
};

const User = () => {
    const theme  = useTheme();
    const colors = tokens(theme.palette.mode);
    const token  = sessionStorage.getItem('token');
    const decoded = token ? jwtDecode(token) : {};
    const myRole = decoded.role || '';

    const [rows, setRows]         = useState([]);
    const [loading, setLoading]   = useState(true);

    const dgSx = {
        border: 'none',
        '& .MuiDataGrid-cell': { borderBottom: `1px solid ${colors.primary[300]}` },
        '& .MuiDataGrid-columnHeaders': { background: colors.blueAccent[700], borderBottom: 'none' },
        '& .MuiDataGrid-virtualScroller': { background: colors.primary[400] },
        '& .MuiDataGrid-footerContainer': { background: colors.blueAccent[700], borderTop: 'none' },
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const res  = await fetchWithAuth(`${API_BASE}/users`);
            const data = await res.json();
            setRows(data.map((u, i) => ({ ...u, id: u.userId || i })));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const id = setInterval(fetchData, 30000);
        return () => clearInterval(id);
    }, []);

    const toggleStatus = async (userId, current) => {
        try {
            const res = await fetchWithAuth(`${API_BASE}/users/${userId}/status`, { method: 'PATCH' });
            if (res.ok) {
                toast.success(current ? 'Đã khóa tài khoản.' : 'Đã mở khóa tài khoản.');
                fetchData();
            }
        } catch { toast.error('Thao tác thất bại.'); }
    };

    const columns = [
        { field: 'id', headerName: 'STT', width: 60 },
        { field: 'email', headerName: 'Email', flex: 1.5 },
        {
            field: 'fullName', headerName: 'Họ tên', flex: 1,
            valueGetter: (_, row) => `${row.lastName || ''} ${row.firstName || ''}`.trim(),
        },
        { field: 'phone', headerName: 'SĐT', width: 130 },
        {
            field: 'roleCode', headerName: 'Vai trò', width: 130,
            renderCell: ({ value }) => (
                <Chip label={ROLE_LABELS[value] || value} color={ROLE_COLORS[value] || 'default'} size="small"/>
            ),
        },
        { field: 'branchName', headerName: 'Chi nhánh', flex: 1 },
        {
            field: 'isActive', headerName: 'Trạng thái', width: 120,
            renderCell: ({ value }) => (
                <Chip label={value ? 'Hoạt động' : 'Đã khóa'} color={value ? 'success' : 'error'} size="small"/>
            ),
        },
        {
            field: 'actions', headerName: 'Thao tác', width: 120, sortable: false,
            renderCell: ({ row }) => (
                myRole === 'SuperAdmin' || myRole === 'PartnerAdmin' ? (
                    <Button size="small" color={row.isActive ? 'error' : 'success'}
                        startIcon={row.isActive ? <BlockOutlinedIcon/> : <CheckCircleOutlineIcon/>}
                        onClick={() => toggleStatus(row.userId, row.isActive)}>
                        {row.isActive ? 'Khóa' : 'Mở'}
                    </Button>
                ) : null
            ),
        },
    ];

    return (
        <Box m="20px">
            <Head title="Quản lý người dùng" subtitle="Danh sách tài khoản trong hệ thống"/>
            <Box mt="20px" height="70vh" sx={dgSx}>
                <DataGrid rows={rows} columns={columns} loading={loading} rowHeight={52}
                    pageSizeOptions={[20, 50]} initialState={{ pagination: { paginationModel: { pageSize: 20 } } }}/>
            </Box>
        </Box>
    );
};

export default User;
