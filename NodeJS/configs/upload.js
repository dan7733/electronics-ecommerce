import multer from 'multer';
import path from 'path';

// Cấu hình lưu file linh hoạt
const storage = (folder) => multer.diskStorage({
    destination: (req, file, cb) => {
        // Cấu hình đường dẫn tùy thuộc vào tham số folder (product, news, ...)
        const uploadFolder = path.resolve(`images/${folder}`);
        cb(null, uploadFolder); // Lưu vào folder tương ứng
    },
    filename: (req, file, cb) => {
        // Tạo tên file duy nhất bằng cách ghép timestamp với tên file gốc
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName); // Tên file duy nhất
    }
});

// Kiểm tra loại file
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ cho phép tải lên file hình ảnh.'));
    }
};

// Hàm khởi tạo multer với giới hạn dung lượng và kiểm tra file
const upload = (folder) => multer({
    storage: storage(folder), // Truyền folder vào
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Giới hạn dung lượng: 5MB
});

export default upload;
