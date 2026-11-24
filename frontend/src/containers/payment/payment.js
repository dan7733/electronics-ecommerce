import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from '../css/payment/payment.module.css';
import demoproduct from '../../img/category/Laptop.jpg';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Context } from '../login/context';

// Fix Marker Icon Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Component hỗ trợ fitBounds bản đồ Leaflet chuẩn React-Leaflet
const MapController = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds && map) {
      map.fitBounds(bounds);
    }
  }, [bounds, map]);
  return null;
};

const Payment = () => {
  const { user } = useContext(Context);
  const location = useLocation();
  const navigate = useNavigate();
  const { product, products = [] } = location.state || {};
  const finalProducts = product ? [product] : products;

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
  const [tempCoords, setTempCoords] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mapBounds, setMapBounds] = useState(null);

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
      return null;
    }

    try {
      const query = encodeURIComponent(`${address}, Vietnam`);
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}&countrycodes=VN&limit=1`
      );
      if (response.data.length > 0) {
        const { lat, lon, display_name } = response.data[0];
        return { lat: parseFloat(lat), lon: parseFloat(lon), display_name };
      }
      return null;
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  };

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!user?.username) return;
      try {
        // Tự động sử dụng Axios Interceptor toàn cục + Cookie
        const response = await axios.get(
          `${API_URL}/api/v1/detailuserbyusername/${user.username}`,
          { withCredentials: true }
        );
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
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          navigate('/login');
        }
      }
    };

    const fetchStores = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/v1/liststore`, { withCredentials: true });
        const { errCode, data } = response.data;
        if (errCode === 0 && data) {
          setStores(data);
        }
      } catch (error) {
        console.error('Error fetching stores:', error);
      }
    };

    if (user?.auth) {
      fetchUserDetails();
      fetchStores();
    }
  }, [user, API_URL, navigate]);

  const handleAddressConfirm = async () => {
    if (!tempCoords) {
      setAddressError('Không có tọa độ để xác nhận. Vui lòng nhập địa chỉ chi tiết hơn.');
      return;
    }

    setUserCoords(tempCoords);
    setShowConfirm(false);
    setAddressError('');

    if (!stores.length) {
      setAddressError('Không tìm thấy hệ thống cửa hàng.');
      return;
    }

    let minDistance = Infinity;
    let closestStore = null;

    stores.forEach((store) => {
      if (!store.latitude || !store.longitude) return;
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
      if (!ORS_API_KEY) {
        setAddressError('Hệ thống đang gặp sự cố khi tính khoảng cách. Đang sử dụng khoảng cách ước tính.');
        return;
      }

      const response = await axios.get('https://api.openrouteservice.org/v2/directions/driving-car', {
        params: {
          api_key: ORS_API_KEY,
          start: `${tempCoords.lon},${tempCoords.lat}`,
          end: `${closestStore.longitude},${closestStore.latitude}`,
          radiuses: '-1|-1'
        }
      });

      if (response.data && response.data.features && response.data.features.length > 0) {
        const routeFeature = response.data.features[0];
        const coordinates = routeFeature.geometry.coordinates;
        const coords = coordinates.map(([lng, lat]) => [lat, lng]); 
        const summary = routeFeature.properties.summary;
        const distanceKm = summary.distance / 1000;

        setRouteCoordinates(coords);
        setRouteDistance(distanceKm);

        setMapBounds(L.latLngBounds([
          [tempCoords.lat, tempCoords.lon],
          [closestStore.latitude, closestStore.longitude],
        ]));
      } else {
        setAddressError('Không thể tìm thấy tuyến đường tối ưu. Đang sử dụng khoảng cách ước tính.');
      }
    } catch (error) {
      console.error('Lỗi OpenRouteService:', error);
      const serverMessage = error.response?.data?.error?.message || '';
      if (serverMessage.includes('Could not find routable point')) {
         setAddressError('Vị trí được chọn nằm xa trục đường chính. Đang áp dụng khoảng cách ước tính.');
      } else {
         setAddressError('Hệ thống tính phí tự động đang bảo trì. Đang áp dụng khoảng cách ước tính.');
      }
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
            'Không thể xác định tọa độ. Vui lòng nhập địa chỉ chi tiết hơn.'
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
    if (!voucherCode.trim()) return;
    try {
      const response = await axios.post(
        `${API_URL}/api/v1/applyvoucher/`,
        { voucherCode },
        { withCredentials: true }
      );
      const { errCode, message, value } = response.data;

      if (errCode === 0) {
        setDiscountPercent(value);
        setVoucherError('');
      } else {
        setDiscountPercent(0);
        setVoucherError(message || 'Voucher không hợp lệ.');
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
      return 'Địa chỉ không hợp lệ. Vui lòng nhập địa chỉ chi tiết.';
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
      const response = await axios.post(`${API_URL}/api/v1/addorder`, orderData, {
        withCredentials: true,
      });

      const { errCode, message, order_url } = response.data;

      if (errCode === 0) {
        if (paymentMethod === 'zalopay' && order_url) {
          window.location.href = order_url;
        } else {
          if (!product) {
            try {
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
            } catch (cartErr) {
              console.error('Lỗi cập nhật giỏ hàng:', cartErr);
            }
          }
          toast.success('Đơn hàng đã được đặt thành công!', {
            position: 'top-right',
            autoClose: 3000,
          });
          setTimeout(() => navigate('/ordersuccess'), 3000);
        }
      } else {
        setFormError(message || 'Đặt hàng thất bại. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Lỗi khi đặt hàng:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/login');
      } else {
        setFormError('Đã có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const subtotal = getSubtotal();
  const shippingFee = getShippingFee();
  const totalPrice = getTotalPrice();

  return (
    <div className={`container py-4 ${styles.detailproductContain}`}>
      <ToastContainer />
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingBox}>
            <div className={styles.spinner}></div>
            <p className={styles.loadingText}>Đang xử lý đơn hàng...</p>
          </div>
        </div>
      )}
      <div className="row g-4">
        <h3 className={styles.title}>
          <i className="fas fa-credit-card me-2"></i>Thông tin thanh toán
        </h3>

        {/* Cột trái: Form thông tin người nhận & Địa chỉ */}
        <div className={`col-lg-6 col-md-6 col-12 ${styles.detailproductForm}`}>
          <form onSubmit={handlePlaceOrder}>
            <div className="mb-3">
              <label htmlFor="fullname" className={styles.formLabelName}>
                Họ và tên người nhận *
              </label>
              <input
                type="text"
                className="form-control"
                id="fullname"
                placeholder="Nhập họ và tên..."
                value={formData.fullname}
                onChange={handleFormChange}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Địa chỉ giao hàng *</label>
              <input
                type="text"
                className={`form-control ${addressError ? 'is-invalid' : ''}`}
                id="address"
                placeholder="Nhập địa chỉ chi tiết (số nhà, tên đường, phường/xã...)"
                value={formData.address}
                onChange={handleFormChange}
                required
              />
              {addressError && <div className="invalid-feedback">{addressError}</div>}
              
              {showConfirm && tempCoords && (
                <div className={styles.addressConfirmCard}>
                  <div className={styles.confirmHeader}>
                    <i className={`fas fa-map-marker-alt ${styles.confirmIcon}`}></i>
                    <div className={styles.confirmTextContent}>
                      <span className={styles.confirmTitle}>Xác nhận địa chỉ định vị:</span>
                      <p className={styles.confirmAddress}>{tempCoords.display_name}</p>
                    </div>
                  </div>
                  
                  <div className={styles.confirmBtnGroup}>
                    <button
                      type="button"
                      className={styles.btnConfirmPrimary}
                      onClick={handleAddressConfirm}
                    >
                      <i className="fas fa-check me-2"></i>Xác nhận vị trí này
                    </button>

                    <button
                      type="button"
                      className={styles.btnConfirmSecondary}
                      onClick={handleAddressReject}
                    >
                      <i className="fas fa-undo me-2"></i>Nhập lại
                    </button>
                  </div>
                </div>
              )}

              {nearestStore && userCoords && routeDistance === 0 && (
                <small className="form-text text-warning mt-1 d-block">
                  <i className="fas fa-sync fa-spin me-1"></i>Đang tính toán khoảng cách đến cửa hàng...
                </small>
              )}
              {nearestStore && userCoords && routeDistance > 0 && (
                <small className={styles.storeBadgeInfo}>
                  <i className="fas fa-store me-1"></i>Cửa hàng giao: <strong>{nearestStore.name}</strong> - {nearestStore.address} (<strong>{routeDistance.toFixed(2)} km</strong>)
                </small>
              )}
            </div>

            {(userCoords || tempCoords) && (
              <div className="mb-3">
                <div className={styles.mapWrapper}>
                  <MapContainer
                    center={tempCoords ? [tempCoords.lat, tempCoords.lon] : [userCoords.lat, userCoords.lon]}
                    zoom={14}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                      attribution='© <a href="https://maps.google.com/">Google Maps</a>'
                    />
                    {mapBounds && <MapController bounds={mapBounds} />}
                    {(tempCoords || userCoords) && (
                      <Marker position={tempCoords ? [tempCoords.lat, tempCoords.lon] : [userCoords.lat, userCoords.lon]}>
                        <Popup>Vị trí nhận hàng của bạn</Popup>
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
                      <Polyline positions={routeCoordinates} color="#218282" weight={4} />
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
                placeholder="Nhập số điện thoại..."
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
                placeholder="Nhập địa chỉ email..."
                value={formData.email}
                onChange={handleFormChange}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Ghi chú đơn hàng (Tùy chọn)</label>
              <textarea
                className="form-control"
                id="note"
                rows="3"
                placeholder="Ghi chú về thời gian giao hàng, địa điểm chi tiết..."
                value={formData.note}
                onChange={handleFormChange}
              ></textarea>
            </div>

            {formError && (
              <div className="alert alert-danger d-flex align-items-center" role="alert">
                <i className="fas fa-exclamation-triangle me-2"></i>
                <div>{formError}</div>
              </div>
            )}
          </form>
        </div>

        {/* Cột phải: Đơn hàng & Phương thức thanh toán */}
        <div className={`col-lg-6 col-md-6 col-12 ${styles.detailproductSummary}`}>
          <div className={styles.summaryCard}>
            <div className={styles.titleProduct}>
              <h5>
                <i className="fas fa-shopping-bag me-2"></i>Đơn hàng ({finalProducts.length} sản phẩm)
              </h5>
            </div>

            <div className={styles.detailproductContainBox}>
              {finalProducts.length > 0 ? (
                finalProducts.map((item) => (
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
                      <div className={styles.itemTitle}>{item.name}</div>
                      {item.storage && <div className={styles.itemSub}>Phiên bản: {item.storage}</div>}
                      {item.color && <div className={styles.itemSub}>Màu: {item.color}</div>}
                      <div className={styles.itemSub}>Số lượng: {item.quantity || 1}</div>
                      {item.discount_price ? (
                        <div className="d-flex align-items-center gap-2 mt-1">
                          <div className={styles.detailproductSalePrice}>
                            {getDisplayPrice(item).toLocaleString()}₫
                          </div>
                          <div className={styles.detailproductOldPrice}>
                            {(item.price * (item.quantity || 1)).toLocaleString()}₫
                          </div>
                        </div>
                      ) : (
                        <div className={`${styles.detailproductSalePrice} mt-1`}>
                          {getDisplayPrice(item).toLocaleString()}₫
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted">Không có sản phẩm nào trong đơn hàng.</div>
              )}
            </div>

            {/* Mã giảm giá */}
            <div className={`input-group mb-3 ${styles.detailproductInput}`}>
              <input
                type="text"
                className="form-control"
                placeholder="Nhập mã giảm giá..."
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
              />
              <button type="button" className={`${styles.btnBtn} btn`} onClick={applyVoucher}>
                Áp dụng
              </button>
            </div>

            {voucherError && (
              <div className="alert alert-danger py-2 px-3 mb-3 font-small" role="alert">
                <i className="fas fa-exclamation-circle me-1"></i> {voucherError}
              </div>
            )}

            {/* Tính tiền */}
            <div className={styles.detailproductPrice}>
              <div className="d-flex justify-content-between mb-2">
                <span>Tạm tính:</span>
                <strong>{subtotal.toLocaleString()}₫</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Phí vận chuyển:</span>
                <strong>{shippingFee > 0 ? `${shippingFee.toLocaleString()}₫` : 'Miễn phí'}</strong>
              </div>
              {discountPercent > 0 && (
                <div className="d-flex justify-content-between mb-2 text-success">
                  <span>Giảm giá Voucher:</span>
                  <strong>-{discountPercent}%</strong>
                </div>
              )}
              <hr />
              <div className="d-flex justify-content-between align-items-center">
                <span className="fw-bold">Tổng thanh toán:</span>
                <span className={styles.totalPriceHighlight}>{totalPrice.toLocaleString()}₫</span>
              </div>
            </div>

            {/* Phương thức thanh toán */}
            <div className="mb-4">
              <label className="form-label fw-bold mb-2">Chọn phương thức thanh toán</label>
              
              <div className={styles.paymentMethodList}>
                {/* 1. COD */}
                <label className={`${styles.paymentOptionCard} ${paymentMethod === 'cod' ? styles.activeOption : ''}`}>
                  <input
                    className="form-check-input"
                    type="radio"
                    name="payment"
                    id="cod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={handlePaymentChange}
                  />
                  <div className={styles.paymentOptionContent}>
                    <div className="d-flex align-items-center gap-2">
                      <i className="fas fa-money-bill-wave text-teal"></i>
                      <strong>Trả tiền mặt khi nhận hàng (COD)</strong>
                    </div>
                    <small className="text-muted d-block mt-1">Thanh toán trực tiếp cho nhân viên giao hàng</small>
                  </div>
                </label>

                {/* 2. ZaloPay */}
                <label className={`${styles.paymentOptionCard} ${paymentMethod === 'zalopay' ? styles.activeOption : ''}`}>
                  <input
                    className="form-check-input"
                    type="radio"
                    name="payment"
                    id="zalopay"
                    value="zalopay"
                    checked={paymentMethod === 'zalopay'}
                    onChange={handlePaymentChange}
                  />
                  <div className={styles.paymentOptionContent}>
                    <div className="d-flex align-items-center gap-2">
                      <i className="fas fa-wallet text-teal"></i>
                      <strong>Thanh toán qua Ví ZaloPay / ATM</strong>
                    </div>
                    <small className="text-muted d-block mt-1">Chuyển hướng an toàn sang cổng thanh toán ZaloPay</small>
                  </div>
                </label>

                {/* 3. Chuyển khoản */}
                <label className={`${styles.paymentOptionCard} ${styles.disabledOption}`}>
                  <input
                    className="form-check-input"
                    type="radio"
                    name="payment"
                    id="bank"
                    value="bank"
                    disabled
                    checked={paymentMethod === 'bank'}
                    onChange={handlePaymentChange}
                  />
                  <div className={styles.paymentOptionContent}>
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-2">
                        <i className="fas fa-university text-secondary"></i>
                        <strong className="text-secondary">Chuyển khoản Ngân hàng</strong>
                      </div>
                      <span className="badge bg-secondary">Tạm bảo trì</span>
                    </div>
                    <small className="text-muted d-block mt-1">Phương thức này đang tạm thời không khả dụng</small>
                  </div>
                </label>
              </div>
            </div>

            <button
              className={`${styles.btnBtn} btn w-100 py-3 font-bold`}
              onClick={handlePlaceOrder}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  ĐANG XỬ LÝ ĐƠN HÀNG...
                </>
              ) : (
                'XÁC NHẬN ĐẶT HÀNG'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;