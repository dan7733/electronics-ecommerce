import { Order } from '../models/orderModel.js';
import { OrderDetail } from '../models/orderdetailModel.js';
import { Product } from '../models/productModel.js';
import { Category } from '../models/categoryModel.js';
import { Brand } from '../models/brandModel.js';
import { User } from '../models/userModel.js';
import { Op } from 'sequelize';

// Hàm tính tích vô hướng (dot product) thủ công
const dotProduct = (vecA, vecB) => {
  return vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
};

// Hàm tính chuẩn (norm) thủ công
const norm = (vec) => {
  return Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
};

// Hàm tính Cosine Similarity giữa hai vector
const cosineSimilarity = (vecA, vecB) => {
  const dot = dotProduct(vecA, vecB);
  const normA = norm(vecA);
  const normB = norm(vecB);
  return normA === 0 || normB === 0 ? 0 : dot / (normA * normB);
};

// Tải dữ liệu và tạo ma trận user-item
const loadUserItemMatrix = async () => {
  const orders = await Order.findAll({
    include: [{
      model: OrderDetail,
      attributes: ['product_id', 'quantity'],
    }],
  });

  const userItemMatrix = {};
  const productIds = new Set();

  orders.forEach(order => {
    const userId = order.user_id;
    if (!userItemMatrix[userId]) userItemMatrix[userId] = {};

    order.OrderDetails.forEach(detail => {
      userItemMatrix[userId][detail.product_id] = detail.quantity;
      productIds.add(detail.product_id);
    });
  });

  return { userItemMatrix, productIds: [...productIds] };
};

// Tính độ tương đồng giữa các sản phẩm
const computeItemSimilarities = (userItemMatrix, productIds) => {
  const similarityMatrix = {};

  productIds.forEach(productId1 => {
    similarityMatrix[productId1] = {};
    productIds.forEach(productId2 => {
      if (productId1 === productId2) {
        similarityMatrix[productId1][productId2] = 1;
        return;
      }

      const vec1 = Object.keys(userItemMatrix).map(userId => userItemMatrix[userId][productId1] || 0);
      const vec2 = Object.keys(userItemMatrix).map(userId => userItemMatrix[userId][productId2] || 0);

      similarityMatrix[productId1][productId2] = cosineSimilarity(vec1, vec2);
    });
  });

  return similarityMatrix;
};

// Lấy sản phẩm dự phòng khi không có gợi ý
const getFallbackProducts = async (n = 5, excludeProductIds = []) => {
  const products = await Product.findAll({
    where: {
      product_id: { [Op.notIn]: excludeProductIds },
    },
    attributes: ['product_id', 'name', 'price', 'discount_price', 'product_img'],
    include: [
      { model: Category, attributes: ['name'] },
      { model: Brand, attributes: ['name'] },
    ],
    order: [['product_id', 'DESC']],
    limit: n,
  });

  return products.map(p => ({
    product_id: p.product_id,
    name: p.name,
    price: p.price,
    discount_price: p.discount_price,
    product_img: p.product_img,
    category: p.Category?.name || 'Unknown',
    brand: p.Brand?.name || 'Unknown',
  }));
};

