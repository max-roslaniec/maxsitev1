// src/components/AdminLayout.jsx
import { useState } from 'react';
import { useAuth } from "../contexts/AuthContext";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";
import adminStyles from '../admin.module.css';
import { NotificationProvider } from "../contexts/NotificationContext";

function AdminLayout() {
    const { user, accessToken } = useAuth();
    const location = useLocation();
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    if (accessToken && !user) {
        return <h1 style={{color: 'white', textAlign: 'center', marginTop: '2rem'}}>Verificando credenciais...</h1>;
    }

    if (accessToken && user && Number(user.authority) === 100) {
        return (
            <NotificationProvider>
                <div className={adminStyles.adminApp}>
                    {isSidebarOpen && <div className={adminStyles.sidebarOverlay} onClick={() => setSidebarOpen(false)}></div>}
                    <AdminSidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
                    <div className={adminStyles.mainContent}>
                        <AdminHeader onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />
                        <main className={adminStyles.contentArea}>
                            <div className={`${adminStyles.container}`}>
                                <Outlet />
                            </div>
                        </main>
                    </div>
                </div>
            </NotificationProvider>
        );
    }

    return <Navigate to="/gerenciamento/login" state={{ from: location }} replace />;
}

export default AdminLayout;