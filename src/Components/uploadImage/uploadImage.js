import { API_BASE } from '../../config';

export const uploadImage = async (file, folder = 'general') => {
    const token = sessionStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/upload/image?folder=${encodeURIComponent(folder)}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Tải ảnh lên thất bại.');
    }
    const data = await res.json();
    return data.url;
};