// Tạo gợi ý dựa trên Collaborative Filtering (hỗ trợ cả khi không có username)
const getCollaborativeRecommendations = async (userId = null, n = 5) => {
  const { userItemMatrix, productIds } = await loadUserItemMatrix();
  let recommendations = [];
  let userPurchasedItems = [];

  // Nếu có userId, lấy danh sách sản phẩm đã mua
  if (userId && userItemMatrix[userId]) {
    userPurchasedItems = Object.keys(userItemMatrix[userId]).map(Number);

    // Thực hiện Collaborative Filtering nếu có dữ liệu mua sắm
    if (Object.keys(userItemMatrix).length && userPurchasedItems.length) {
      const similarityMatrix = computeItemSimilarities(userItemMatrix, productIds);

      const scores = {};
      productIds.forEach(productId => {
        if (userPurchasedItems.includes(productId)) return;

        let score = 0;
        let totalSimilarity = 0;
        userPurchasedItems.forEach(purchasedItem => {
          const sim = similarityMatrix[purchasedItem][productId] || 0;
          score += sim * (userItemMatrix[userId][purchasedItem] || 0);
          totalSimilarity += sim;
        });
        if (totalSimilarity > 0) {
          scores[productId] = score / totalSimilarity;
        }
      });

      const sortedScores = Object.entries(scores)
        .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
        .slice(0, n)
        .map(([productId]) => Number(productId));

      const products = await Product.findAll({
        where: { product_id: sortedScores },
        attributes: ['product_id', 'name', 'price', 'discount_price', 'product_img'],
        include: [
          { model: Category, attributes: ['name'] },
          { model: Brand, attributes: ['name'] },
        ],
      });

      recommendations = products.map(p => ({
        product_id: p.product_id,
        name: p.name,
        price: p.price,
        discount_price: p.discount_price,
        product_img: p.product_img,
        category: p.Category?.name || 'Unknown',
        brand: p.Brand?.name || 'Unknown',
      }));
    }
  }

  // Nếu không có gợi ý hoặc không có userId, lấy sản phẩm dự phòng
  if (!recommendations.length) {
    recommendations = await getFallbackProducts(n, userPurchasedItems);
  }

  // Đảm bảo ít nhất 1 sản phẩm
  if (!recommendations.length) {
    const fallbackProducts = await getFallbackProducts(1, []);
    recommendations = fallbackProducts;
  }

  return recommendations;
};

// Tạo gợi ý dựa trên sản phẩm (ví dụ: phụ kiện cho iPad, điện thoại)
const getProductBasedRecommendations = async (productId, n = 5) => {
  // Lấy thông tin sản phẩm để xác định danh mục và hãng
  const product = await Product.findOne({
    where: { product_id: productId },
    include: [
      { model: Category, attributes: ['category_id', 'name'] },
      { model: Brand, attributes: ['brand_id', 'name'] },
    ],
  });

  if (!product) {
    // Nếu sản phẩm không tồn tại, trả về sản phẩm dự phòng
    return await getFallbackProducts(n, [productId]);
  }

  const { category_id, brand_id } = product;
  let recommendations = [];

  // Logic gợi ý: ưu tiên sản phẩm cùng danh mục (phụ kiện liên quan) hoặc cùng hãng
  const relatedProducts = await Product.findAll({
    where: {
      product_id: { [Op.notIn]: [productId] }, // Loại trừ sản phẩm gốc
      [Op.or]: [
        { category_id: category_id }, // Cùng danh mục
        { brand_id: brand_id }, // Cùng hãng
      ],
    },
    attributes: ['product_id', 'name', 'price', 'discount_price', 'product_img'],
    include: [
      { model: Category, attributes: ['name'] },
      { model: Brand, attributes: ['name'] },
    ],
    order: [['product_id', 'DESC']],
    limit: n,
  });

  recommendations = relatedProducts.map(p => ({
    product_id: p.product_id,
    name: p.name,
    price: p.price,
    discount_price: p.discount_price,
    product_img: p.product_img,
    category: p.Category?.name || 'Unknown',
    brand: p.Brand?.name || 'Unknown',
  }));

  // Nếu không đủ gợi ý, bổ sung sản phẩm dự phòng
  if (recommendations.length < n) {
    const additionalProducts = await getFallbackProducts(n - recommendations.length, [productId, ...recommendations.map(p => p.product_id)]);
    recommendations = [...recommendations, ...additionalProducts];
  }

  // Đảm bảo ít nhất 1 sản phẩm
  if (!recommendations.length) {
    const fallbackProducts = await getFallbackProducts(1, [productId]);
    recommendations = fallbackProducts;
  }

  return recommendations;
};

