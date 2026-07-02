import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Button, Tabs, Tab, TextField, FormControl, InputLabel, Select, MenuItem,
    Autocomplete, ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useTheme } from '@mui/material';
import { tokens } from '../../theme';
import Head from '../../Components/Head';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';
import { fetchWithAuth } from '../../Components/fetchWithAuth/fetchWithAuth';
import { API_BASE } from '../../config';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';

const ROLE_OPTIONS = [
    { value: 'Customer', label: 'Khách hàng' },
    { value: 'Staff', label: 'Nhân viên' },
    { value: 'BranchManager', label: 'Quản lý chi nhánh' },
    { value: 'PartnerAdmin', label: 'Chủ đối tác' },
];

const blankForm = { mode: 'single', userId: null, role: 'Customer', title: '', message: '' };

const Notification = () => {
    const theme   = useTheme();
    const colors  = tokens(theme.palette.mode);
    const token   = sessionStorage.getItem('token');
    const decoded = token ? jwtDecode(token) : {};
    const myRole  = decoded.role || '';
    const canBroadcast = myRole === 'SuperAdmin';

    const [tab, setTab]   = useState(0);
    const [users, setUsers] = useState([]);
    const [form, setForm] = useState(blankForm);
    const [sending, setSending] = useState(false);

    const [sentRows, setSentRows] = useState([]);
    const [sentTotal, setSentTotal] = useState(0);
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
    const [loadingSent, setLoadingSent] = useState(false);

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
        const fetchUsers = async () => {
            try {
                const res = await fetchWithAuth(`${API_BASE}/users`);
                if (!res.ok) return;
                setUsers(await res.json());
            } catch (e) { console.error(e); }
        };
        fetchUsers();
    }, []);

    const fetchSent = useCallback(async () => {
        setLoadingSent(true);
        try {
            const { page, pageSize } = paginationModel;
            const res = await fetchWithAuth(`${API_BASE}/notifications/sent?page=${page + 1}&pageSize=${pageSize}`);
            if (!res.ok) return;
            const data = await res.json();
            setSentRows((data.items || []).map(n => ({ ...n, id: n.notificationId })));
            setSentTotal(data.total || 0);
        } catch (e) { console.error(e); }
        finally { setLoadingSent(false); }
    }, [paginationModel]);

    useEffect(() => { if (tab === 1) fetchSent(); }, [tab, fetchSent]);

    const showError = async (res, fallback) => {
        try {
            const j = await res.json();
            toast.error(j.error || j.title || j.message || fallback);
        } catch { toast.error(fallback); }
    };

    const handleSend = async () => {
        if (!form.title.trim())   { toast.warning('Vui lòng nhập tiêu đề.'); return; }
        if (!form.message.trim()) { toast.warning('Vui lòng nhập nội dung.'); return; }
        if (form.mode === 'single' && !form.userId) { toast.warning('Vui lòng chọn người nhận.'); return; }

        setSending(true);
        try {
            let res;
            if (form.mode === 'broadcast') {
                res = await fetchWithAuth(`${API_BASE}/notifications/broadcast`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: form.title, message: form.message, role: form.role }),
                });
            } else {
                res = await fetchWithAuth(`${API_BASE}/notifications/send`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: form.userId, title: form.title, message: form.message }),
                });
            }
            if (!res.ok) { await showError(res, 'Gửi thông báo thất bại.'); return; }
            const data = await res.json();
            toast.success(form.mode === 'broadcast'
                ? `Đã gửi tới ${data.sentCount} người dùng.`
                : 'Đã gửi thông báo.');
            setForm(blankForm);
        } catch { toast.error('Lỗi kết nối.'); }
        finally { setSending(false); }
    };

    const sentColumns = [
        { field: 'title', headerName: 'Tiêu đề', flex: 1 },
        { field: 'message', headerName: 'Nội dung', flex: 1.5 },
        { field: 'recipientName', headerName: 'Người nhận', width: 160 },
        { field: 'recipientEmail', headerName: 'Email', width: 200 },
        {
            field: 'isRead', headerName: 'Đã đọc', width: 90,
            renderCell: ({ value }) => value ? '✓' : '—',
        },
        {
            field: 'createdAt', headerName: 'Thời gian', width: 160,
            renderCell: ({ value }) => new Date(value).toLocaleString('vi-VN'),
        },
    ];

    return (
        <Box m="20px">
            <Head title="Thông báo" subtitle="Gửi thông báo tới người dùng và xem lịch sử" />

            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mt: 2, mb: 2 }}>
                <Tab label="Soạn thông báo" />
                <Tab label="Lịch sử đã gửi" />
            </Tabs>

            {tab === 0 && (
                <Box maxWidth={520} display="flex" flexDirection="column" gap={2}>
                    <ToggleButtonGroup exclusive value={form.mode} size="small"
                        onChange={(_, v) => v && setForm(p => ({ ...p, mode: v }))}>
                        <ToggleButton value="single">Gửi cho 1 người</ToggleButton>
                        {canBroadcast && <ToggleButton value="broadcast">Gửi hàng loạt</ToggleButton>}
                    </ToggleButtonGroup>

                    {form.mode === 'single' ? (
                        <Autocomplete
                            options={users}
                            getOptionLabel={(u) => `${u.firstName || ''} ${u.lastName || ''} — ${u.email}`.trim()}
                            isOptionEqualToValue={(a, b) => a.userId === b.userId}
                            onChange={(_, v) => setForm(p => ({ ...p, userId: v?.userId || null }))}
                            renderInput={(params) => <TextField {...params} label="Người nhận *" size="small" />}
                        />
                    ) : (
                        <FormControl fullWidth size="small">
                            <InputLabel>Nhóm nhận *</InputLabel>
                            <Select value={form.role} label="Nhóm nhận *"
                                onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                                {ROLE_OPTIONS.map(r => (
                                    <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    <TextField label="Tiêu đề *" size="small" fullWidth
                        value={form.title}
                        onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                    <TextField label="Nội dung *" size="small" fullWidth multiline rows={4}
                        value={form.message}
                        onChange={e => setForm(p => ({ ...p, message: e.target.value }))} />

                    <Box>
                        <Button variant="contained" startIcon={<SendOutlinedIcon />} disabled={sending}
                            onClick={handleSend}
                            sx={{ background: colors.blueAccent[800], textTransform: 'none', fontWeight: 600 }}>
                            {sending ? 'Đang gửi...' : 'Gửi thông báo'}
                        </Button>
                    </Box>
                </Box>
            )}

            {tab === 1 && (
                <Box height="65vh" sx={dgSx}>
                    <DataGrid
                        rows={sentRows} columns={sentColumns} loading={loadingSent} rowHeight={56}
                        disableRowSelectionOnClick
                        rowCount={sentTotal} paginationMode="server"
                        paginationModel={paginationModel}
                        onPaginationModelChange={setPaginationModel}
                        pageSizeOptions={[20, 50, 100]}
                        getRowClassName={p => p.indexRelativeToCurrentPage % 2 === 0 ? 'row-even' : 'row-odd'}
                    />
                </Box>
            )}
        </Box>
    );
};

export default Notification;
