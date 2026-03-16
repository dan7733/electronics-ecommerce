import { Review } from '../models/reviewModel.js';
import { Order } from '../models/orderModel.js';
import { OrderDetail } from '../models/orderdetailModel.js';
import { User } from '../models/userModel.js';
import { Product } from '../models/productModel.js';
import { Op, fn, col } from 'sequelize';

const addReviewAPI = async (req, res) => {
  const { order_id, product_id, username, rating, comment } = req.body;
  console.log('Request body:', req.body);

  // Validate inputs
  if (!username) {
    return res.status(400).json({
      errCode: 1,
      message: 'Tên người dùng không được cung cấp.',
    });
  }

  if (!product_id) {
    return res.status(400).json({
      errCode: 1,
      message: 'ID sản phẩm không được cung cấp.',
    });
  }

  if (!order_id) {
    return res.status(400).json({
      errCode: 1,
      message: 'ID đơn hàng không được cung cấp.',
    });
  }

  try {
    // Find user by username
    const user = await User.findOne({
      where: { username },
    });

    if (!user) {
      return res.status(400).json({
        errCode: 1,
        message: 'Người dùng không tồn tại.',
      });
    }

    const user_id = user.user_id;

    // Check if order exists and is eligible
    const order = await Order.findOne({
      where: { order_id, user_id, status: 'delivered', status_payment: 'paid' },
    });

    if (!order) {
      return res.status(400).json({
        errCode: 1,
        message: 'Không thể đánh giá: Đơn hàng không hợp lệ hoặc chưa hoàn tất.',
      });
    }

    // Check if product belongs to the order
    const orderDetail = await OrderDetail.findOne({
      where: { order_id, product_id },
    });

    if (!orderDetail) {
      return res.status(400).json({
        errCode: 1,
        message: 'Sản phẩm không thuộc đơn hàng này.',
      });
    }

    // Check for existing review
    const existingReview = await Review.findOne({
      where: { order_id, product_id, user_id },
    });

    if (existingReview) {
      return res.status(400).json({
        errCode: 1,
        message: 'Bạn đã đánh giá sản phẩm này cho đơn hàng này.',
      });
    }

    // Create new review
    const review = await Review.create({
      user_id,
      product_id,
      order_id,
      rating,
      comment,
    });

    // Mark OrderDetail as reviewed
    await OrderDetail.update(
      { isReviewed: true },
      { where: { order_id, product_id } }
    );

    return res.status(200).json({
      errCode: 0,
      message: 'Đánh giá đã được gửi thành công!',
      data: review,
    });
  } catch (error) {
    console.error('Error in addReviewAPI:', error);
    return res.status(500).json({
      errCode: 1,
      message: 'Có lỗi xảy ra khi gửi đánh giá.',
    });
  }
};

const updateReviewAPI = async (req, res) => {
  const { order_id, product_id, username, rating, comment } = req.body;

  // Validate inputs
  if (!username) {
    return res.status(400).json({
      errCode: 1,
      message: 'Tên người dùng không được cung cấp.',
    });
  }

  if (!product_id) {
    return res.status(400).json({
      errCode: 1,
      message: 'ID sản phẩm không được cung cấp.',
    });
  }

  if (!order_id) {
    return res.status(400).json({
      errCode: 1,
      message: 'ID đơn hàng không được cung cấp.',
    });
  }

  try {
    // Find user by username
    const user = await User.findOne({
      where: { username },
    });

    if (!user) {
      return res.status(400).json({
        errCode: 1,
        message: 'Người dùng không tồn tại.',
      });
    }

    const user_id = user.user_id;

    // Check if review exists
    const existingReview = await Review.findOne({
      where: { order_id, product_id, user_id },
    });

    if (!existingReview) {
      return res.status(400).json({
        errCode: 1,
        message: 'Không tìm thấy đánh giá để cập nhật.',
      });
    }

    // Update review
    await Review.update(
      { rating, comment, updated_at: new Date() },
      { where: { order_id, product_id, user_id } }
    );

    const updatedReview = await Review.findOne({
      where: { order_id, product_id, user_id },
    });

    return res.status(200).json({
      errCode: 0,
      message: 'Đánh giá đã được cập nhật thành công!',
      data: updatedReview,
    });
  } catch (error) {
    console.error('Error in updateReviewAPI:', error);
    return res.status(500).json({
      errCode: 1,
      message: 'Có lỗi xảy ra khi cập nhật đánh giá.',
    });
  }
};