// Tạo gợi ý dựa trên độ phổ biến (luôn trả về đúng 4 sản phẩm)
const getPopularityBasedRecommendations = async (excludeProductIds = []) => {
  const n = 4; // Luôn trả về 4 sản phẩm
  let recommendations = [];

  // Lấy sản phẩm phổ biến dựa trên số lượt xem (views)
  const popularProducts = await Product.findAll({
    where: {
      product_id: { [Op.notIn]: excludeProductIds },
    },
    attributes: ['product_id', 'name', 'price', 'discount_price', 'product_img', 'views'],
    include: [
      { model: Category, attributes: ['name'] },
      { model: Brand, attributes: ['name'] },
    ],
    order: [['views', 'DESC']], // Sắp xếp theo lượt xem giảm dần
    limit: n,
  });

  recommendations = popularProducts.map(p => ({
    product_id: p.product_id,
    name: p.name,
    price: p.price,
    discount_price: p.discount_price,
    product_img: p.product_img,
    category: p.Category?.name || 'Unknown',
    brand: p.Brand?.name || 'Unknown',
  }));

  // Nếu không đủ 4 sản phẩm, bổ sung sản phẩm dự phòng
  if (recommendations.length < n) {
    const additionalProducts = await getFallbackProducts(
      n - recommendations.length,
      [...excludeProductIds, ...recommendations.map(p => p.product_id)]
    );
    recommendations = [...recommendations, ...additionalProducts];
  }

  // Đảm bảo luôn có đúng 4 sản phẩm
  if (recommendations.length < n) {
    const finalFallback = await getFallbackProducts(
      n - recommendations.length,
      [...excludeProductIds, ...recommendations.map(p => p.product_id)]
    );
    recommendations = [...recommendations, ...finalFallback].slice(0, n);
  }

  return recommendations.slice(0, n); // Cắt lại để đảm bảo đúng 4 sản phẩm
};

// Controller cho Collaborative Filtering
const getCollaborativeRecommendationsController = async (req, res) => {
  try {
    const { username } = req.params;
    let recommendations = [];

    if (username) {
      const user = await User.findOne({ where: { username } });
      if (!user) {
        return res.status(404).json({
          errCode: 1,
          message: 'User not found',
          product: null,
        });
      }
      recommendations = await getCollaborativeRecommendations(user.user_id, 5);
    } else {
      // Nếu không có username, trả về gợi ý mặc định
      recommendations = await getCollaborativeRecommendations(null, 5);
    }

    return res.status(200).json({
      errCode: 0,
      message: 'Success',
      product: recommendations,
    });
  } catch (error) {
    console.error('Error in getCollaborativeRecommendationsController:', error.message);
    return res.status(500).json({
      errCode: 1,
      message: error.message || 'Internal server error',
      product: null,
    });
  }
};

// Controller cho gợi ý dựa trên sản phẩm
const getProductBasedRecommendationsController = async (req, res) => {
  try {
    const { productId } = req.params;
    const productExists = await Product.findByPk(productId);
    if (!productExists) {
      return res.status(404).json({
        errCode: 1,
        message: 'Product not found',
        product: null,
      });
    }

    const recommendations = await getProductBasedRecommendations(productId, 5);
    return res.status(200).json({
      errCode: 0,
      message: 'Success',
      product: recommendations,
    });
  } catch (error) {
    console.error('Error in getProductBasedRecommendationsController:', error.message);
    return res.status(500).json({
      errCode: 1,
      message: error.message || 'Internal server error',
      product: null,
    });
  }
};

// Controller cho gợi ý dựa trên độ phổ biến
const getPopularityBasedRecommendationsController = async (req, res) => {
  try {
    const { excludeProductIds } = req.query; // Lấy danh sách product IDs cần loại trừ từ query
    const excludeIds = excludeProductIds
      ? excludeProductIds.split(',').map(Number).filter(id => !isNaN(id))
      : [];

    const recommendations = await getPopularityBasedRecommendations(excludeIds);
    return res.status(200).json({
      errCode: 0,
      message: 'Success',
      product: recommendations,
    });
  } catch (error) {
    console.error('Error in getPopularityBasedRecommendationsController:', error.message);
    return res.status(500).json({
      errCode: 1,
      message: error.message || 'Internal server error',
      product: null,
    });
  }
};

export {
  getCollaborativeRecommendationsController,
  getProductBasedRecommendationsController,
  getPopularityBasedRecommendationsController
};