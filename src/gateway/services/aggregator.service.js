import { internalClient } from './internalClient.service.js';
import { circuitRegistry } from '../resilience/circuitRegistry.js';
import { User } from '../../models/User.js';
import { Coin } from '../../models/Coin.js';
import { CoinLog } from '../../models/CoinLog.js';
import { Feedback } from '../../models/Feedback.js';

export const aggregatorService = {
  /**
   * Mobile BFF Aggregation: Dashboard Overview
   * Compresses multiple domain queries into a single lightweight mobile payload
   */
  async aggregateMobileDashboard(user, tenant) {
    const startTime = Date.now();
    const degradedServices = [];

    // Parallel fetch with Promise.allSettled for fault tolerance
    const [profileResult, coinsResult, feedResult, perfResult] = await Promise.allSettled([
      internalClient.getUserProfile(user.userId),
      internalClient.getUserCoins(user.userId, tenant?.id),
      internalClient.getFeed({ limit: 5, tenantId: tenant?.id }),
      internalClient.getLatestPerformance(user.userId),
    ]);

    // Profile handling
    let profile = null;
    if (profileResult.status === 'fulfilled' && !profileResult.value.degraded) {
      profile = {
        userId: profileResult.value.userId,
        name: profileResult.value.name,
        avatar: profileResult.value.avatar,
        role: profileResult.value.role,
      };
    } else {
      degradedServices.push('authService');
      profile = {
        userId: user.userId,
        name: user.name || user.userId,
        avatar: user.avatar || '👤',
        role: user.role || 'user',
      };
    }

    // Coins handling
    let coinsData = { balance: 0, count: 0, latestCoins: [] };
    if (coinsResult.status === 'fulfilled' && !coinsResult.value.degraded) {
      coinsData = {
        balance: coinsResult.value.balance,
        count: coinsResult.value.coins.length,
        // Send only first 3 coins to reduce mobile payload
        latestCoins: coinsResult.value.coins.slice(0, 3).map((c) => ({
          coinId: c.coinId,
          taskName: c.taskName,
          amount: c.amount,
        })),
      };
    } else {
      degradedServices.push('coinService');
      coinsData = { balance: 0, count: 0, latestCoins: [], warning: 'Temporarily unavailable' };
    }

    // Feed handling
    let feedItems = [];
    if (feedResult.status === 'fulfilled' && !feedResult.value.degraded) {
      feedItems = (feedResult.value || []).slice(0, 3).map((item) => ({
        id: item._id,
        type: item.type,
        author: item.authorName,
        content: item.content || null,
        rating: item.rating || null,
        target: item.targetItem,
      }));
    } else {
      degradedServices.push('feedbackService');
    }

    // Performance handling
    let performance = { score: 0, speed: 'Normal' };
    if (perfResult.status === 'fulfilled' && !perfResult.value.degraded) {
      performance = {
        score: perfResult.value.score || 0,
        accuracy: perfResult.value.accuracy || 0,
        speed: perfResult.value.speed || 'Normal',
      };
    } else {
      degradedServices.push('performanceService');
    }

    const durationMs = Date.now() - startTime;

    return {
      success: true,
      data: {
        profile,
        wallet: coinsData,
        recentActivity: feedItems,
        performance,
      },
      meta: {
        deviceTarget: 'mobile',
        tenantId: tenant?.id || 'tenant-default',
        tenantTier: tenant?.tier || 'standard',
        degraded: degradedServices.length > 0,
        degradedServices,
        aggregationDurationMs: durationMs,
        timestamp: new Date().toISOString(),
      },
    };
  },

  /**
   * Web BFF Aggregation: Full Portal Overview
   * Delivers comprehensive rich payload with full history and detailed analytics
   */
  async aggregateWebOverview(user, tenant) {
    const startTime = Date.now();
    const degradedServices = [];

    const [profileResult, coinsResult, historyResult, feedResult, perfResult] =
      await Promise.allSettled([
        internalClient.getUserProfile(user.userId),
        internalClient.getUserCoins(user.userId, tenant?.id),
        internalClient.getCoinHistory(user.userId, 20, tenant?.id),
        internalClient.getFeed({ limit: 20, tenantId: tenant?.id }),
        internalClient.getLatestPerformance(user.userId),
      ]);

    const profile =
      profileResult.status === 'fulfilled' && !profileResult.value.degraded
        ? profileResult.value
        : { ...user, degraded: true };
    if (profileResult.status !== 'fulfilled' || profileResult.value.degraded) {
      degradedServices.push('authService');
    }

    const wallet =
      coinsResult.status === 'fulfilled' && !coinsResult.value.degraded
        ? coinsResult.value
        : { balance: 0, coins: [], degraded: true };
    if (coinsResult.status !== 'fulfilled' || coinsResult.value.degraded) {
      degradedServices.push('coinService');
    }

    const history =
      historyResult.status === 'fulfilled' && !historyResult.value.degraded
        ? historyResult.value
        : [];
    if (historyResult.status !== 'fulfilled' || historyResult.value.degraded) {
      degradedServices.push('coinHistoryService');
    }

    const feed =
      feedResult.status === 'fulfilled' && !feedResult.value.degraded
        ? feedResult.value
        : [];
    if (feedResult.status !== 'fulfilled' || feedResult.value.degraded) {
      degradedServices.push('feedbackService');
    }

    const performance =
      perfResult.status === 'fulfilled' && !perfResult.value.degraded
        ? perfResult.value
        : { score: 0, speed: 'Normal', degraded: true };
    if (perfResult.status !== 'fulfilled' || perfResult.value.degraded) {
      degradedServices.push('performanceService');
    }

    const durationMs = Date.now() - startTime;

    return {
      success: true,
      data: {
        user: profile,
        wallet,
        redemptionHistory: history,
        feed,
        performance,
        tenantQuota: {
          tier: tenant?.tier || 'standard',
          features: tenant?.features || [],
          rateLimit: tenant?.rateLimit || {},
        },
      },
      meta: {
        deviceTarget: 'web',
        tenantId: tenant?.id || 'tenant-default',
        tenantTier: tenant?.tier || 'standard',
        degraded: degradedServices.length > 0,
        degradedServices,
        aggregationDurationMs: durationMs,
        timestamp: new Date().toISOString(),
      },
    };
  },

  /**
   * Admin BFF Aggregation: Tenant Operations Summary
   * Delivers organizational tenant statistics, system health, and resilience telemetry
   */
  async aggregateAdminTenantSummary(tenant) {
    const startTime = Date.now();
    const tenantId = tenant?.id || 'tenant-default';

    const [totalUsers, activeCoins, totalRedeemed, totalFeed] = await Promise.all([
      User.countDocuments({}),
      Coin.countDocuments({ tenantId }),
      CoinLog.countDocuments({ tenantId }),
      Feedback.countDocuments({ tenantId }),
    ]);

    const circuitBreakerHealth = circuitRegistry.getAllSnapshots();

    return {
      success: true,
      data: {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          tier: tenant.tier,
          features: tenant.features,
          rateLimits: tenant.rateLimit,
        },
        metrics: {
          totalUsers,
          activeCoinsInCirculation: activeCoins,
          totalRedemptionsLogged: totalRedeemed,
          totalFeedbackEntries: totalFeed,
        },
        resilienceStatus: circuitBreakerHealth,
      },
      meta: {
        aggregationDurationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      },
    };
  },
};

