import React from 'react';
import aboutus from '../../img/about/aboutus.jpg';
import mission from '../../img/about/mission.jpg';
import styles from '../css/about/about.module.css';

const About = () => {
  return (
    <div>
      {/* Hero Section */}
      <div className={styles['about-hero']}>
        <h1>CHÀO MỪNG ĐẾN VỚI ESHOP</h1>
        <p>Chúng tôi cung cấp những sản phẩm tốt nhất để phục vụ khách hàng.</p>
      </div>

      {/* Về chúng tôi */}
      <div className={`container ${styles['about-section']}`}>
        <div className="row align-items-center">
          <div className="col-md-6">
            <h2 className={styles['about-icon-title']}><i className="fas fa-building"></i>Về chúng tôi</h2>
            <p>
              Công Ty ABC được thành lập với sứ mệnh cung cấp những sản phẩm chất lượng và dịch vụ tuyệt vời cho khách hàng.
              Chúng tôi luôn hướng đến việc mang lại những giải pháp tối ưu và giá trị cao cho người tiêu dùng.
              Đội ngũ nhân viên của chúng tôi tận tâm và luôn sẵn sàng hỗ trợ khách hàng mọi lúc.
            </p>
          </div>
          <div className="col-md-6 text-center">
            <img src={aboutus} alt="About Us" />
          </div>
        </div>
      </div>

      {/* Sứ mệnh */}
      <div className={`container ${styles['about-section']}`}>
        <div className="row align-items-center flex-md-row-reverse">
          <div className="col-md-6">
            <h2 className={styles['about-mission-title']}><i className="fas fa-bullseye"></i>Sứ Mệnh Của Chúng Tôi</h2>
            <p>
              Chúng tôi cam kết mang lại những sản phẩm và dịch vụ tốt nhất, với chất lượng vượt trội và giá cả hợp lý,
              nhằm đáp ứng nhu cầu và mong muốn của khách hàng. Mục tiêu của chúng tôi là trở thành đối tác đáng tin cậy của mọi khách hàng.
            </p>
          </div>
          <div className="col-md-6 text-center">
            <img src={mission} alt="Mission" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
