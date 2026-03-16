import React from 'react';
import dienthoai from '../../img/category/Điện Thoại.jpg';
import dongho from '../../img/category/Đồng hồ.jpg';
import maytinhbang from '../../img/category/Máy tính bảng.jpg';
import tv from '../../img/category/TV.jpg';
import maygiat from '../../img/category/Máy giặt.jpg';
import tulanh from '../../img/category/Tủ lạnh.jpg';
import pc from '../../img/category/Máy tính để bàn.jpg';
import laptop from '../../img/category/Laptop.jpg';
import phukien from '../../img/category/Phụ kiện.jpg';
import { Link } from 'react-router-dom';
import styles from '../css/category/category.module.css';

const Category = () => {
    const categories = [
        { label: 'Điện thoại', image: dienthoai, alt: 'Phone', category_id: 1, className: styles.phone },
        { label: 'Đồng hồ', image: dongho, alt: 'Clock', category_id: 6 },
        { label: 'Tablet', image: maytinhbang, alt: 'Tablet', category_id: 9 }
    ];
    const categories2 = [
        { label: 'TV', image: tv, alt: 'TV', category_id: 4, className: styles.phone },
        { label: 'Máy giặt', image: maygiat, alt: 'Washing machine', category_id: 8 },
        { label: 'Tủ lạnh', image: tulanh, alt: 'Fridge', category_id: 5 }
    ];
    const categories3 = [
        { label: 'PC', image: pc, alt: 'PC', category_id: 11, className: styles.phone },
        { label: 'Laptop', image: laptop, alt: 'Laptop', category_id: 2 },
        { label: 'Phụ Kiện', image: phukien, alt: 'Accessories', category_id: 7 }
    ];


    return (
        <div className={styles['category-container']}>
            {[...Array(1)].map((_, i) => (
                <div className={styles['category-item-container']} key={i}>
                    {categories.map((item, index) => (
                        <Link to={`/productlist/?categoryId=${item.category_id}`} className={`${styles.item} ${item.className || ''}`} key={index}>
                            {item.label}
                            <img src={item.image} alt={item.alt} />
                        </Link>
                    ))}
                </div>
            ))}
            {[...Array(1)].map((_, i) => (
                <div className={styles['category-item-container']} key={i}>
                    {categories2.map((item, index) => (
                        <Link to={`/productlist/?categoryId=${item.category_id}`} className={`${styles.item} ${item.className || ''}`} key={index}>
                        {item.label}
                        <img src={item.image} alt={item.alt} />
                    </Link>
                    ))}
                </div>
            ))}
            {[...Array(1)].map((_, i) => (
                <div className={styles['category-item-container']} key={i}>
                    {categories3.map((item, index) => (
                        <Link to={`/productlist/?categoryId=${item.category_id}`} className={`${styles.item} ${item.className || ''}`} key={index}>
                        {item.label}
                        <img src={item.image} alt={item.alt} />
                    </Link>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default Category;
