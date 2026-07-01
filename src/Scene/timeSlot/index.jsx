import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, Chip, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useTheme } from '@mui/material';
import { tokens } from '../../theme';
import Head from '../../Components/Head';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';
import { fetchWithAuth } from '../../Components/fetchWithAuth/fetchWithAuth';
import { API_BASE } from '../../config';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon     from '@mui/icons-material/CancelOutlined';
import LoginOutlinedIcon      from '@mui/icons-material/LoginOutlined';

const STATUS_LABEL = {
    Pending:'Chờ xác nhận', Confirmed:'Đã xác nhận',
    CheckedIn:'Đã check-in', CheckedOut:'Đã check-out',
    Cancelled:'Đã hủy', NoShow:'Không đến',
};
const STATUS_COLOR = {
    Pending:'default', Confirmed:'success', CheckedIn:'info',
    CheckedOut:'primary', Cancelled:'error', NoShow:'warning',
};

const TimeSlotManagement = () => {
    const theme  = useTheme();
    const colors = tokens(theme.palette.mode);
    const token  = sessionStorage.getItem('token');
    const decoded = token ? jwtDecode(token) : {};
    const myRole  = decoded.role || '';

    const [rows,  setRows]  = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [paginationModel, setPaginationModel] = useState({ page:0, pageSize:25 });

    const fetchData = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const { page, pageSize } = paginationModel;
            const res = await fetchWithAuth(`${API_BASE}/bookings?page=${page+1}&pageSize=${pageSize}`);
            if (!res.ok) return;
            const data = await res.json();
            setRows((data.items||[]).map(b => ({ ...b, id: b.bookingId })));
            setTotal(data.total||0);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [token, paginationModel]);

    useEffect(() => {
        fetchData();
        const id = setInterval(fetchData, 30000);
        return () => clearInterval(id);
    }, [fetchData]);

    const updateStatus = async (bookingId, newStatus) => {
        try {
            const res = await fetchWithAuth(`${API_BASE}/bookings/${bookingId}/status`, {
                method:'PATCH', headers:{'Content-Type':'application/json'},
                body: JSON.stringify({ newStatus }),
            });
            if (res.ok) { toast.success(`${STATUS_LABEL[newStatus]}`); fetchData(); }
            else toast.error('Cập nhật thất bại.');
        } catch { toast.error('Lỗi kết nối.'); }
    };

    const dgSx = {
        border: 'none',
        borderRadius: 2,
        overflow: 'hidden',
        '& .MuiDataGrid-cell':          { borderBottom: 'none', color: colors.grey[100] },
        '& .MuiDataGrid-row':           { borderBottom: `1px solid rgba(148,163,184,0.07)` },
        '& .MuiDataGrid-row.row-even':  { background: colors.bg.card },
        '& .MuiDataGrid-row.row-odd':   { background: colors.bg.secondary },
        '& .MuiDataGrid-row:hover':     { background: `${colors.bg.cardHover} !important` },
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

    const columns = [
        { field:'courtName',  headerName:'Sân', flex:1 },
        { field:'branchName', headerName:'Chi nhánh', flex:1 },
        {
            field:'bookingDate', headerName:'Ngày', width:110,
            renderCell:({value}) => value ? new Date(value+'T00:00:00').toLocaleDateString('vi-VN') : '—',
        },
        {
            field:'startTime', headerName:'Giờ', width:130,
            renderCell:({row}) => `${row.startTime||'?'} – ${row.endTime||'?'}`,
        },
        {
            field:'totalAmount', headerName:'Tổng tiền', width:120, align:'right',
            renderCell:({value}) => `${Number(value).toLocaleString('vi-VN')}đ`,
        },
        {
            field:'status', headerName:'Trạng thái', width:140,
            renderCell:({value}) => <Chip label={STATUS_LABEL[value]||value} color={STATUS_COLOR[value]||'default'} size="small"/>,
        },
        {
            field:'actions', headerName:'Hành động', width:160, sortable:false,
            renderCell:({row}) => (
                <Box display="flex" gap={0.5} alignItems="center" height="100%">
                    {row.status === 'Pending' && (
                        <Button size="small" color="success" startIcon={<CheckCircleOutlineIcon/>}
                            onClick={() => updateStatus(row.bookingId,'Confirmed')}>Xác nhận</Button>
                    )}
                    {row.status === 'Confirmed' && (
                        <Button size="small" color="primary" startIcon={<LoginOutlinedIcon/>}
                            onClick={() => updateStatus(row.bookingId,'CheckedIn')}>Check-in</Button>
                    )}
                    {['Pending','Confirmed'].includes(row.status) && (
                        <Button size="small" color="error" startIcon={<CancelOutlinedIcon/>}
                            onClick={() => updateStatus(row.bookingId,'Cancelled')}>Hủy</Button>
                    )}
                </Box>
            ),
        },
    ];

    return (
        <Box m="20px">
            <Head title="Đặt sân" subtitle="Quản lý lịch đặt sân"/>
            <Box height="75vh" mt={2} sx={dgSx}>
                <DataGrid
                    rows={rows} columns={columns} loading={loading} rowHeight={52} disableRowSelectionOnClick
                    rowCount={total} paginationMode="server"
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    pageSizeOptions={[25,50,100]}
                    getRowClassName={p => p.indexRelativeToCurrentPage % 2 === 0 ? 'row-even' : 'row-odd'}
                />
            </Box>
        </Box>
    );
};

export default TimeSlotManagement;
