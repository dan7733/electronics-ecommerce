import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import styles from '../css/detailuser/changepassword.module.css';
import { useParams, useNavigate } from 'react-router-dom';
import { Context } from '../login/context';

const ChangePassword = () => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isGoogleUser, setIsGoogleUser] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { username } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(Context);

    // Lấy URL trực tiếp từ biến môi trường .env
    const API_URL = process.env.REACT_APP_BACKEND_URL;

    // Authentication check
    useEffect(() => {
        if (!user || !user.username || !user.auth) {
            navigate('/login');
        }
    }, [user, navigate]);

    // Fetch user data to check if they are a Google user
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // Thay thế localhost bằng API_URL
                const response = await axios.get(
                    `${API_URL}/api/v1/detailuserbyusername/${username}`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('jwt')}`,
                        },
                        withCredentials: true,
                    }
                );

                if (response.data.errCode === 0) {
                    const userData = response.data.detailuser;
                    if (userData.provider === 'google' || userData.password === 'google-auth') {
                        setIsGoogleUser(true);
                    }
                } else {
                    setError(response.data.message || 'Không thể tải thông tin người dùng.');
                }
            } catch (err) {
                if (err.response?.status === 401 || err.response?.status === 403) {
                    navigate('/login');
                } else {
                    setError(err.response?.data?.message || 'Đã xảy ra lỗi khi tải thông tin. Vui lòng thử lại.');
                }
            }
        };

        if (username && user?.auth) {
            fetchUserData();
        }
    }, [username, navigate, user, API_URL]); // Thêm API_URL vào dependencies

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        // Validate inputs
        if (!newPassword || !confirmPassword) {
            setError('Vui lòng nhập mật khẩu mới và xác nhận mật khẩu.');
            setIsLoading(false);
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Mật khẩu mới và xác nhận mật khẩu không khớp.');
            setIsLoading(false);
            return;
        }

        if (newPassword.length < 6) {
            setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
            setIsLoading(false);
            return;
        }

        if (!isGoogleUser && !oldPassword) {
            setError('Vui lòng nhập mật khẩu cũ.');
            setIsLoading(false);
            return;
        }

        try {
            // Thay thế localhost bằng API_URL
            const response = await axios.post(
                `${API_URL}/api/v1/change-password`,
                {
                    oldPassword: isGoogleUser ? undefined : oldPassword,
                    newPassword,
                    confirmPassword,
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('jwt')}`,
                    },
                    withCredentials: true,
                }
            );

            console.log('API Response:', response.data); // Debugging

            if (response.data.errCode === 0) {
                setSuccess(response.data.message);
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');

                console.log('Password change successful, redirecting...'); // Debugging
                // Chuyển hướng sau khi đổi mật khẩu thành công
                setTimeout(() => {
                    console.log(`Executing redirect to /account/${username}`); // Debugging
                    navigate(`/account/${username}`, { replace: true });
                }, 2000);
            } else {
                setError(response.data.message || 'Đổi mật khẩu thất bại.');
            }
        } catch (err) {
            console.error('Error during password change:', err); // Debugging
            if (err.response?.status === 401 || err.response?.status === 403) {
                navigate('/login');
            } else {
                setError(err.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Clear success message after 3 seconds
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    // Loading or error state
    if (error) {
        return <div className={styles.error}>{error}</div>;
    }

    return (
        <div className={styles.formBox}>
            <h5>Đổi mật khẩu</h5>
            {error && <div className={styles.error}>{error}</div>}
            {success && <div className={styles.success}>{success}</div>}
            <form onSubmit={handleSubmit}>
                {!isGoogleUser && (
                    <div className={styles.infoItem}>
                        <label className={styles.infoLabel}>Mật khẩu hiện tại</label>
                        <input
                            type="password"
                            className={styles.infoValue}
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>
                )}
                <div className={styles.infoItem}>
                    <label className={styles.infoLabel}>Mật khẩu mới</label>
                    <input
                        type="password"
                        className={styles.infoValue}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                </div>
                <div className={styles.infoItem}>
                    <label className={styles.infoLabel}>Xác nhận mật khẩu mới</label>
                    <input
                        type="password"
                        className={styles.infoValue}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                </div>
                <button
                    type="submit"
                    className={styles.avatarButton}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <span
                                className="spinner-border spinner-border-sm me-2"
                                role="status"
                                aria-hidden="true"
                            ></span>
                            Đang cập nhật...
                        </>
                    ) : (
                        'Cập nhật'
                    )}
                </button>
            </form>
        </div>
    );
};

export default ChangePassword;