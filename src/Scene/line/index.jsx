import React, { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import Head from "../../Components/Head";
import LineChart from "../../Components/LineChart";
import { fetchWithAuth } from "../../Components/fetchWithAuth/fetchWithAuth";
import { API_BASE } from '../../config';

const Line = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const currentYear = new Date().getFullYear();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await fetchWithAuth(`${API_BASE}/dashboard`);
                if (!res.ok) return;
                const result = await res.json();
                // Build chart-compatible array from dashboard revenue data
                const points = Array.isArray(result.revenueByMonth)
                    ? result.revenueByMonth
                    : [];
                setData(points);
            } catch (e) {
                console.error("Error fetching chart data", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [currentYear]);

    return (
        <Box m="20px">
            <Head title="Biểu đồ doanh thu" subtitle={`Năm ${currentYear}`}/>
            <Box height="75vh">
                {loading ? (
                    <Typography mt={4} color="text.secondary">Đang tải dữ liệu...</Typography>
                ) : data.length === 0 ? (
                    <Typography mt={4} color="text.secondary">Chưa có dữ liệu biểu đồ.</Typography>
                ) : (
                    <LineChart data={data}/>
                )}
            </Box>
        </Box>
    );
};

export default Line;
