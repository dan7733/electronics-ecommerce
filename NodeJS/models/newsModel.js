import { sequelize, DataTypes } from '../configs/connectDatabase.js';
import { Op } from 'sequelize';

const News = sequelize.define('News', {
    news_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    summary: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    image: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'news',
    timestamps: false // Không dùng timestamps tự động nữa
});

// Thêm tin tức mới
const addNews = async (title, summary, content, image) => {
    try {
        const result = await News.create({
            title: title,
            summary: summary,
            content: content,
            image: image,
            created_at: new Date(),
            updated_at: new Date()
        });

        return result; // Trả về bản ghi tin tức vừa được tạo
    } catch (error) {
        console.error('Lỗi khi thêm tin tức:', error);
        throw error;
    }
};


// Lấy tất cả tin tức
const listNews = async (offset = null, limit = null, searchKeyword = '', sortOption = 'default') => {
    try {
        const queryOptions = {
            where: {}
        };

        // Tìm kiếm theo tiêu đề
        if (searchKeyword) {
            queryOptions.where.title = { [Op.like]: `%${searchKeyword}%` };
        }

        // Phân trang
        if (offset !== null) queryOptions.offset = offset;
        if (limit !== null) queryOptions.limit = limit;

        // Sắp xếp theo ngày cập nhật
        if (sortOption === 'updated_at_asc') {
            queryOptions.order = [['updated_at', 'ASC']];
        } else if (sortOption === 'updated_at_desc') {
            queryOptions.order = [['updated_at', 'DESC']];
        } else {
            queryOptions.order = [['news_id', 'DESC']]; // mặc định sắp xếp theo ID giảm dần
        }

        const newsList = await News.findAll(queryOptions);
        return newsList;
    } catch (error) {
        console.error('Lỗi khi tải danh sách tin tức:', error);
        throw error;
    }
};

// Đếm số lượng tin tức
const countNews = async (searchKeyword = '') => {
    try {
        const queryOptions = { where: {} };

        if (searchKeyword) {
            queryOptions.where.title = { [Op.like]: `%${searchKeyword}%` };
        }

        return await News.count(queryOptions);
    } catch (error) {
        console.error('Lỗi khi đếm tin tức:', error);
        throw error;
    }
};

//xóa tin tức
const deleteNews = async (newsId) => {
    try {
        // Tìm bài viết trước khi xóa để lấy tên ảnh (nếu có)
        const news = await News.findOne({
            where: { news_id: newsId },
            attributes: ['image'] // Giả sử bài viết có trường image
        });

        if (!news) {
            return null; // Không tìm thấy bài viết
        }

        // Xóa bài viết
        const result = await News.destroy({
            where: { news_id: newsId }
        });

        return result ? news.image : null; // Trả về tên ảnh nếu xóa thành công
    } catch (error) {
        console.error('Lỗi khi xóa bài viết:', error);
        throw error;
    }
};

// Lấy chi tiết tin tức theo ID
const getNewsById = async (newsId) => {
    if (!newsId) {
        throw new Error('Yêu cầu ID bài viết');
    }
    try {
        const result = await News.findOne({ where: { news_id: newsId } });
        return result;
    } catch (error) {
        console.error('Lỗi khi tìm bài viết:', error);
        throw error;
    }
};

// Cập nhật bản tin
const updateNews = async (idNews, title, summary, content, image) => {
    try {
        const result = await News.update(
            {
                title: title,
                summary: summary,
                content: content,
                image: image,
                updated_at: new Date() // Cập nhật ngày giờ hiện tại
            },
            {
                where: { news_id: idNews }
            }
        );
        return result;
    } catch (error) {
        console.error('Lỗi khi cập nhật tin tức:', error);
        throw error;
    }
};




//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// api//////////////////////////////////////////////////

// lấy tin tức mới 
// Lấy 5 tin tức mới nhất
const getLatestNewsAPI = async () => {
    try {
        const latestNews = await News.findAll({
            attributes: ['news_id', 'title', 'summary', 'image'], // chỉ lấy các trường cần thiết
            order: [['created_at', 'DESC']],
            limit: 5
        });
        return latestNews;
    } catch (error) {
        console.error('Lỗi khi lấy tin tức mới nhất:', error);
        throw error;
    }
};


// danh sách tin tức
// API: Lấy danh sách tin tức (chỉ lấy các trường cần thiết)
const listNewsAPI = async (offset = null, limit = null, searchKeyword = '', sortOption = 'default') => {
    try {
        const queryOptions = {
            where: {},
            attributes: ['news_id', 'title', 'summary', 'image'] // chỉ lấy các trường này
        };

        // Tìm kiếm theo tiêu đề
        if (searchKeyword) {
            queryOptions.where.title = { [Op.like]: `%${searchKeyword}%` };
        }

        // Phân trang
        if (offset !== null) queryOptions.offset = offset;
        if (limit !== null) queryOptions.limit = limit;

        // Sắp xếp
        if (sortOption === 'newest') {
            queryOptions.order = [['updated_at', 'DESC']];
        } else if (sortOption === 'oldest') {
            queryOptions.order = [['updated_at', 'ASC']];
        } else {
            queryOptions.order = [['news_id', 'DESC']];
        }

        const newsList = await News.findAll(queryOptions);
        return newsList;
    } catch (error) {
        console.error('Lỗi khi tải danh sách tin tức:', error);
        throw error;
    }
};

// API: Đếm số lượng tin tức (không cần sửa)
const countNewsAPI = async (searchKeyword = '') => {
    try {
        const queryOptions = { where: {} };

        if (searchKeyword) {
            queryOptions.where.title = { [Op.like]: `%${searchKeyword}%` };
        }

        return await News.count(queryOptions);
    } catch (error) {
        console.error('Lỗi khi đếm tin tức:', error);
        throw error;
    }
};


const getNewsByIdAPI = async (newsId) => {
    if (!newsId) {
        throw new Error('Yêu cầu ID bài viết');
    }
    try {
        const result = await News.findOne({
            where: { news_id: newsId },
            attributes: ['title', 'image', 'content']
        });
        return result;
    } catch (error) {
        console.error('Lỗi khi tìm bài viết:', error);
        throw error;
    }
};



export default {
    addNews,
    listNews,
    countNews,
    deleteNews,
    getNewsById,
    updateNews,
    // API
    getLatestNewsAPI,
    listNewsAPI,
    countNewsAPI,
    getNewsByIdAPI
}
