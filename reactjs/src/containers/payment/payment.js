import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from '../css/payment/payment.module.css';
import demoproduct from '../../img/category/Laptop.jpg';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import polyline from '@mapbox/polyline';
import { Context } from '../login/context';

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const Payment = () => {
  const { user } = useContext(Context);
  const location = useLocation();
  const navigate = useNavigate();
  const { product, products = [] } = location.state || {};
  const finalProducts = product ? [product] : products;

  // Lấy các biến môi trường
  const API_URL = process.env.REACT_APP_BACKEND_URL;
  const ORS_API_KEY = process.env.REACT_APP_ORS_API_KEY;

  const [formData, setFormData] = useState({
    fullname: '',
    address: '',
    phone: '',
    email: '',
    note: '',
  });
  const [addressError, setAddressError] = useState('');
  const [formError, setFormError] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [voucherError, setVoucherError] = useState('');
  const [stores, setStores] = useState([]);
  const [nearestStore, setNearestStore] = useState(null);
  const [userCoords, setUserCoords] = useState(null);
  const [routeDistance, setRouteDistance] = useState(0);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [map, setMap] = useState(null);
  const [tempCoords, setTempCoords] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user || !user.username || !user.auth) {
      navigate('/login');
    }
  }, [user, navigate]);

  const getDisplayPrice = (item) => {
    const basePrice = item.discount_price > 0 ? item.discount_price : item.price;
    return basePrice * (item.quantity || 1) * (1 - discountPercent / 100);
  };

  const getSubtotal = () => {
    return finalProducts.reduce((total, item) => total + getDisplayPrice(item), 0);
  };

  const getShippingFee = () => {
    if (routeDistance === 0) return 0;
    const decimalPart = routeDistance % 1;
    const roundedDistance = decimalPart > 0.35 ? Math.ceil(routeDistance) : Math.floor(routeDistance);
    return roundedDistance * 1000;
  };

  const getTotalPrice = () => {
    return getSubtotal() + getShippingFee();
  };

  const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

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

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!user.username) return;
      try {
        console.log('Fetching user details for:', user.username);
        const response = await axios.get(
          `${API_URL}/api/v1/detailuserbyusername/${user.username}`,
          { withCredentials: true }
        );
        console.log('API response:', response.data);
        const { errCode, detailuser } = response.data;

        if (errCode === 0 && detailuser) {
          setFormData({
            fullname: detailuser.fullname || '',
            address: detailuser.address || '',
            phone: detailuser.phone || '',
            email: detailuser.email || '',
            note: '',
          });
          setUserId(detailuser.user_id);
        } else {
          console.error('No user details found or invalid response:', response.data);
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };

    const fetchStores = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/v1/liststore`);
        const { errCode, data } = response.data;
        if (errCode === 0 && data) {
          console.log('Fetched stores:', data);
          setStores(data);
        } else {
          console.error('Invalid store data:', response.data);
        }
      } catch (error) {
        console.error('Error fetching stores:', error);
      }
    };

    fetchUserDetails();
    fetchStores();
  }, [user.username, API_URL]);

  const handleAddressConfirm = async () => {
    if (!tempCoords) {
      setAddressError('Không có tọa độ để xác nhận. Vui lòng nhập địa chỉ chi tiết hơn.');
      return;
    }

    setUserCoords(tempCoords);
    setShowConfirm(false);
    setAddressError('');

    if (!stores.length) {
      setAddressError('Không tìm thấy cửa hàng nào.');
      return;
    }

    let minDistance = Infinity;
    let closestStore = null;

    stores.forEach((store) => {
      if (!store.latitude || !store.longitude) {
        console.warn('Invalid store coordinates:', store);
        return;
      }
      const distance = haversineDistance(
        tempCoords.lat,
        tempCoords.lon,
        store.latitude,
        store.longitude
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestStore = store;
      }
    });

    if (!closestStore) {
      setAddressError('Không tìm thấy cửa hàng gần nhất.');
      return;
    }

    setNearestStore(closestStore);
    setRouteDistance(minDistance);

    try {
      const directionsUrl = 'https://api.openrouteservice.org/v2/directions/driving-car';
      const body = {
        coordinates: [
          [tempCoords.lon, tempCoords.lat],
          [closestStore.longitude, closestStore.latitude],
        ],
      };

      const response = await axios.post(directionsUrl, body, {
        headers: {
          Authorization: ORS_API_KEY,
          'Content-Type': 'application/json; charset=utf-8',
          Accept: 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
        },
      });

      if (response.data && response.data.routes && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        const distanceKm = route.summary.distance / 1000;
        const geometry = route.geometry;
        if (typeof geometry === 'string') {
          const decodedCoords = polyline.decode(geometry);
          const coords = decodedCoords.map(([lat, lng]) => [lat, lng]);
          setRouteCoordinates(coords);
          setRouteDistance(distanceKm);
          console.log('OpenRouteService distance:', distanceKm, 'km');
          console.log('Route coordinates:', coords);

          if (map) {
            const bounds = L.latLngBounds([
              [tempCoords.lat, tempCoords.lon],
              [closestStore.latitude, closestStore.longitude],
            ]);
            map.fitBounds(bounds);
          }
        } else {
          console.warn('Invalid geometry format from OpenRouteService');
          setAddressError('Dữ liệu tuyến đường không hợp lệ. Sử dụng khoảng cách ước tính.');
        }
      } else {
        console.warn('No routes found from OpenRouteService');
        setAddressError('Không tìm thấy tuyến đường. Sử dụng khoảng cách ước tính.');
      }
    } catch (error) {
      console.error('Error fetching route from OpenRouteService:', error);
      setAddressError('Không thể tính đường đi. Sử dụng khoảng cách ước tính.');
    }
  };

  const handleAddressReject = () => {
    setTempCoords(null);
    setShowConfirm(false);
    setAddressError('Vui lòng nhập lại địa chỉ chi tiết hơn.');
  };

  useEffect(() => {
    const debounceGeocode = setTimeout(async () => {
      if (formData.address && stores.length > 0) {
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
          setNearestStore(null);
          setRouteDistance(0);
          setRouteCoordinates([]);
        }
      }
    }, 1000);

    return () => clearTimeout(debounceGeocode);
  }, [formData.address, stores]);

  const applyVoucher = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/v1/applyvoucher/`, {
        voucherCode,
      });
      const { errCode, message, value } = response.data;

      if (errCode === 0) {
        setDiscountPercent(value);
        setVoucherError('');
      } else {
        setDiscountPercent(0);
        setVoucherError(message);
      }
    } catch (error) {
      setDiscountPercent(0);
      setVoucherError('Đã có lỗi xảy ra khi áp dụng voucher.');
    }
  };

  const handleFormChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (id === 'address') {
      setAddressError('');
      setRouteDistance(0);
      setUserCoords(null);
      setNearestStore(null);
      setShowConfirm(false);
      setTempCoords(null);
      setRouteCoordinates([]);
    }
  };

  const handlePaymentChange = (e) => {
    setPaymentMethod(e.target.value);
  };

  const validateAddress = (address) => {
    if (!address || address.trim().length < 10 || !address.includes(' ')) {
      return 'Địa chỉ không hợp lệ. Vui lòng nhập địa chỉ chi tiết (ví dụ: số nhà, đường, quận/huyện, tỉnh/thành).';
    }
    return '';
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setFormError('');
    setAddressError('');

    const addressValidationError = validateAddress(formData.address);
    if (addressValidationError) {
      setAddressError(addressValidationError);
      setFormError('Vui lòng kiểm tra lại thông tin trước khi đặt hàng.');
      return;
    }

    if (!formData.fullname || !formData.phone || !formData.email) {
      setFormError('Vui lòng điền đầy đủ các trường bắt buộc.');
      return;
    }

    if (!userCoords) {
      setAddressError('Vui lòng xác nhận địa chỉ giao hàng.');
      setFormError('Vui lòng kiểm tra lại thông tin trước khi đặt hàng.');
      return;
    }

    if (routeDistance === 0 && nearestStore) {
      setFormError('Đang tính toán đường đi. Vui lòng đợi một lát.');
      return;
    }

    if (!userId) {
      setFormError('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
      return;
    }

    if (finalProducts.length === 0) {
      setFormError('Không có sản phẩm nào trong đơn hàng.');
      return;
    }

    const orderData = {
      userId,
      totalPrice: getTotalPrice(),
      address: formData.address,
      phone: formData.phone,
      email: formData.email,
      note: formData.note || '',
      status: 'pending',
      paymentMethod,
      orderDetails: finalProducts.map((item) => ({
        productId: item.product_id,
        quantity: item.quantity || 1,
        price: item.price,
        discount_price: getDisplayPrice(item) / (item.quantity || 1),
      })),
    };

    try {
      setIsLoading(true);
      console.log('Gửi yêu cầu đặt hàng:', orderData);
      const response = await axios.post(`${API_URL}/api/v1/addorder`, orderData, {
        withCredentials: true,
      });

      const { errCode, message, order_url } = response.data;

      if (errCode === 0) {
        if (paymentMethod === 'zalopay' && order_url) {
          // Chuyển hướng đến ZaloPay
          window.location.href = order_url;
        } else {
          if (!product) {
            const currentCart = JSON.parse(localStorage.getItem('cart')) || [];
            const remainingCart = currentCart.filter((cartItem) =>
              !finalProducts.some(
                (p) =>
                  p.product_id === cartItem.product_id &&
                  p.storage === cartItem.storage &&
                  p.color === cartItem.color
              )
            );
            localStorage.setItem('cart', JSON.stringify(remainingCart));
          }
          toast.success('Đơn hàng đã được đặt thành công!', {
            position: 'top-right',
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
          setTimeout(() => navigate('/ordersuccess'), 3000);
        }
      } else {
        setFormError(message || 'Đặt hàng thất bại. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Lỗi khi đặt hàng:', error);
      setFormError('Đã có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const subtotal = getSubtotal();
  const shippingFee = getShippingFee();
  const totalPrice = getTotalPrice();

  return (
    <div className={`container mt-5 ${styles.detailproductContain}`}>
      <ToastContainer />
      {isLoading && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}
        >
          <div className="spinner-border text-light" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
        </div>
      )}
      <div className="row g-4">
        <h3 className={styles.title}>Thông tin thanh toán</h3>

        <div className={`col-lg-6 col-md-6 col-12 ${styles.detailproductForm}`}>
          <form onSubmit={handlePlaceOrder}>
            <div className="mb-3">
              <label htmlFor="fullname" className={styles.formLabelName}>
                Họ tên *
              </label>
              <input
                type="text"
                className="form-control"
                id="fullname"
                value={formData.fullname}
                onChange={handleFormChange}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Địa chỉ *</label>
              <input
                type="text"
                className={`form-control ${addressError ? 'is-invalid' : ''}`}
                id="address"
                value={formData.address}
                onChange={handleFormChange}
                required
              />
              {addressError && <div className="invalid-feedback">{addressError}</div>}
              {showConfirm && tempCoords && (
                <div className="mt-2">
                  <p>Xác nhận vị trí: {tempCoords.display_name} ({tempCoords.lat}, {tempCoords.lon})?</p>
                  <button
                    type="button"
                    className="btn btn-success btn-sm me-2"
                    onClick={handleAddressConfirm}
                  >
                    Xác nhận
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={handleAddressReject}
                  >
                    Hủy
                  </button>
                </div>
              )}
              {nearestStore && userCoords && routeDistance === 0 && (
                <small className="form-text text-warning">
                  Đang tính toán khoảng cách đến {nearestStore.name}...
                </small>
              )}
              {nearestStore && userCoords && routeDistance > 0 && (
                <small className="form-text text-muted">
                  Cửa hàng gần nhất: {nearestStore.name} - {nearestStore.address} (
                  {routeDistance.toFixed(2)} km)
                </small>
              )}
            </div>

            {(userCoords || tempCoords) && (
              <div className="mb-3">
                <div style={{ height: '300px', width: '100%' }}>
                  <MapContainer
                    center={tempCoords ? [tempCoords.lat, tempCoords.lon] : [userCoords.lat, userCoords.lon]}
                    zoom={14}
                    style={{ height: '100%', width: '100%' }}
                    whenCreated={(mapInstance) => {
                      console.log('Map initialized:', mapInstance);
                      setMap(mapInstance);
                    }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {(tempCoords || userCoords) && (
                      <Marker position={tempCoords ? [tempCoords.lat, tempCoords.lon] : [userCoords.lat, userCoords.lon]}>
                        <Popup>Vị trí của bạn</Popup>
                      </Marker>
                    )}
                    {nearestStore && userCoords && (
                      <Marker position={[nearestStore.latitude, nearestStore.longitude]}>
                        <Popup>
                          {nearestStore.name} - {nearestStore.address}
                        </Popup>
                      </Marker>
                    )}
                    {routeCoordinates.length > 0 && (
                      <Polyline positions={routeCoordinates} color="#218282" />
                    )}
                  </MapContainer>
                </div>
              </div>
            )}

            <div className="mb-3">
              <label className="form-label">Số điện thoại *</label>
              <input
                type="tel"
                className="form-control"
                id="phone"
                value={formData.phone}
                onChange={handleFormChange}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Địa chỉ email *</label>
              <input
                type="email"
                className="form-control"
                id="email"
                value={formData.email}
                onChange={handleFormChange}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Ghi chú đơn hàng</label>
              <textarea
                className="form-control"
                id="note"
                rows="3"
                value={formData.note}
                onChange={handleFormChange}
              ></textarea>
            </div>

            {formError && (
              <div className="alert alert-danger" role="alert">
                {formError}
              </div>
            )}
          </form>
        </div>

        <div className={`col-lg-6 col-md-6 col-12 ${styles.detailproductSummary}`}>
          <div className={`border rounded p-3 bg-light`}>
            <div className={styles.titleProduct}>
              <h5>Đơn hàng ({finalProducts.length} sản phẩm)</h5>
            </div>

            <div className={styles.detailproductContainBox}>
              {finalProducts.length > 0 ? (
                finalProducts.map((item, index) => (
                  <div
                    key={`${item.product_id}-${item.storage || ''}-${item.color || ''}`}
                    className={styles.detailproductProductItem}
                  >
                    <img
                      src={
                        item.product_img
                          ? `${API_URL}/images/products/${item.product_img}`
                          : demoproduct
                      }
                      alt={item.name}
                    />
                    <div className={styles.detailproductProductDetails}>
                      <div>{item.name}</div>
                      {item.storage && <div>Phiên bản: {item.storage}</div>}
                      {item.color && <div>Màu: {item.color}</div>}
                      <div>Số lượng: {item.quantity || 1}</div>
                      {item.discount_price ? (
                        <>
                          <div
                            className={styles.detailproductSalePrice}
                            style={{ color: 'red', fontWeight: 'bold' }}
                          >
                            {getDisplayPrice(item).toLocaleString()}₫
                          </div>
                          <div
                            className={styles.detailproductOldPrice}
                            style={{ color: '#999', textDecoration: 'line-through' }}
                          >
                            {(item.price * (item.quantity || 1)).toLocaleString()}₫
                          </div>
                        </>
                      ) : (
                        <div
                          className={styles.detailproductSalePrice}
                          style={{ color: 'red', fontWeight: 'bold' }}
                        >
                          {getDisplayPrice(item).toLocaleString()}₫
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div>Không có sản phẩm nào trong đơn hàng.</div>
              )}
            </div>

            <div className={`input-group mb-3 ${styles.detailproductInput}`}>
              <input
                type="text"
                className="form-control"
                placeholder="Nhập mã giảm giá"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
              />
              <button className={`${styles.btnBtn} btn-secondary`} onClick={applyVoucher}>
                Áp dụng
              </button>
            </div>

            {voucherError && (
              <div className="alert alert-danger" role="alert">
                {voucherError}
              </div>
            )}

            <div className={styles.detailproductPrice}>
              <p>Tạm tính: <strong>{subtotal.toLocaleString()}₫</strong></p>
              <p>
                Phí vận chuyển: <strong>{shippingFee.toLocaleString()}₫</strong>
              </p>
              <p>Tổng: <strong>{totalPrice.toLocaleString()}₫</strong></p>
            </div>

            <div className="mb-3">
              <label className="form-label">Phương thức thanh toán</label>
              <br />
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="payment"
                  id="cod"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={handlePaymentChange}
                />
                <label className="form-check-label" htmlFor="cod">
                  Trả tiền mặt khi nhận hàng
                </label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="payment"
                  id="bank"
                  value="bank"
                  checked={paymentMethod === 'bank'}
                  onChange={handlePaymentChange}
                />
                <label className="form-check-label" htmlFor="bank">
                  Chuyển khoản
                </label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="payment"
                  id="zalopay"
                  value="zalopay"
                  checked={paymentMethod === 'zalopay'}
                  onChange={handlePaymentChange}
                />
                <label className="form-check-label" htmlFor="zalopay">
                  Thanh toán qua ZaloPay
                </label>
              </div>
            </div>

            <button
              className={`${styles.btnBtn} btn w-100`}
              onClick={handlePlaceOrder}
              disabled={isLoading}
            >
              {isLoading ? (
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
              ) : null}
              {isLoading ? 'Đang xử lý...' : 'ĐẶT HÀNG'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;