import { User } from '../../models/User.js';
import { Coin } from '../../models/Coin.js';
import { CoinLog } from '../../models/CoinLog.js';
import { Feedback } from '../../models/Feedback.js';
import { circuitRegistry } from '../resilience/circuitRegistry.js';

/**
 * Resilient Internal Client Service
 * Executes internal domain data queries wrapped inside service-specific circuit breakers
 */
export const internalClient = {
  /**
   * Fetch User Profile
   */
  async getUserProfile(userId) {
    const breaker = circuitRegistry.get('authService');
    return breaker.execute(async () => {
      const user = await User.findOne({
        $or: [{ userId }, { _id: userId.match(/^[0-9a-fA-F]{24}$/) ? userId : null }],
      }).select('-refreshToken');

      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      return {
        id: user._id,
        userId: user.userId,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        tenantId: user.tenantId,
        createdAt: user.createdAt,
      };
    });
  },

  /**
   * Fetch User Active Coins
   */
  async getUserCoins(userId, tenantId = null) {
    const breaker = circuitRegistry.get('coinService');
    return breaker.execute(async () => {
      const query = { userId };
      if (tenantId && tenantId !== 'all') {
        query.tenantId = tenantId;
      }

      const coins = await Coin.find(query).sort({ createdAt: -1 });
      const balance = coins.reduce((acc, curr) => acc + (curr.amount || 1), 0);

      return {
        balance,
        coins,
      };
    });
  },

  /**
   * Fetch User Coin Redemption Audit History
   */
  async getCoinHistory(userId, limit = 20, tenantId = null) {
    const breaker = circuitRegistry.get('coinService');
    return breaker.execute(async () => {
      const query = { userId };
      if (tenantId && tenantId !== 'all') {
        query.tenantId = tenantId;
      }

      const history = await CoinLog.find(query)
        .sort({ redeemedAt: -1 })
        .limit(limit);

      return history;
    });
  },

  /**
   * Fetch Feed items (Comments, Reviews, Performance)
   */
  async getFeed({ targetItem, type, limit = 10, tenantId = null } = {}) {
    const breaker = circuitRegistry.get('feedbackService');
    return breaker.execute(async () => {
      const query = {};
      if (targetItem) query.targetItem = targetItem;
      if (type) query.type = type;
      if (tenantId && tenantId !== 'all') query.tenantId = tenantId;

      const items = await Feedback.find(query)
        .sort({ createdAt: -1 })
        .limit(limit);

      return items;
    });
  },

  /**
   * Fetch Latest Performance Metrics for User
   */
  async getLatestPerformance(userId) {
    const breaker = circuitRegistry.get('feedbackService');
    return breaker.execute(async () => {
      const performance = await Feedback.findOne({
        userId,
        type: 'performance',
      }).sort({ createdAt: -1 });

      return performance ? performance.performanceMetrics : {
        score: 0,
        accuracy: 0,
        speed: 'Normal',
        tasksCompleted: 0,
        details: {},
      };
    });
  },
};

