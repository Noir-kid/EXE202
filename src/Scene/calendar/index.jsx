import React, { useState, useEffect } from "react";
import {
    Box, Button, Dialog, DialogActions, DialogContent,
    DialogTitle, MenuItem, Select, Typography,
} from "@mui/material";
import Head from "../../Components/Head";
import './BadmintonCourtHours.css';
import { toast } from "react-toastify";
import { jwtDecode } from 'jwt-decode';
import { fetchWithAuth } from "../../Components/fetchWithAuth/fetchWithAuth";
import { API_BASE } from '../../config';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';

const BadmintonCourtHours = () => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [workingHours, setWorkingHours] = useState({ start:'', end:'' });
    const [start, setStart] = useState('');
    const [end, setEnd]     = useState('');
    const [branch, setBranch] = useState(null);

    const token   = sessionStorage.getItem('token');
    const decoded = token ? jwtDecode(token) : {};
    const myBranchId = decoded.branchId || null;

    const fetchBranch = async () => {
        if (!myBranchId) return;
        try {
            const res = await fetchWithAuth(`${API_BASE}/branches/${myBranchId}`);
            if (!res.ok) return;
            const data = await res.json();
            setBranch(data);
            setWorkingHours({
                start: data.openTime  ? data.openTime.substring(0,5)  : '',
                end:   data.closeTime ? data.closeTime.substring(0,5) : '',
            });
        } catch (e) { console.error(e); }
    };

    useEffect(() => { fetchBranch(); }, [myBranchId]);

    const handleEditClick = () => {
        setStart(workingHours.start);
        setEnd(workingHours.end);
        setDialogOpen(true);
    };

    const handleCancel = () => { setDialogOpen(false); };

    const handleSave = async () => {
        if (!branch) return;
        try {
            const body = {
                name:      branch.name,
                address:   branch.address,
                phone:     branch.phone,
                status:    branch.status || 'Active',
                openTime:  start || null,
                closeTime: end   || null,
            };
            const res = await fetchWithAuth(`${API_BASE}/branches/${myBranchId}`, {
                method:'PUT', headers:{'Content-Type':'application/json'},
                body: JSON.stringify(body),
            });
            if (res.ok) {
                toast.success('Đã cập nhật giờ làm việc!');
                setWorkingHours({ start, end });
                setDialogOpen(false);
                fetchBranch();
            } else {
                toast.error('Cập nhật thất bại.');
            }
        } catch (e) { toast.error(`Lỗi: ${e.message}`); }
    };

    const generateHourOptions = () =>
        Array.from({ length: 24 }, (_, i) => {
            const h = i.toString().padStart(2,'0') + ':00';
            return <MenuItem key={i} value={h} style={{textAlign:'center'}}>{h}</MenuItem>;
        });

    return (
        <Box m="20px">
            <Head title="Giờ hoạt động" subtitle="Chỉnh sửa giờ mở cửa của chi nhánh"/>
            <Box className="timeslotwork-root">
                <Typography variant="h5" className="timeslotwork-heading">
                    <ScheduleOutlinedIcon sx={{ fontSize: 22, mr: 1, verticalAlign: 'middle', color: '#3b82f6' }} />
                    Khung giờ hoạt động
                </Typography>
                <Typography variant="body2" className="timeslotwork-caption">
                    {branch?.name ? `Chi nhánh: ${branch.name}` : 'Thời gian sân mở cửa đón khách trong ngày'}
                </Typography>

                {workingHours.start && workingHours.end ? (
                    <Box className="timeslotwork-hoursCard">
                        <Box className="timeslotwork-hoursBlock">
                            <span className="timeslotwork-hoursLabel">Mở cửa</span>
                            <Typography variant="h4" className="timeslotwork-hoursValue">{workingHours.start}</Typography>
                        </Box>
                        <span className="timeslotwork-hoursDivider">→</span>
                        <Box className="timeslotwork-hoursBlock">
                            <span className="timeslotwork-hoursLabel">Đóng cửa</span>
                            <Typography variant="h4" className="timeslotwork-hoursValue">{workingHours.end}</Typography>
                        </Box>
                    </Box>
                ) : (
                    <Typography variant="body1" className="timeslotwork-emptyText">Chưa thiết lập giờ hoạt động.</Typography>
                )}

                <Button variant="contained" startIcon={<EditOutlinedIcon/>} onClick={handleEditClick}
                    className="timeslotwork-editButton" disabled={!myBranchId}>
                    Chỉnh sửa giờ
                </Button>

                <Dialog open={dialogOpen} onClose={handleCancel} maxWidth="xs" fullWidth>
                    <DialogTitle>Chỉnh sửa giờ hoạt động</DialogTitle>
                    <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                        <Box>
                            <Typography variant="body2" color="text.secondary" mb={1}>Giờ mở cửa</Typography>
                            <Select fullWidth size="small" value={start} onChange={e => setStart(e.target.value)}>
                                {generateHourOptions()}
                            </Select>
                        </Box>
                        <Box>
                            <Typography variant="body2" color="text.secondary" mb={1}>Giờ đóng cửa</Typography>
                            <Select fullWidth size="small" value={end} onChange={e => setEnd(e.target.value)}>
                                {generateHourOptions()}
                            </Select>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCancel}>Hủy</Button>
                        <Button variant="contained" onClick={handleSave}>Lưu</Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Box>
    );
};

export default BadmintonCourtHours;
