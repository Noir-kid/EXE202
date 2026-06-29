import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Scene/global/Sidebar';
import Topbar from '../Scene/global/Topbar';
import { ColorModeContext, useMode } from '../theme';
import { CssBaseline, ThemeProvider } from '@mui/material';
import '../Scene/global/sidebar.css';

const AdminLayout = () => {
    const [theme, colorMode] = useMode();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <ColorModeContext.Provider value={colorMode}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <div style={{ display: 'flex', minHeight: '100vh' }}>
                    <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
                    <div
                        className={`sg-admin-content${collapsed ? ' collapsed' : ''}`}
                        style={{
                            marginLeft: collapsed ? 72 : 260,
                            transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)',
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            minHeight: '100vh',
                            background: theme.palette.mode === 'dark' ? '#141b2d' : '#f8fafc',
                        }}
                    >
                        <Topbar />
                        <div style={{ flex: 1, padding: '0' }}>
                            <Outlet />
                        </div>
                    </div>
                </div>
            </ThemeProvider>
        </ColorModeContext.Provider>
    );
};

export default AdminLayout;
