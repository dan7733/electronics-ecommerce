import categoryModel from '../models/categoryModel.js';
import categoryAttributeModel from '../models/categoryAttributeModel.js';
import logger from '../configs/logger.js';

// Tải trang Quản lý Thuộc tính Danh mục
const listCategoryAttributes = async (req, res) => {
    try {
        const categories = await categoryModel.getAllCategory();
        const selectedCategoryId = req.query.category_id ? parseInt(req.query.category_id) : (categories.length > 0 ? categories[0].category_id : null);
        const message = req.query.message || '';

        let attributes = [];
        if (selectedCategoryId) {
            attributes = await categoryAttributeModel.getAttributesByCategoryId(selectedCategoryId);
        }

        res.render('home', {
            data: {
                title: 'Quản lý thuộc tính danh mục',
                page: 'categoryAttributes',
                categories: categories,
                selectedCategoryId: selectedCategoryId,
                attributes: attributes,
                message: message
            }
        });
    } catch (error) {
        logger.error('Lỗi khi tải trang quản lý thuộc tính danh mục', { error: error.message, stack: error.stack });
        res.status(500).send("Lỗi khi tải dữ liệu.");
    }
};

// Thêm thuộc tính mới cho Danh mục (Hỗ trợ nhập 1 thuộc tính HOẶC danh sách cách nhau bằng dấu phẩy/xuống dòng)
const addCategoryAttribute = async (req, res) => {
    try {
        const { category_id, name } = req.body;

        if (!category_id || !name || name.trim() === '') {
            logger.warn('Thêm thuộc tính thất bại: Thiếu thông tin category_id hoặc name');
            return res.redirect(`/category-attributes?category_id=${category_id || ''}&message=Vui lòng nhập đầy đủ thông tin!`);
        }

        // Tách chuỗi theo dấu phẩy, dấu chấm phẩy hoặc dấu xuống dòng
        const attributeNames = name
            .split(/[,;\n]/)
            .map(attr => attr.trim())
            .filter(attr => attr.length > 0);

        let addedCount = 0;
        for (const attrName of attributeNames) {
            // Đảm bảo mỗi tên thuộc tính không vượt quá 100 ký tự
            const cleanName = attrName.substring(0, 100);
            await categoryAttributeModel.addCategoryAttribute(category_id, cleanName);
            addedCount++;
        }

        logger.info('Thêm thuộc tính danh mục thành công', { category_id, count: addedCount });

        res.redirect(`/category-attributes?category_id=${category_id}&message=Đã thêm thành công ${addedCount} thuộc tính!`);
    } catch (error) {
        logger.error('Lỗi khi thêm thuộc tính danh mục', { error: error.message, stack: error.stack, body: req.body });
        res.redirect(`/category-attributes?category_id=${req.body.category_id || ''}&message=Có lỗi xảy ra khi thêm thuộc tính.`);
    }
};

// Xóa thuộc tính khỏi Danh mục
const deleteCategoryAttribute = async (req, res) => {
    try {
        const { attribute_id, category_id } = req.body;

        if (!attribute_id) {
            return res.redirect(`/category-attributes?category_id=${category_id || ''}&message=Thiếu ID thuộc tính cần xóa`);
        }

        await categoryAttributeModel.deleteCategoryAttribute(attribute_id);
        logger.info('Xóa thuộc tính danh mục thành công', { attribute_id });

        res.redirect(`/category-attributes?category_id=${category_id}&message=Xóa thuộc tính thành công!`);
    } catch (error) {
        logger.error('Lỗi khi xóa thuộc tính danh mục', { error: error.message, stack: error.stack, body: req.body });
        res.redirect(`/category-attributes?category_id=${req.body.category_id || ''}&message=Có lỗi xảy ra khi xóa.`);
    }
};

export default {
    listCategoryAttributes,
    addCategoryAttribute,
    deleteCategoryAttribute
};