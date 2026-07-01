import React, { useState, useEffect } from 'react';
import { Box, Button, Chip } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useTheme } from '@mui/material';
import { tokens } from '../../theme';
import Head from '../../Components/Head';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';
import { fetchWithAuth } from '../../Components/fetchWithAuth/fetchWithAuth';
import { API_BASE } from '../../config';
import ConfirmDialog from '../../Components/ConfirmDialog/ConfirmDialog';
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
    const theme   = useTheme();
    const colors  = tokens(theme.palette.mode);
    const token   = sessionStorage.getItem('token');
    const decoded = token ? jwtDecode(token) : {};
    const myRole  = decoded.role || '';

    const [rows, setRows]       = useState([]);
    const [loading, setLoading] = useState(true);
    const [lockTarget, setLockTarget] = useState(null);
    const [locking, setLocking] = useState(false);

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
            setLoading(true);
            const res  = await fetchWithAuth(`${API_BASE}/users`);
            const data = await res.json();
            // id = userId (stable DataGrid key), stt = display-only sequential number
            setRows(data.map((u, i) => ({ ...u, id: u.userId, stt: i + 1 })));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const timer = setInterval(fetchData, 30000);
        return () => clearInterval(timer);
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

    // Locking (deactivating) an account is the destructive action here — confirm first.
    // Re-activating ("Mở") is reversible and safe, so it fires immediately.
    const handleStatusClick = (row) => {
        if (row.isActive) setLockTarget(row);
        else toggleStatus(row.userId, row.isActive);
    };

    const handleConfirmLock = async () => {
        if (!lockTarget) return;
        setLocking(true);
        try {
            await toggleStatus(lockTarget.userId, lockTarget.isActive);
        } finally {
            setLocking(false);
            setLockTarget(null);
        }
    };

    const canManage = myRole === 'SuperAdmin' || myRole === 'PartnerAdmin';

    const columns = [
        { field: 'stt', headerName: 'STT', width: 60 },
        { field: 'email', headerName: 'Email', flex: 1.5 },
        {
            field: 'fullName', headerName: 'Họ tên', flex: 1,
            valueGetter: (_, row) => `${row.lastName || ''} ${row.firstName || ''}`.trim(),
        },
        { field: 'phone', headerName: 'SĐT', width: 130 },
        {
            field: 'roleCode', headerName: 'Vai trò', width: 140,
            renderCell: ({ value }) => (
                <Chip
                    label={ROLE_LABELS[value] || value}
                    color={ROLE_COLORS[value] || 'default'}
                    size="small"
                    sx={{ fontWeight: 600 }}
                />
            ),
        },
        { field: 'branchName', headerName: 'Chi nhánh', flex: 1 },
        {
            field: 'isActive', headerName: 'Trạng thái', width: 120,
            renderCell: ({ value }) => (
                <Chip
                    label={value ? 'Hoạt động' : 'Đã khóa'}
                    color={value ? 'success' : 'error'}
                    size="small"
                    sx={{ fontWeight: 600 }}
                />
            ),
        },
        ...(canManage ? [{
            field: 'actions', headerName: 'Thao tác', width: 120, sortable: false,
            renderCell: ({ row }) => (
                <Button
                    size="small"
                    color={row.isActive ? 'error' : 'success'}
                    startIcon={row.isActive ? <BlockOutlinedIcon /> : <CheckCircleOutlineIcon />}
                    sx={{ textTransform: 'none', fontWeight: 500 }}
                    onClick={() => handleStatusClick(row)}
                >
                    {row.isActive ? 'Khóa' : 'Mở'}
                </Button>
            ),
        }] : []),
    ];

    return (
        <Box m="20px">
            <Head title="Quản lý người dùng" subtitle="Danh sách tài khoản trong hệ thống" />
            <Box mt="20px" height="70vh" sx={dgSx}>
                <DataGrid
                    rows={rows}
                    columns={columns}
                    loading={loading}
                    rowHeight={52}
                    pageSizeOptions={[20, 50]}
                    initialState={{ pagination: { paginationModel: { pageSize: 20 } } }}
                    disableRowSelectionOnClick
                    getRowClassName={p => p.indexRelativeToCurrentPage % 2 === 0 ? 'row-even' : 'row-odd'}
                />
            </Box>

            <ConfirmDialog
                open={!!lockTarget}
                title="Khóa tài khoản"
                message={`Bạn có chắc muốn khóa tài khoản "${lockTarget?.email}"? Người dùng sẽ không thể đăng nhập cho đến khi được mở khóa lại.`}
                confirmLabel="Khóa"
                loading={locking}
                onConfirm={handleConfirmLock}
                onCancel={() => setLockTarget(null)}
            />
        </Box>
    );
};

export default User;
