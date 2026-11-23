import { getLogFiles, getLogContent } from '../models/logModel.js';
import logger from '../configs/logger.js';

// ====================== RENDER PAGE ======================

// Trang chính xem log
const getLogPage = async (req, res) => {
    try {
        const message = req.query.message || '';
        const selectedDate = req.query.date || '';

        res.render('home', {
            data: {
                title: 'Xem Log Hệ Thống',
                page: 'log',
                message: message,
                selectedDate: selectedDate
            }
        });
    } catch (error) {
        logger.error('Lỗi khi render trang xem log', { error: error.message, stack: error.stack });
        res.status(500).send('Có lỗi xảy ra khi tải trang log.');
    }
};

// ====================== API (giữ lại để frontend gọi nếu cần) ======================

const getLogFilesAPI = async (req, res) => {
    try {
        logger.debug('Received request for log files', { url: req.url, method: req.method });
        const files = await getLogFiles();
        
        logger.info('Fetched log files successfully', { count: files.length });
        
        return res.status(200).json({
            errCode: 0,
            data: files,
        });
    } catch (error) {
        logger.error('Error fetching log files', { error: error.message, stack: error.stack });
        return res.status(500).json({
            errCode: 1,
            message: error.message || 'Error fetching log files',
        });
    }
};

const getLogContentAPI = async (req, res) => {
    try {
        logger.debug('Received request for log content', { url: req.url, params: req.params });
        const { filename } = req.params;

        if (!filename) {
            return res.status(400).json({
                errCode: 1,
                message: 'Filename is required'
            });
        }

        const content = await getLogContent(filename);
        
        logger.info(`Fetched log content for ${filename}`, { lines: content.length });

        return res.status(200).json({
            errCode: 0,
            data: content,
        });
    } catch (error) {
        logger.error(`Error fetching log content for ${req.params.filename}`, { 
            error: error.message, 
            stack: error.stack 
        });
        return res.status(500).json({
            errCode: 1,
            message: error.message || 'Error fetching log content',
        });
    }
};

export default {
    getLogPage,           // Render EJS page (chính)
    getLogFilesAPI,
    getLogContentAPI
};