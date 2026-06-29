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
            <Head title="GIỜ HOẠT ĐỘNG" subtitle="Chỉnh sửa giờ mở cửa của chi nhánh"/>
            <Box className="timeslotwork-root">
                <Typography variant="h5" className="timeslotwork-heading">Giờ hoạt động</Typography>
                {workingHours.start && workingHours.end ? (
                    <Typography variant="h6" className="timeslotwork-hoursText">
                        {`Mở: ${workingHours.start} — Đóng: ${workingHours.end}`}
                    </Typography>
                ) : (
                    <Typography variant="h6" className="timeslotwork-hoursText">Chưa thiết lập</Typography>
                )}
                <Button variant="contained" color="primary" onClick={handleEditClick}
                    className="timeslotwork-editButton" disabled={!myBranchId}>
                    Chỉnh sửa giờ
                </Button>

                <Dialog open={dialogOpen} onClose={handleCancel}>
                    <DialogTitle style={{color:'black'}}>Chỉnh sửa giờ hoạt động</DialogTitle>
                    <DialogContent className="timeslotwork-dialogContent">
                        <Typography style={{color:'black',marginBottom:8}}>Giờ mở cửa</Typography>
                        <Select fullWidth value={start} onChange={e => setStart(e.target.value)}
                            style={{color:'black',marginBottom:16}}>
                            {generateHourOptions()}
                        </Select>
                        <Typography style={{color:'black',marginBottom:8}}>Giờ đóng cửa</Typography>
                        <Select fullWidth value={end} onChange={e => setEnd(e.target.value)}
                            style={{color:'black'}}>
                            {generateHourOptions()}
                        </Select>
                    </DialogContent>
                    <DialogActions className="timeslotwork-dialogActions">
                        <Button onClick={handleCancel} color="primary">Hủy</Button>
                        <Button onClick={handleSave} color="primary">Lưu</Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Box>
    );
};

export default BadmintonCourtHours;
