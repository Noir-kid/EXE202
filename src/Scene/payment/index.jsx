import React, { useState, useEffect, useCallback } from 'react';
import { Box, Chip } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useTheme } from '@mui/material';
import { tokens } from '../../theme';
import Head from '../../Components/Head';
import { fetchWithAuth } from '../../Components/fetchWithAuth/fetchWithAuth';
import { API_BASE } from '../../config';

const METHOD_LABELS = { MoMo:'MoMo', VNPay:'VNPay', Cash:'Tiền mặt', Wallet:'Ví' };
const METHOD_COLORS = { MoMo:'secondary', VNPay:'primary', Cash:'default', Wallet:'info' };
const STATUS_LABELS = { Pending:'Chờ', Success:'Thành công', Failed:'Thất bại', Refunded:'Hoàn tiền' };
const STATUS_COLORS = { Pending:'warning', Success:'success', Failed:'error', Refunded:'info' };

const Payment = () => {
    const theme  = useTheme();
    const colors = tokens(theme.palette.mode);

    const [rows,  setRows]  = useState([]);
    const [total, setTotal] = useState(0);
    const [paginationModel, setPaginationModel] = useState({ page:0, pageSize:20 });
    const [loading, setLoading] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { page, pageSize } = paginationModel;
            const res  = await fetchWithAuth(`${API_BASE}/payments?page=${page+1}&pageSize=${pageSize}`);
            if (!res.ok) return;
            const data = await res.json();
            setRows((data.items||[]).map((item,i) => ({ ...item, id: item.paymentId || i })));
            setTotal(data.total||0);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [paginationModel]);

    useEffect(() => {
        fetchData();
        const id = setInterval(fetchData, 30000);
        return () => clearInterval(id);
    }, [fetchData]);

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
        { field:'userName',   headerName:'Khách hàng', flex:1 },
        {
            field:'paidAt', headerName:'Ngày thanh toán', width:160,
            renderCell:({value}) => value ? new Date(value).toLocaleString('vi-VN') : '—',
        },
        {
            field:'method', headerName:'Phương thức', width:120,
            renderCell:({value}) => (
                <Chip label={METHOD_LABELS[value]||value} color={METHOD_COLORS[value]||'default'} size="small"/>
            ),
        },
        {
            field:'status', headerName:'Trạng thái', width:130,
            renderCell:({value}) => (
                <Chip label={STATUS_LABELS[value]||value} color={STATUS_COLORS[value]||'default'} size="small"/>
            ),
        },
        {
            field:'amount', headerName:'Số tiền', width:130, align:'right', headerAlign:'right',
            renderCell:({value}) => (
                <Box fontWeight={600} color={colors.greenAccent[400]}>
                    {Number(value).toLocaleString('vi-VN')}đ
                </Box>
            ),
        },
        { field:'transactionRef', headerName:'Mã giao dịch', width:150 },
    ];

    return (
        <Box m="20px">
            <Head title="Thanh toán" subtitle="Lịch sử giao dịch thanh toán"/>
            <Box height="75vh" mt={2} sx={dgSx}>
                <DataGrid
                    rows={rows} columns={columns} loading={loading} rowHeight={52} disableRowSelectionOnClick
                    rowCount={total} paginationMode="server"
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    pageSizeOptions={[20,50]}
                    getRowClassName={p => p.indexRelativeToCurrentPage % 2 === 0 ? 'row-even' : 'row-odd'}
                />
            </Box>
        </Box>
    );
};

export default Payment;