const getReviewsByProductAPI = async (req, res) => {
  const { product_id } = req.params;

  try {
    const reviews = await Review.findAll({
      where: { product_id },
      include: [
        {
          model: User,
          attributes: ['username', 'fullname', 'avatar'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    return res.status(200).json({
      errCode: 0,
      data: reviews,
    });
  } catch (error) {
    console.error('Error in getReviewsByProductAPI:', error);
    return res.status(500).json({
      errCode: 1,
      message: 'Có lỗi xảy ra khi lấy đánh giá.',
    });
  }
};

const getUserReviewAPI = async (req, res) => {
  const { order_id, product_id, username } = req.query;

  try {
    const user = await User.findOne({
      where: { username },
    });

    if (!user) {
      return res.status(400).json({
        errCode: 1,
        message: 'Người dùng không tồn tại.',
      });
    }

    const user_id = user.user_id;

    const review = await Review.findOne({
      where: { order_id, product_id, user_id },
      include: [
        {
          model: User,
          attributes: ['username', 'fullname', 'avatar'],
        },
      ],
    });

    return res.status(200).json({
      errCode: 0,
      data: review || null,
    });
  } catch (error) {
    console.error('Error in getUserReviewAPI:', error);
    return res.status(500).json({
      errCode: 1,
      message: 'Có lỗi xảy ra khi lấy đánh giá.',
    });
  }
};

const getLatestReviewsAPI = async (req, res) => {
  try {
    const reviews = await Review.findAll({
      limit: 4,
      include: [
        {
          model: User,
          attributes: ['username', 'fullname', 'avatar'],
        },
        {
          model: Product,
          attributes: ['product_id', 'name'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    return res.status(200).json({
      errCode: 0,
      message: 'Lấy đánh giá mới nhất thành công!',
      data: reviews,
    });
  } catch (error) {
    console.error('Error in getLatestReviewsAPI:', error);
    return res.status(500).json({
      errCode: 1,
      message: 'Có lỗi xảy ra khi lấy đánh giá mới nhất.',
    });
  }
};

const listReviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const offset = (page - 1) * limit;
    const searchKeyword = req.query.search || '';
    const productFilter = req.query.product || '';
    const ratingFilter = req.query.rating || '';
    const sortOption = req.query.sort || 'created_at_desc';
    const message = req.query.message || '';

    const queryOptions = {
      where: {},
      include: [
        { model: User, attributes: ['username', 'fullname'] },
        { model: Product, attributes: ['name'] },
        { model: Order, attributes: ['order_id'] },
      ],
    };

    if (searchKeyword) {
      queryOptions.where[Op.or] = [
        { comment: { [Op.like]: `%${searchKeyword}%` } },
        { '$User.username$': { [Op.like]: `%${searchKeyword}%` } },
        { '$User.fullname$': { [Op.like]: `%${searchKeyword}%` } },
      ];
    }

    if (productFilter) {
      queryOptions.where.product_id = productFilter;
    }

    if (ratingFilter) {
      queryOptions.where.rating = ratingFilter;
    }

    queryOptions.offset = offset;
    queryOptions.limit = limit;

    switch (sortOption) {
      case 'rating_asc':
        queryOptions.order = [['rating', 'ASC']];
        break;
      case 'rating_desc':
        queryOptions.order = [['rating', 'DESC']];
        break;
      case 'created_at_asc':
        queryOptions.order = [['created_at', 'ASC']];
        break;
      default:
        queryOptions.order = [['created_at', 'DESC']];
    }

    const reviews = await Review.findAll(queryOptions);
    const totalReviews = await Review.count({
      where: queryOptions.where,
      include: queryOptions.include,
    });
    const totalPages = Math.ceil(totalReviews / limit);

    let selectedProductName = '';
    if (productFilter) {
      const product = await Product.findOne({
        where: { product_id: productFilter },
        attributes: ['name'],
      });
      selectedProductName = product ? product.name : '';
    }

    res.render('home', {
      data: {
        title: 'Danh sách Đánh giá',
        page: 'listReviews',
        rows: reviews,
        currentPage: page,
        totalPages,
        message,
        search: searchKeyword,
        sort: sortOption,
        selectedProduct: productFilter,
        selectedProductName,
        selectedRating: ratingFilter,
      },
    });
  } catch (error) {
    console.error('Error in listReviews:', error);
    res.status(500).send('Lỗi khi tải danh sách đánh giá.');
  }
};

const deleteReview = async (req, res) => {
  try {
    const { review_id } = req.body;
    const result = await Review.destroy({ where: { review_id } });

    if (result) {
      res.redirect('/listreviews?message=Xóa đánh giá thành công');
    } else {
      res.redirect('/listreviews?message=Không tìm thấy đánh giá để xóa');
    }
  } catch (error) {
    console.error('Error in deleteReview:', error);
    res.redirect('/listreviews?message=Xóa đánh giá thất bại');
  }
};

const statsTopRatedProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    const topRatedProducts = await Review.findAll({
      attributes: [
        'product_id',
        [fn('AVG', col('rating')), 'average_rating'],
        [fn('COUNT', col('review_id')), 'review_count'],
      ],
      include: [
        {
          model: Product,
          attributes: ['name', 'product_img'],
        },
      ],
      group: ['product_id', 'Product.product_id'],
      order: [[fn('AVG', col('rating')), 'DESC']],
      limit,
      offset,
    });

    const totalProducts = await Review.count({
      attributes: ['product_id'],
      group: ['product_id'],
    });
    const totalPages = Math.ceil(totalProducts.length / limit);

    res.render('home', {
      data: {
        title: 'Thống kê Sản phẩm Đánh giá Cao',
        page: 'statsTopRatedProducts',
        rows: topRatedProducts,
        currentPage: page,
        totalPages,
        limit,
      },
    });
  } catch (error) {
    console.error('Error in statsTopRatedProducts:', error);
    res.status(500).send('Lỗi khi thống kê sản phẩm theo đánh giá.');
  }
};

const searchReviewProducts = async (req, res) => {
  try {
    const { query } = req.query;

    const products = await Product.findAll({
      where: {
        name: { [Op.like]: `%${query}%` },
      },
      attributes: ['product_id', 'name'],
      limit: 10,
      order: [['name', 'ASC']],
    });

    return res.status(200).json({
      errCode: 0,
      data: products,
    });
  } catch (error) {
    console.error('Error in searchReviewProducts:', error);
    return res.status(500).json({
      errCode: 1,
      message: 'Có lỗi xảy ra khi tìm kiếm sản phẩm.',
    });
  }
};

export default {
  addReviewAPI,
  updateReviewAPI,
  getReviewsByProductAPI,
  getUserReviewAPI,
  getLatestReviewsAPI,
  listReviews,
  deleteReview,
  statsTopRatedProducts,
  searchReviewProducts,
};