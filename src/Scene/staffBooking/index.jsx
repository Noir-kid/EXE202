import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Button, Chip, Tooltip, Dialog, DialogTitle,
    DialogContent, DialogActions, Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useTheme } from '@mui/material';
import { tokens } from '../../theme';
import Head from '../../Components/Head';
import { jwtDecode } from 'jwt-decode';
import { fetchWithAuth } from '../../Components/fetchWithAuth/fetchWithAuth';
import { toast } from 'react-toastify';
import { API_BASE } from '../../config';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon     from '@mui/icons-material/CancelOutlined';
import InfoOutlinedIcon       from '@mui/icons-material/InfoOutlined';
import LoginOutlinedIcon      from '@mui/icons-material/LoginOutlined';

const STATUS_LABEL = {
    Pending:    'Chờ xác nhận',
    Confirmed:  'Đã xác nhận',
    CheckedIn:  'Đã check-in',
    CheckedOut: 'Đã check-out',
    Cancelled:  'Đã hủy',
    NoShow:     'Không đến',
};
const STATUS_COLOR = {
    Pending:   'default',
    Confirmed: 'success',
    CheckedIn: 'info',
    CheckedOut:'primary',
    Cancelled: 'error',
    NoShow:    'warning',
};

const StaffBooking = () => {
    const theme  = useTheme();
    const colors = tokens(theme.palette.mode);
    const token  = sessionStorage.getItem('token');
    const decoded = token ? jwtDecode(token) : {};

    const [rows,    setRows]    = useState([]);
    const [total,   setTotal]   = useState(0);
    const [selected, setSelected] = useState(null);
    const [openDetail, setOpenDetail] = useState(false);
    const [loading, setLoading] = useState(false);
    const [paginationModel, setPaginationModel] = useState({ page:0, pageSize:25 });

    const fetchBookings = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const { page, pageSize } = paginationModel;
            const res  = await fetchWithAuth(`${API_BASE}/bookings?page=${page+1}&pageSize=${pageSize}`);
            if (!res.ok) return;
            const data = await res.json();
            setRows((data.items||[]).map(b => ({ ...b, id: b.bookingId })));
            setTotal(data.total||0);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [token, paginationModel]);

    useEffect(() => {
        fetchBookings();
        const id = setInterval(fetchBookings, 30000);
        return () => clearInterval(id);
    }, [fetchBookings]);

    const updateStatus = async (bookingId, newStatus) => {
        try {
            const res = await fetchWithAuth(`${API_BASE}/bookings/${bookingId}/status`, {
                method:'PATCH', headers:{'Content-Type':'application/json'},
                body: JSON.stringify({ newStatus }),
            });
            if (res.ok) {
                toast.success(`Đã cập nhật: ${STATUS_LABEL[newStatus]}`);
                fetchBookings();
            } else toast.error('Cập nhật thất bại.');
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
            field:'actions', headerName:'', width:180, sortable:false,
            renderCell:({row}) => (
                <Box display="flex" gap={0.5} alignItems="center" height="100%">
                    <Tooltip title="Chi tiết">
                        <Button size="small" color="info" onClick={() => { setSelected(row); setOpenDetail(true); }}>
                            <InfoOutlinedIcon fontSize="small"/>
                        </Button>
                    </Tooltip>
                    {row.status === 'Pending' && (
                        <Tooltip title="Xác nhận">
                            <Button size="small" color="success" onClick={() => updateStatus(row.bookingId,'Confirmed')}>
                                <CheckCircleOutlineIcon fontSize="small"/>
                            </Button>
                        </Tooltip>
                    )}
                    {row.status === 'Confirmed' && (
                        <Tooltip title="Check-in">
                            <Button size="small" color="primary" onClick={() => updateStatus(row.bookingId,'CheckedIn')}>
                                <LoginOutlinedIcon fontSize="small"/>
                            </Button>
                        </Tooltip>
                    )}
                    {['Pending','Confirmed'].includes(row.status) && (
                        <Tooltip title="Hủy">
                            <Button size="small" color="error" onClick={() => updateStatus(row.bookingId,'Cancelled')}>
                                <CancelOutlinedIcon fontSize="small"/>
                            </Button>
                        </Tooltip>
                    )}
                </Box>
            ),
        },
    ];

    return (
        <Box m="20px">
            <Head title="Quản lý đặt sân" subtitle="Danh sách đặt sân theo chi nhánh"/>
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

            <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Chi tiết đặt sân</DialogTitle>
                <DialogContent>
                    {selected && (
                        <Box display="flex" flexDirection="column" gap={1} pt={1}>
                            <Typography><b>Mã đặt:</b> {selected.bookingId}</Typography>
                            <Typography><b>Sân:</b> {selected.courtName}</Typography>
                            <Typography><b>Chi nhánh:</b> {selected.branchName}</Typography>
                            <Typography><b>Ngày:</b> {selected.bookingDate}</Typography>
                            <Typography><b>Giờ:</b> {selected.startTime} – {selected.endTime}</Typography>
                            <Typography><b>Tổng tiền:</b> {Number(selected.totalAmount).toLocaleString('vi-VN')}đ</Typography>
                            <Typography><b>Trạng thái:</b> {STATUS_LABEL[selected.status]||selected.status}</Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDetail(false)}>Đóng</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default StaffBooking;
