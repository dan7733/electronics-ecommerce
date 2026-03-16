import React, { useRef, useEffect, useState } from 'react';
import img12 from '../../img/slider/1.2.png';
import img13 from '../../img/slider/1.3.png';
import img14 from '../../img/slider/1.4.png';
import sl1 from '../../img/slider/sl1.png';
import sl2 from '../../img/slider/sl2.webp';
import sl3 from '../../img/slider/sl3.webp';
import sl4 from '../../img/slider/sl4.webp';
import styles from '../css/slider/slider.module.css';

const Slider = () => {
  const sliderWrapperRef = useRef(null);
  const slideRefs = useRef([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const autoSlideRef = useRef(null);

  const images = [sl1, img12, img13, img14];
  const smallBanners = [
    { img: sl2, link: 'https://example.com/khuyen-mai-2' },
    { img: sl3, link: 'https://example.com/khuyen-mai-3' },
    { img: sl4, link: 'https://example.com/khuyen-mai-4' },
  ];

  const updateSliderPosition = () => {
    const slideWidth = slideRefs.current[0]?.clientWidth || 0;
    if (sliderWrapperRef.current) {
      sliderWrapperRef.current.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
    }
  };

  const nextSlide = () => {
    setCurrentIndex(prev => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
  };

  const startAutoSlide = () => {
    stopAutoSlide();
    autoSlideRef.current = setInterval(nextSlide, 4000);
  };

  const stopAutoSlide = () => {
    if (autoSlideRef.current) {
      clearInterval(autoSlideRef.current);
    }
  };

  useEffect(() => {
    updateSliderPosition();
  }, [currentIndex]);

  useEffect(() => {
    const handleResize = () => updateSliderPosition();
    window.addEventListener('resize', handleResize);

    startAutoSlide();
    return () => {
      stopAutoSlide();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="container-fluid p-0">
      <div
        className={styles['slider-main']}
        onMouseEnter={stopAutoSlide}
        onMouseLeave={startAutoSlide}
      >
        <div className={styles['slider-wrapper']} ref={sliderWrapperRef}>
          {images.map((img, idx) => (
            <div
              key={idx}
              className={styles['slider-item']}
              ref={el => (slideRefs.current[idx] = el)}
            >
              <a href={`https://example.com/khuyen-mai-${idx + 1}`} target="_blank" rel="noreferrer" />
              <img src={img} alt={`Khuyến mãi ${idx + 1}`} />
            </div>
          ))}
        </div>
        <button className={`${styles['slider-btn']} ${styles['slider-btn-prev']}`} onClick={() => { stopAutoSlide(); prevSlide(); startAutoSlide(); }}>
          <i className="fa fa-chevron-left"></i>
        </button>
        <button className={`${styles['slider-btn']} ${styles['slider-btn-next']}`} onClick={() => { stopAutoSlide(); nextSlide(); startAutoSlide(); }}>
          <i className="fa fa-chevron-right"></i>
        </button>
      </div>

      <div className="container">
        <div className={styles['slider-small-banner-row']}>
          {smallBanners.map((banner, idx) => (
            <div key={idx} className={styles['slider-small-banner']}>
              <img src={banner.img} alt={`Khuyến mãi nhỏ ${idx + 2}`} />
              <a href={banner.link} target="_blank" rel="noreferrer" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Slider;
