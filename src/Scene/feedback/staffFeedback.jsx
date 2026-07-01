import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useTheme } from '@mui/material';
import { tokens } from '../../theme';
import Head from '../../Components/Head';
import { jwtDecode } from 'jwt-decode';
import { fetchWithAuth } from '../../Components/fetchWithAuth/fetchWithAuth';
import { API_BASE } from '../../config';

const Stars = ({ value }) => (
    <span style={{ color:'#eab308', fontWeight:700 }}>
        {'★'.repeat(value)}{'☆'.repeat(5-value)}
    </span>
);

const StaffFeedback = () => {
    const theme  = useTheme();
    const colors = tokens(theme.palette.mode);
    const token  = sessionStorage.getItem('token');
    const decoded = token ? jwtDecode(token) : {};

    const [rows, setRows] = useState([]);

    const fetchData = async () => {
        if (!token) return;
        try {
            const res = await fetchWithAuth(`${API_BASE}/reviews`);
            if (!res.ok) return;
            const data = await res.json();
            setRows(data.map((r,i) => ({ ...r, id: r.reviewId || i })));
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        fetchData();
        const id = setInterval(fetchData, 30000);
        return () => clearInterval(id);
    }, [token]);

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
        { field:'userName',  headerName:'Khách hàng', flex:1 },
        { field:'courtName', headerName:'Sân', flex:1 },
        {
            field:'rating', headerName:'Sao', width:130,
            renderCell:({value}) => <Stars value={value}/>,
        },
        { field:'comment', headerName:'Nội dung', flex:2 },
        {
            field:'createdAt', headerName:'Thời gian', width:160,
            renderCell:({value}) => value ? new Date(value).toLocaleString('vi-VN') : '',
        },
    ];

    return (
        <Box m="20px">
            <Head title="Phản hồi khách hàng" subtitle="Đánh giá tại chi nhánh của bạn"/>
            <Box height="75vh" mt={2} sx={dgSx}>
                <DataGrid rows={rows} columns={columns} rowHeight={52} disableRowSelectionOnClick
                    pageSizeOptions={[25,50,100]}
                    initialState={{pagination:{paginationModel:{pageSize:25}}}}
                    getRowClassName={p => p.indexRelativeToCurrentPage % 2 === 0 ? 'row-even' : 'row-odd'}/>
            </Box>
        </Box>
    );
};

export default StaffFeedback;
