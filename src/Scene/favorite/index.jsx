import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useTheme } from '@mui/material';
import { tokens } from '../../theme';
import Head from '../../Components/Head';
import { fetchWithAuth } from '../../Components/fetchWithAuth/fetchWithAuth';
import { API_BASE } from '../../config';
import FavoriteOutlinedIcon from '@mui/icons-material/FavoriteOutlined';

const Favorite = () => {
    const theme  = useTheme();
    const colors = tokens(theme.palette.mode);
    const [rows, setRows] = useState([]);

    const dgSx = {
        border: 'none',
        borderRadius: 2,
        overflow: 'hidden',
        '& .MuiDataGrid-cell': { borderBottom: 'none', color: colors.grey[100] },
        '& .MuiDataGrid-row':          { borderBottom: `1px solid rgba(148,163,184,0.07)` },
        '& .MuiDataGrid-row.row-even': { background: colors.bg.card },
        '& .MuiDataGrid-row.row-odd':  { background: colors.bg.secondary },
        '& .MuiDataGrid-row:hover':    { background: `${colors.bg.cardHover} !important` },
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

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetchWithAuth(`${API_BASE}/favorites/stats`);
                if (!res.ok) return;
                const data = await res.json();
                setRows(data.map((d, i) => ({ ...d, id: d.courtId, stt: i + 1 })));
            } catch (e) { console.error(e); }
        };
        fetchData();
        const timer = setInterval(fetchData, 30000);
        return () => clearInterval(timer);
    }, []);

    const columns = [
        { field: 'stt', headerName: '#', width: 50 },
        { field: 'name', headerName: 'Sân', flex: 1 },
        { field: 'branchName', headerName: 'Chi nhánh', flex: 1 },
        {
            field: 'favoriteCount', headerName: 'Lượt yêu thích', width: 160,
            renderCell: ({ value }) => (
                <Box display="flex" alignItems="center" gap={0.5} height="100%">
                    <FavoriteOutlinedIcon sx={{ fontSize: 16, color: colors.redAccent?.[400] || '#ef4444' }} />
                    {value}
                </Box>
            ),
        },
    ];

    return (
        <Box m="20px">
            <Head title="Sân yêu thích" subtitle="Thống kê lượt yêu thích theo sân" />
            <Box height="70vh" mt={2} sx={dgSx}>
                <DataGrid
                    rows={rows} columns={columns} rowHeight={52}
                    pageSizeOptions={[20, 50]}
                    initialState={{ pagination: { paginationModel: { pageSize: 20 } } }}
                    disableRowSelectionOnClick
                    getRowClassName={p => p.indexRelativeToCurrentPage % 2 === 0 ? 'row-even' : 'row-odd'}
                />
            </Box>
        </Box>
    );
};

export default Favorite;
