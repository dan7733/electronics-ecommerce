import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import polyline from '@mapbox/polyline';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from '../css/storemap/storemap.module.css';

// Sửa lỗi icon mặc định của Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Hàm tính khoảng cách đường chim bay (Haversine Formula) - Đơn vị: km
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1); 
};

const StoreMap = () => {
  const [stores, setStores] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [inputLocation, setInputLocation] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // State quản lý UI
  const [activeStoreId, setActiveStoreId] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null); 
  const [isLocating, setIsLocating] = useState(false); 
  const [focusedLocation, setFocusedLocation] = useState(null); 

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const ORS_API_KEY = process.env.REACT_APP_ORS_API_KEY;

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/v1/liststore`);
        if (res.data.errCode === 0) {
          setStores(res.data.data);
        } else {
          console.error('Lỗi Logic API:', res.data.message);
          toast.error('Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại sau.');
        }
      } catch (err) {
        console.error('Lỗi kết nối danh sách cửa hàng (Dev Only):', err);
        toast.error('Hệ thống đang bảo trì hoặc mất kết nối. Vui lòng thử lại sau.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStores();
  }, [BACKEND_URL]);

  // Tự động sắp xếp cửa hàng từ gần đến xa
  const sortedStores = useMemo(() => {
    if (!userLocation) return stores;
    
    const storesWithDistance = stores.map((store) => ({
      ...store,
      distanceToUser: parseFloat(calculateDistance(userLocation[0], userLocation[1], store.latitude, store.longitude))
    }));

    return storesWithDistance.sort((a, b) => a.distanceToUser - b.distanceToUser);
  }, [stores, userLocation]);

  const geocodeLocation = async () => {
    if (!inputLocation) {
      toast.warning('Vui lòng nhập vị trí của bạn để tìm kiếm.');
      return;
    }
    try {
      const res = await axios.get(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(inputLocation)}&format=json`
      );
      if (res.data && res.data.length > 0) {
        const { lat, lon } = res.data[0];
        const parsedLat = parseFloat(lat);
        const parsedLon = parseFloat(lon);
        setUserLocation([parsedLat, parsedLon]);
        setFocusedLocation([parsedLat, parsedLon]);
        
      } else {
        toast.error('Không tìm thấy vị trí này trên bản đồ. Vui lòng nhập rõ hơn.');
      }
    } catch (err) {
      console.error('Lỗi Geocode Nominatim (Dev Only):', err);
      toast.error('Dịch vụ tìm kiếm địa chỉ đang bận. Vui lòng thử lại sau.');
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.warning('Trình duyệt hoặc thiết bị của bạn không hỗ trợ định vị.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        setInputLocation('Vị trí hiện tại của bạn');
        setFocusedLocation([latitude, longitude]);
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        console.error('Lỗi GPS (Dev Only):', error);
        toast.error('Không thể lấy được vị trí. Vui lòng cấp quyền GPS cho trình duyệt.');
      }
    );
  };

  const drawRoute = async (startLat, startLng, endLat, endLng) => {
    const apiKey = ORS_API_KEY;

    if (!apiKey) {
      toast.error('Lỗi: Hệ thống thiếu API Key tìm đường.');
      return;
    }

    try {
      const res = await axios.get('https://api.openrouteservice.org/v2/directions/driving-car', {
        params: {
          api_key: apiKey,
          start: `${startLng},${startLat}`,
          end: `${endLng},${endLat}`,
          radiuses: '-1|-1'
        }
      });

      if (res.data && res.data.features && res.data.features.length > 0) {
        const routeFeature = res.data.features[0];
        
        const coordinates = routeFeature.geometry.coordinates;
        const coords = coordinates.map(([lng, lat]) => [lat, lng]);
        setRouteCoordinates(coords);

        const summary = routeFeature.properties.summary;
        const distanceKm = (summary.distance / 1000).toFixed(1); 
        const durationMin = Math.round(summary.duration / 60); 
        setRouteInfo({ distance: distanceKm, duration: durationMin });

      } else {
        toast.warning('Không thể tìm thấy tuyến đường khả dụng giữa hai điểm này.');
        setRouteInfo(null);
      }
    } catch (err) {
      console.error('Lỗi OpenRouteService (Dev Only):', err);
      setRouteInfo(null);
      
      const serverMessage = err.response?.data?.error?.message || '';
      
      if (serverMessage.includes('Could not find routable point')) {
        toast.warning('Vị trí nằm quá xa đường bộ. Xin hãy chọn điểm gần lộ hơn!');
      } else {
        toast.error('Hệ thống chỉ đường đang tạm gián đoạn. Vui lòng thử lại sau.');
      }
    }
  };

  const handleStoreClick = (store) => {
    setActiveStoreId(store.store_id);
    setFocusedLocation([store.latitude, store.longitude]); 
    
    if (userLocation) {
      drawRoute(userLocation[0], userLocation[1], store.latitude, store.longitude);
    } else {
      setRouteCoordinates([]);
      setRouteInfo(null);
    }
  };

  const MapController = () => {
    const map = useMap();
    
    useEffect(() => {
      if (!map) return;

      map.stop(); 

      if (routeCoordinates.length > 0) {
        map.fitBounds(routeCoordinates, { padding: [50, 50] });
      } else if (focusedLocation) {
        map.flyTo(focusedLocation, 16, { duration: 1.2 });
      } else if (stores.length > 0 && !userLocation) {
        const bounds = L.latLngBounds(stores.map((store) => [store.latitude, store.longitude]));
        map.fitBounds(bounds);
      }
    }, [stores, userLocation, routeCoordinates, focusedLocation, map]);
    
    return null;
  };

  return (
    <div className={styles.container}>
      <ToastContainer position="top-right" autoClose={3000} />

      <div className={styles.sidebar}>
        <h2 className={styles.title}>
          <i className="fas fa-store me-2"></i> Danh sách cửa hàng
        </h2>
        
        <div className={styles.inputGroup}>
          <input
            type="text"
            className="form-control"
            value={inputLocation}
            onChange={(e) => setInputLocation(e.target.value)}
            placeholder="Nhập vị trí..."
            onKeyDown={(e) => e.key === 'Enter' && geocodeLocation()}
          />
          <button className={styles.btnGps} onClick={getCurrentLocation} title="Vị trí tự động">
            {isLocating ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-location-arrow"></i>}
          </button>
          <button onClick={geocodeLocation} title="Tìm kiếm">
            <i className="fas fa-search"></i> 
          </button>
        </div>

        {isLoading ? (
          <div className={styles['loading-container']}>
            <div className={styles.spinner}></div>
            <span>Đang tải dữ liệu...</span>
          </div>
        ) : (
          <>
            <div className={styles.storeListDesktop}>
              <ul className={styles.storeList}>
                {sortedStores.length > 0 ? (
                  sortedStores.map((store) => (
                    <li
                      key={store.store_id}
                      className={`${styles.storeItem} ${activeStoreId === store.store_id ? styles.activeStore : ''}`}
                      onClick={() => handleStoreClick(store)}
                    >
                      <div>
                        <strong>{store.name}</strong>
                        <br />
                        <i className="fas fa-map-marker-alt me-1"></i> {store.address}
                        <br />
                        <i className="fas fa-clock me-1"></i> {store.open_hours} - {store.close_hour}
                        
                        {/* Hiện khoảng cách chim bay nếu đã nhập vị trí */}
                        {userLocation && store.distanceToUser !== undefined && (
                          <div style={{ marginTop: '5px', color: '#666', fontSize: '0.85rem' }}>
                            <i className="fas fa-ruler-horizontal me-1"></i> Cách bạn ~{store.distanceToUser} km
                          </div>
                        )}

                        {/* Hiện thông tin tuyến đường cụ thể khi được chọn */}
                        {activeStoreId === store.store_id && routeInfo && (
                          <div className={styles.routeDetails}>
                            <i className="fas fa-car side-icon"></i> 
                            Quãng đường xe: {routeInfo.distance} km (~{routeInfo.duration} phút)
                          </div>
                        )}
                      </div>
                    </li>
                  ))
                ) : (
                  <p className="text-muted mt-3 text-center">Không có dữ liệu cửa hàng.</p>
                )}
              </ul>
            </div>
            
            <div className={styles.storeListMobile}>
              {/* Giữ nguyên phần Mobile của bạn */}
            </div>
          </>
        )}
      </div>

      <MapContainer
        center={[10.0478, 105.769]}
        zoom={13}
        className={styles.map}
      >
        {/* ĐÃ CẬP NHẬT TILELAYER SANG GOOGLE MAPS ĐỂ LẤY HÌNH ẢNH MỚI NHẤT */}
        <TileLayer
          url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          attribution='© <a href="https://maps.google.com/">Google Maps</a>'
        />
        <MapController />
        
        {stores.map((store) => (
          <Marker key={store.store_id} position={[store.latitude, store.longitude]}>
            <Popup>
              <b>{store.name}</b>
              <br />{store.address}
              <br />Giờ mở: {store.open_hours} - {store.close_hour}
            </Popup>
          </Marker>
        ))}
        
        {userLocation && (
          <Marker position={userLocation}>
            <Popup>Vị trí của bạn</Popup>
          </Marker>
        )}
        
        {routeCoordinates.length > 0 && (
          <Polyline positions={routeCoordinates} color="#218282" weight={5} opacity={0.8} />
        )}
      </MapContainer>
    </div>
  );
};

export default StoreMap;