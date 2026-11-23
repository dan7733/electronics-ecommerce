import React, { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from '../css/detailuser/changeinfor.module.css';
import DFavatar from '../../img/avatar/avatar.png'; // Default avatar
import { Context } from '../login/context';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Fix Leaflet icon issue (consistent with other components)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const ChangInfor = () => {
  const avatarInputRef = useRef(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    sex: '',
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [tempCoords, setTempCoords] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [addressError, setAddressError] = useState('');
  const { username } = useParams();
  const navigate = useNavigate();
  const { user, loginContext } = React.useContext(Context);

  // Lấy URL trực tiếp từ biến môi trường
  const API_URL = process.env.REACT_APP_BACKEND_URL;

  // Authentication check
  useEffect(() => {
    if (!user || !user.username || !user.auth) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Geocode address
  const geocodeAddress = async (address) => {
    if (!address || address.trim().length < 10 || !address.includes(' ')) {
      console.warn('Address too short or generic:', address);
      return null;
    }

    try {
      const query = encodeURIComponent(`${address}, Vietnam`);
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}&countrycodes=VN&limit=1`
      );
      if (response.data.length > 0) {
        const { lat, lon, display_name } = response.data[0];
        console.log('Geocoded address:', address, { lat, lon, display_name });
        return { lat: parseFloat(lat), lon: parseFloat(lon), display_name };
      }
      console.warn('No geocoding results for:', address);
      return null;
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  };

  // Fetch user data from API
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        console.log('Fetching user data for username:', username);
        console.log('JWT Token:', localStorage.getItem('jwt'));
        // Sử dụng API_URL thay cho localhost
        const response = await axios.get(
          `${API_URL}/api/v1/detailuserbyusername/${username}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('jwt')}`,
            },
            withCredentials: true,
          }
        );

        console.log('API Response:', response.data);

        if (response.data.errCode === 0) {
          const data = response.data.detailuser;
          let formattedDate = '';
          if (data.dateOfBirth && data.dateOfBirth !== '0000-00-00') {
            const parsedDate = new Date(data.dateOfBirth);
            if (!isNaN(parsedDate)) {
              formattedDate = parsedDate;
            }
          }
          setUserData(data);
          setFormData({
            fullname: data.fullname || '',
            email: data.email || '',
            phone: data.phone || '',
            dateOfBirth: formattedDate || '',
            address: data.address || '',
            sex: data.sex || '',
          });
          // Cập nhật đường dẫn ảnh đại diện bằng API_URL
          setAvatarPreview(
            data.avatar
              ? `${API_URL}/images/useravatar/${data.avatar}`
              : DFavatar
          );
          setError(null);
          
          if (data.address && data.address.trim()) {
            const coords = await geocodeAddress(data.address);
            if (coords) {
              setUserCoords(coords);
            }
          }
        } else {
          setError(response.data.message || 'Không thể tải thông tin người dùng.');
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          navigate('/login');
        } else {
          const errorMessage =
            err.response?.data?.message ||
            err.message ||
            'Đã xảy ra lỗi khi tải thông tin. Vui lòng thử lại.';
          setError(errorMessage);
        }
      }
    };

    if (username && user?.auth) {
      fetchUserData();
    }
  }, [username, navigate, user, API_URL]);

  // Debounce address geocoding
  useEffect(() => {
    const debounceGeocode = setTimeout(async () => {
      if (formData.address) {
        const coords = await geocodeAddress(formData.address);
        if (coords) {
          setTempCoords(coords);
          setShowConfirm(true);
          setAddressError('');
        } else {
          setAddressError(
            'Không thể xác định tọa độ. Vui lòng nhập địa chỉ chi tiết hơn (ví dụ: số nhà, đường, quận/huyện, tỉnh/thành).'
          );
          setTempCoords(null);
          setUserCoords(null);
        }
      } else {
        setUserCoords(null);
        setTempCoords(null);
        setShowConfirm(false);
        setAddressError('');
      }
    }, 1000);

    return () => clearTimeout(debounceGeocode);
  }, [formData.address]);

  // Handle avatar change
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setAvatarPreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'address') {
      setAddressError('');
      setShowConfirm(false);
      setTempCoords(null);
    }
  };

  // Handle date change for DatePicker
  const handleDateChange = (date) => {
    setFormData((prev) => ({ ...prev, dateOfBirth: date }));
  };

  // Handle address confirmation
  const handleAddressConfirm = () => {
    if (!tempCoords) {
      setAddressError('Không có tọa độ để xác nhận. Vui lòng nhập địa chỉ chi tiết hơn.');
      return;
    }
    setUserCoords(tempCoords);
    setShowConfirm(false);
    setAddressError('');
  };

  // Handle address rejection
  const handleAddressReject = () => {
    setTempCoords(null);
    setShowConfirm(false);
    setAddressError('Vui lòng nhập lại địa chỉ chi tiết hơn.');
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    // Validation
    if (!formData.email.includes('@')) {
      setError('Vui lòng nhập email hợp lệ.');
      setIsLoading(false);
      return;
    }
    if (formData.phone && !/^\d{10,11}$/.test(formData.phone)) {
      setError('Số điện thoại phải có 10-11 chữ số.');
      setIsLoading(false);
      return;
    }
    if (!formData.fullname.trim()) {
      setError('Họ và tên không được để trống.');
      setIsLoading(false);
      return;
    }
    if (!formData.sex) {
      setError('Vui lòng chọn giới tính.');
      setIsLoading(false);
      return;
    }
    if (formData.address && !userCoords) {
      setError('Vui lòng xác nhận địa chỉ hợp lệ trước khi cập nhật.');
      setAddressError('Địa chỉ chưa được xác nhận. Vui lòng kiểm tra và xác nhận lại.');
      setIsLoading(false);
      return;
    }

    // Age validation
    if (formData.dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(formData.dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age <= 16) {
        setError('Tuổi phải lớn hơn 16 để cập nhật thông tin.');
        setIsLoading(false);
        return;
      }
    }

    const formDataToSend = new FormData();
    formDataToSend.append('username', username);
    formDataToSend.append('fullname', formData.fullname);
    formDataToSend.append('email', formData.email);
    formDataToSend.append('phone', formData.phone);
    formDataToSend.append('dateOfBirth', formData.dateOfBirth ? formData.dateOfBirth.toISOString().split('T')[0] : '');
    formDataToSend.append('address', formData.address);
    formDataToSend.append('sex', formData.sex);
    if (avatarInputRef.current?.files[0]) {
      formDataToSend.append('avatar', avatarInputRef.current.files[0]);
    }

    try {
      // Sử dụng API_URL cho API cập nhật người dùng
      const response = await axios.patch(
        `${API_URL}/api/v1/updateuser`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('jwt')}`,
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true,
        }
      );

      if (response.data.errCode === 0) {
        setSuccess('Cập nhật thông tin thành công!');
        const updatedUser = response.data.detailuser;
        setUserData(updatedUser);
        setAvatarPreview(
          updatedUser.avatar
            ? `${API_URL}/images/useravatar/${updatedUser.avatar}`
            : DFavatar
        );

        loginContext(
          {
            username: updatedUser.username,
            fullname: updatedUser.fullname,
            avatar: updatedUser.avatar,
            email: updatedUser.email,
            phone: updatedUser.phone,
            address: updatedUser.address,
            sex: updatedUser.sex,
            dateOfBirth: updatedUser.dateOfBirth,
            auth: true,
          },
          localStorage.getItem('user')
        );
      } else {
        setError(response.data.message || 'Cập nhật thất bại.');
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate('/login');
      } else {
        setError(
          err.response?.data?.message ||
            'Đã xảy ra lỗi khi cập nhật. Vui lòng thử lại.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  if (error) {
    return (
      <div className={styles.error}>
        {error}
        <button
          className={styles.retryButton}
          onClick={() => window.location.reload()}
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (!userData) {
    return <div className={styles.loading}>Đang tải...</div>;
  }

  return (
    <div className={styles.formBox}>
      <h5>Cập nhật thông tin cá nhân</h5>
      {success && <div className={styles.success}>{success}</div>}
      <form onSubmit={handleSubmit}>
        <div className={styles.avatarSection}>
          <div className={styles.avatarWrapper}>
            <img
              src={avatarPreview}
              className={styles.avatarImage}
              alt="Avatar"
            />
            <input
              type="file"
              ref={avatarInputRef}
              onChange={handleAvatarChange}
              accept=".jpg,.jpeg,.png"
              hidden
            />
            <button
              type="button"
              className={styles.avatarButton}
              onClick={() => avatarInputRef.current.click()}
            >
              Chọn Ảnh
            </button>
          </div>
        </div>

        <div className={styles.userInfo}>
          <div className={styles.infoItem}>
            <label className={styles.infoLabel}>Tên đăng nhập</label>
            <p className={styles.infoValue}>{userData.username || 'N/A'}</p>
          </div>
          <div className={styles.infoItem}>
            <label className={styles.infoLabel}>Họ và tên</label>
            <input
              type="text"
              name="fullname"
              value={formData.fullname}
              onChange={handleInputChange}
              className={styles.infoInput}
              placeholder="Nhập họ và tên"
              required
            />
          </div>
          <div className={styles.infoItem}>
            <label className={styles.infoLabel}>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={styles.infoInput}
              placeholder="Nhập email"
              required
            />
          </div>
          <div className={styles.infoItem}>
            <label className={styles.infoLabel}>Số điện thoại</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className={styles.infoInput}
              placeholder="Nhập số điện thoại"
            />
          </div>
          <div className={styles.infoItem}>
            <label className={styles.infoLabel}>Ngày sinh</label>
            <DatePicker
              selected={formData.dateOfBirth ? new Date(formData.dateOfBirth) : null}
              onChange={handleDateChange}
              className={styles.datePickerInput}
              placeholderText="Chọn ngày sinh"
              dateFormat="dd/MM/yyyy"
              showYearDropdown
              scrollableYearDropdown
              yearDropdownItemNumber={100}
              maxDate={new Date()} 
              wrapperClassName={styles.datePickerWrapper}
            />
          </div>
          <div className={styles.infoItem}>
            <label className={styles.infoLabel}>Giới tính</label>
            <select
              name="sex"
              value={formData.sex}
              onChange={handleInputChange}
              className={styles.infoInput}
              required
            >
              <option value="">Chọn giới tính</option>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
            </select>
          </div>
          <div className={styles.infoItem}>
            <label className={styles.infoLabel}>Địa chỉ</label>
            <div className={styles.addressContainer}>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className={`${styles.infoInput} ${addressError ? styles.inputError : ''}`}
                placeholder="Nhập địa chỉ"
              />
              {addressError && (
                <div className={styles.addressError}>{addressError}</div>
              )}
              {showConfirm && tempCoords && (
                <div className={styles.confirmSection}>
                  <p>
                    Xác nhận vị trí: {tempCoords.display_name} (
                    {tempCoords.lat.toFixed(4)}, {tempCoords.lon.toFixed(4)})
                  </p>
                  <div className={styles.confirmButtons}>
                    <button
                      type="button"
                      className={styles.confirmButton}
                      onClick={handleAddressConfirm}
                    >
                      Xác nhận
                    </button>
                    <button
                      type="button"
                      className={styles.rejectButton}
                      onClick={handleAddressReject}
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          {(userCoords || tempCoords) && (
            <div className={styles.mapSection}>
              <h6 className={styles.mapTitle}>Vị trí của bạn</h6>
              <div className={styles.mapContainer}>
                <MapContainer
                  center={
                    tempCoords
                      ? [tempCoords.lat, tempCoords.lon]
                      : [userCoords.lat, userCoords.lon]
                  }
                  zoom={14}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  {(tempCoords || userCoords) && (
                    <Marker
                      position={
                        tempCoords
                          ? [tempCoords.lat, tempCoords.lon]
                          : [userCoords.lat, userCoords.lon]
                      }
                    >
                      <Popup>
                        {tempCoords
                          ? tempCoords.display_name
                          : userCoords.display_name}
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>
            </div>
          )}
          <div className={styles.submitSection}>
            <button
              type="submit"
              className={styles.submitButton}
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
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChangInfor;