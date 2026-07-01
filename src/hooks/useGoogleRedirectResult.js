import { useEffect, useState } from 'react';
import { getRedirectResult, GoogleAuthProvider } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { auth } from '../Components/googleSignin/config';
import { API_BASE } from '../config';

const roleToPath = {
    SuperAdmin:    '/admin',
    PartnerAdmin:  '/owner',
    BranchManager: '/owner',
    Staff:         '/staff',
    Customer:      '/home',
};

/**
 * Hook chạy 1 lần khi app load để xử lý kết quả Google redirect.
 * Đặt ở App-level component hoặc bất kỳ đâu render sớm nhất.
 */
const useGoogleRedirectResult = () => {
    const [processing, setProcessing] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        let cancelled = false;

        const handle = async () => {
            try {
                const result = await getRedirectResult(auth);

                // Không có redirect result (user load trang bình thường, không phải từ Google redirect)
                if (!result) {
                    setProcessing(false);
                    return;
                }

                const credential = GoogleAuthProvider.credentialFromResult(result);
                const idToken = credential?.idToken;

                if (!idToken) {
                    toast.error('Không lấy được Google token. Vui lòng thử lại.');
                    setProcessing(false);
                    return;
                }

                const res = await fetch(`${API_BASE}/auth/google`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idToken }),
                });

                if (cancelled) return;

                if (res.ok) {
                    const data = await res.json();
                    sessionStorage.setItem('token', data.accessToken);
                    sessionStorage.setItem('user', JSON.stringify(data.user));
                    const path = roleToPath[data.user?.role] || '/home';
                    navigate(path, { replace: true });
                    setTimeout(() => toast.success('Đăng nhập Google thành công!'), 100);
                } else {
                    const err = await res.json().catch(() => ({}));
                    toast.error(err.detail || err.message || err.title || 'Đăng nhập Google thất bại.');
                }
            } catch (err) {
                if (cancelled) return;
                // User đóng tab/quay lại trước khi hoàn thành — bỏ qua
                if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
                    // noop
                } else {
                    console.error('Google redirect error:', err);
                    toast.error('Lỗi đăng nhập Google: ' + err.message);
                }
            } finally {
                if (!cancelled) setProcessing(false);
            }
        };

        handle();

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { processing };
};

export default useGoogleRedirectResult;
