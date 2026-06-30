import React, { useState, useEffect } from 'react';
import {
    Box, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Typography, FormControl, InputLabel, Select, MenuItem, Tabs, Tab,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useTheme } from '@mui/material';
import { tokens } from '../../theme';
import Head from '../../Components/Head';
import { toast } from 'react-toastify';
import { fetchWithAuth } from '../../Components/fetchWithAuth/fetchWithAuth';
import { API_BASE } from '../../config';
import AddOutlinedIcon      from '@mui/icons-material/AddOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import BlockOutlinedIcon    from '@mui/icons-material/BlockOutlined';
import PeopleOutlinedIcon   from '@mui/icons-material/PeopleOutlined';

const STATUS_LABEL = { 0: 'Chờ duyệt', 1: 'Hoạt động', 2: 'Bị từ chối', 3: 'Tạm khóa' };
const STATUS_COLOR = { 0: 'warning', 1: 'success', 2: 'error', 3: 'default' };

const Partner = () => {
    const theme  = useTheme();
    const colors = tokens(theme.palette.mode);

    const [rows, setRows]       = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab]         = useState(0); // 0=All, 1=Pending, 2=Active

    const [openAdd,     setOpenAdd]     = useState(false);
    const [openMembers, setOpenMembers] = useState(false);
    const [openAssign,  setOpenAssign]  = useState(false);
    const [selPartner,  setSelPartner]  = useState(null);
    const [members,     setMembers]     = useState([]);
    const [users,       setUsers]       = useState([]);

    const blankForm = { companyName:'', contactName:'', email:'', phone:'', website:'', commissionRate:10 };
    const [form, setForm] = useState(blankForm);

    const blankAssign = { userId:'', roleCode:'PartnerAdmin', branchId:'' };
    const [assignForm, setAssignForm] = useState(blankAssign);
    const [branches,   setBranches]   = useState([]);

    const dgSx = {
        border:'none',
        '& .MuiDataGrid-cell':           { borderBottom:`1px solid ${colors.primary[300]}` },
        '& .MuiDataGrid-columnHeaders':  { background:colors.blueAccent[700], borderBottom:'none' },
        '& .MuiDataGrid-virtualScroller':{ background:colors.primary[400] },
        '& .MuiDataGrid-footerContainer':{ background:colors.blueAccent[700], borderTop:'none' },
    };

    const fetchPartners = async () => {
        setLoading(true);
        try {
            const statusMap = { 0: '', 1: '?status=0', 2: '?status=1' };
            const res  = await fetchWithAuth(`${API_BASE}/partners${statusMap[tab] || ''}`);
            const data = await res.json();
            setRows(data.map((p,i) => ({ ...p, id: i+1 })));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchPartners(); }, [tab]);

    // Create partner
    const handleCreate = async () => {
        if (!form.companyName || !form.email) {
            toast.warning('Tên công ty và email là bắt buộc.'); return;
        }
        try {
            const res = await fetchWithAuth(`${API_BASE}/partners`, {
                method:'POST', headers:{'Content-Type':'application/json'},
                body: JSON.stringify(form),
            });
            if (res.ok) {
                toast.success('Tạo đối tác thành công!');
                setOpenAdd(false); setForm(blankForm); fetchPartners();
            } else {
                const err = await res.json().catch(() => ({}));
                toast.error(err.error || err.title || 'Tạo thất bại.');
            }
        } catch { toast.error('Lỗi kết nối.'); }
    };

    // Approve / reject partner
    const handleSetStatus = async (partnerId, status) => {
        try {
            const res = await fetchWithAuth(`${API_BASE}/partners/${partnerId}/status`, {
                method:'PATCH', headers:{'Content-Type':'application/json'},
                body: JSON.stringify({ status }),
            });
            if (res.ok) { toast.success('Cập nhật trạng thái thành công!'); fetchPartners(); }
            else { const err = await res.json().catch(() => ({})); toast.error(err.error || 'Thất bại.'); }
        } catch { toast.error('Lỗi kết nối.'); }
    };

    // Open members dialog
    const openMembersDlg = async (partner) => {
        setSelPartner(partner);
        try {
            const [mRes, uRes] = await Promise.all([
                fetchWithAuth(`${API_BASE}/partners/${partner.partnerId}/members`),
                fetchWithAuth(`${API_BASE}/users`),
            ]);
            if (mRes.ok) setMembers(await mRes.json());
            if (uRes.ok) setUsers(await uRes.json());

            // Load branches for this partner
            const brRes = await fetchWithAuth(`${API_BASE}/branches/manage`);
            if (brRes.ok) {
                const all = await brRes.json();
                setBranches(all.filter(b => b.partnerId === partner.partnerId));
            }
        } catch (e) { console.error(e); }
        setOpenMembers(true);
    };

    // Assign member
    const handleAssign = async () => {
        if (!assignForm.userId || !assignForm.roleCode) {
            toast.warning('UserId và vai trò là bắt buộc.'); return;
        }
        try {
            const body = {
                userId:   assignForm.userId,
                roleCode: assignForm.roleCode,
            };
            if (assignForm.branchId) body.branchId = assignForm.branchId;

            const res = await fetchWithAuth(`${API_BASE}/partners/${selPartner.partnerId}/members`, {
                method:'POST', headers:{'Content-Type':'application/json'},
                body: JSON.stringify(body),
            });
            if (res.ok) {
                toast.success('Gán thành viên thành công!');
                setOpenAssign(false); setAssignForm(blankAssign);
                openMembersDlg(selPartner);
            } else {
                const err = await res.json().catch(() => ({}));
                toast.error(err.error || err.title || 'Gán thất bại.');
            }
        } catch { toast.error('Lỗi kết nối.'); }
    };

    // Remove member
    const handleRemoveMember = async (assignmentId) => {
        try {
            const res = await fetchWithAuth(
                `${API_BASE}/partners/${selPartner.partnerId}/members/${assignmentId}`,
                { method:'DELETE' }
            );
            if (res.ok) { toast.success('Đã xóa thành viên.'); openMembersDlg(selPartner); }
        } catch { toast.error('Lỗi kết nối.'); }
    };

    const partnerCols = [
        { field:'id', headerName:'STT', width:60 },
        { field:'name', headerName:'Tên đối tác', flex:1.2 },
        { field:'contactEmail', headerName:'Email', flex:1.2 },
        { field:'contactPhone', headerName:'SĐT', width:130 },
        { field:'commissionRate', headerName:'Hoa hồng', width:110,
            renderCell:({value}) => `${value}%` },
        { field:'status', headerName:'Trạng thái', width:130,
            renderCell:({value}) => <Chip label={STATUS_LABEL[value]??value} color={STATUS_COLOR[value]||'default'} size="small"/> },
        { field:'createdAt', headerName:'Ngày tạo', width:130,
            renderCell:({value}) => value ? new Date(value).toLocaleDateString('vi-VN') : '' },
        { field:'actions', headerName:'', width:210, sortable:false,
            renderCell:({row}) => (
                <Box display="flex" gap={0.5} alignItems="center" height="100%">
                    {row.status === 0 && (
                        <>
                            <Button size="small" color="success" startIcon={<CheckCircleOutlineIcon/>}
                                onClick={() => handleSetStatus(row.partnerId, 1)}>Duyệt</Button>
                            <Button size="small" color="error" startIcon={<BlockOutlinedIcon/>}
                                onClick={() => handleSetStatus(row.partnerId, 2)}>Từ chối</Button>
                        </>
                    )}
                    {row.status === 1 && (
                        <Button size="small" color="warning" startIcon={<BlockOutlinedIcon/>}
                            onClick={() => handleSetStatus(row.partnerId, 3)}>Khóa</Button>
                    )}
                    {row.status === 3 && (
                        <Button size="small" color="success" startIcon={<CheckCircleOutlineIcon/>}
                            onClick={() => handleSetStatus(row.partnerId, 1)}>Mở khóa</Button>
                    )}
                    <Button size="small" startIcon={<PeopleOutlinedIcon/>}
                        onClick={() => openMembersDlg(row)}>Thành viên</Button>
                </Box>
            ) },
    ];

    const memberCols = [
        { field:'userName', headerName:'Họ tên', flex:1 },
        { field:'email', headerName:'Email', flex:1.2 },
        { field:'roleCode', headerName:'Vai trò', width:140,
            renderCell:({value}) => <Chip label={value} size="small" color={value==='PartnerAdmin'?'success':value==='BranchManager'?'warning':'info'}/> },
        { field:'branchName', headerName:'Chi nhánh', flex:1,
            renderCell:({value}) => value || '—' },
        { field:'removeAction', headerName:'', width:80, sortable:false,
            renderCell:({row}) => (
                <Button size="small" color="error" onClick={() => handleRemoveMember(row.id)}>Xóa</Button>
            ) },
    ];

    const needBranch = ['BranchManager','Staff'].includes(assignForm.roleCode);

    return (
        <Box m="20px">
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Head title="Quản lý đối tác" subtitle="Danh sách đối tác trong hệ thống"/>
                <Button variant="contained" startIcon={<AddOutlinedIcon/>}
                    sx={{background:colors.blueAccent[700]}}
                    onClick={() => { setForm(blankForm); setOpenAdd(true); }}>
                    Tạo đối tác
                </Button>
            </Box>

            <Tabs value={tab} onChange={(_,v) => setTab(v)} sx={{mb:2}}>
                <Tab label="Tất cả"/>
                <Tab label="Chờ duyệt"/>
                <Tab label="Đang hoạt động"/>
            </Tabs>

            <Box height="65vh" sx={dgSx}>
                <DataGrid rows={rows} columns={partnerCols} loading={loading} rowHeight={52}
                    pageSizeOptions={[20,50]} initialState={{pagination:{paginationModel:{pageSize:20}}}}/>
            </Box>

            {/* Create partner dialog */}
            <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Tạo đối tác mới</DialogTitle>
                <DialogContent sx={{display:'flex',flexDirection:'column',gap:2,pt:2}}>
                    <TextField label="Tên công ty *" size="small" value={form.companyName}
                        onChange={e => setForm({...form,companyName:e.target.value})} fullWidth/>
                    <TextField label="Người liên hệ" size="small" value={form.contactName}
                        onChange={e => setForm({...form,contactName:e.target.value})} fullWidth/>
                    <TextField label="Email *" size="small" type="email" value={form.email}
                        onChange={e => setForm({...form,email:e.target.value})} fullWidth/>
                    <Box display="flex" gap={2}>
                        <TextField label="Số điện thoại" size="small" value={form.phone}
                            onChange={e => setForm({...form,phone:e.target.value})} fullWidth/>
                        <TextField label="Hoa hồng (%)" size="small" type="number" value={form.commissionRate}
                            onChange={e => setForm({...form,commissionRate:parseFloat(e.target.value)||10})} fullWidth/>
                    </Box>
                    <TextField label="Website" size="small" value={form.website}
                        onChange={e => setForm({...form,website:e.target.value})} fullWidth/>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAdd(false)}>Hủy</Button>
                    <Button variant="contained" onClick={handleCreate}>Tạo</Button>
                </DialogActions>
            </Dialog>

            {/* Members dialog */}
            <Dialog open={openMembers} onClose={() => setOpenMembers(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    Thành viên — {selPartner?.name}
                </DialogTitle>
                <DialogContent>
                    <Box display="flex" justifyContent="flex-end" mb={1}>
                        <Button variant="outlined" size="small" startIcon={<AddOutlinedIcon/>}
                            onClick={() => { setAssignForm(blankAssign); setOpenAssign(true); }}>
                            Gán thành viên
                        </Button>
                    </Box>
                    <Box height={340} sx={dgSx}>
                        <DataGrid
                            rows={members.map((m,i) => ({ ...m, id: m.id ?? i }))}
                            columns={memberCols}
                            rowHeight={48}
                            pageSizeOptions={[10]} initialState={{pagination:{paginationModel:{pageSize:10}}}}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenMembers(false)}>Đóng</Button>
                </DialogActions>
            </Dialog>

            {/* Assign member dialog */}
            <Dialog open={openAssign} onClose={() => setOpenAssign(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Gán thành viên</DialogTitle>
                <DialogContent sx={{display:'flex',flexDirection:'column',gap:2,pt:2}}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Người dùng *</InputLabel>
                        <Select value={assignForm.userId} label="Người dùng *"
                            onChange={e => setAssignForm({...assignForm,userId:e.target.value})}>
                            {users.map(u => (
                                <MenuItem key={u.userId} value={u.userId}>
                                    {u.email} {u.firstName ? `(${u.lastName} ${u.firstName})` : ''}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth size="small">
                        <InputLabel>Vai trò *</InputLabel>
                        <Select value={assignForm.roleCode} label="Vai trò *"
                            onChange={e => setAssignForm({...assignForm,roleCode:e.target.value,branchId:''})}>
                            <MenuItem value="PartnerAdmin">PartnerAdmin (Chủ sân)</MenuItem>
                            <MenuItem value="BranchManager">BranchManager (Quản lý CN)</MenuItem>
                            <MenuItem value="Staff">Staff (Nhân viên)</MenuItem>
                        </Select>
                    </FormControl>
                    {needBranch && (
                        <FormControl fullWidth size="small">
                            <InputLabel>Chi nhánh *</InputLabel>
                            <Select value={assignForm.branchId} label="Chi nhánh *"
                                onChange={e => setAssignForm({...assignForm,branchId:e.target.value})}>
                                {branches.map(b => <MenuItem key={b.branchId} value={b.branchId}>{b.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAssign(false)}>Hủy</Button>
                    <Button variant="contained" onClick={handleAssign}>Gán</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Partner;
