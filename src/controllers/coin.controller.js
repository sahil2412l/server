import { v4 as uuidv4 } from 'uuid';
import { Coin } from '../models/Coin.js';
import { CoinLog } from '../models/CoinLog.js';
import { broadcastCoinEarned } from '../sockets/socketHandler.js';

// Helper to generate unique structured coin ID
const generateUniqueCoinId = () => {
  const shortUuid = uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase();
  return `COIN_${shortUuid}`;
};

// @desc    Earn/Generate Coin(s) upon completing a task
// @route   POST /api/coins/earn
// @access  Protected
export const earnCoinsForTask = async (req, res, next) => {
  try {
    const { taskId, taskName, amount = 1, metadata = {} } = req.body;

    if (!taskId || !taskName) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both taskId and taskName',
      });
    }

    const coinCount = Math.min(Math.max(parseInt(amount, 10) || 1, 1), 50);
    const generatedCoins = [];

    for (let i = 0; i < coinCount; i++) {
      const uniqueId = generateUniqueCoinId();
      const coin = new Coin({
        coinId: uniqueId,
        user: req.user._id,
        userId: req.user.userId,
        taskId: String(taskId),
        taskName: String(taskName),
        amount: 1,
        issuedAt: new Date(),
        expiresAt: null, // No expiration limit as required
        metadata: {
          ...metadata,
          issuedToName: req.user.name,
        },
      });

      await coin.save();
      generatedCoins.push(coin);
    }

    // Broadcast live event
    broadcastCoinEarned({
      userId: req.user.userId,
      userName: req.user.name,
      taskName,
      coinsEarned: coinCount,
      coinIds: generatedCoins.map((c) => c.coinId),
    });

    res.status(201).json({
      success: true,
      message: `🎉 Successfully rewarded ${coinCount} coin(s) for task: ${taskName}!`,
      totalIssued: coinCount,
      coins: generatedCoins.map((c) => ({
        coinId: c.coinId,
        taskId: c.taskId,
        taskName: c.taskName,
        issuedAt: c.issuedAt,
        expiresAt: 'No Expiry (Lifetime)',
      })),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all active available coins for the logged-in user
// @route   GET /api/coins/my-coins
// @access  Protected
export const getMyCoins = async (req, res, next) => {
  try {
    const coins = await Coin.find({ user: req.user._id }).sort({ issuedAt: -1 });

    res.status(200).json({
      success: true,
      balance: coins.length,
      coins: coins.map((c) => ({
        coinId: c.coinId,
        taskId: c.taskId,
        taskName: c.taskName,
        issuedAt: c.issuedAt,
        expiresAt: 'No Expiration Limit',
      })),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify if a Coin ID exists and is valid
// @route   GET /api/coins/verify/:coinId
// @access  Protected
export const verifyCoin = async (req, res, next) => {
  try {
    const { coinId } = req.params;

    const coin = await Coin.findOne({
      coinId: coinId.trim().toUpperCase(),
      user: req.user._id,
    });

    if (!coin) {
      return res.status(404).json({
        success: false,
        isValid: false,
        error: 'Invalid Coin ID or Coin has already been used and removed.',
      });
    }

    res.status(200).json({
      success: true,
      isValid: true,
      coin: {
        coinId: coin.coinId,
        taskId: coin.taskId,
        taskName: coin.taskName,
        issuedAt: coin.issuedAt,
        expiresAt: 'No Expiration Limit',
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Coin ID, Redeem/Use it, and REMOVE it from active database
// @route   POST /api/coins/verify-and-use
// @access  Protected
export const verifyAndUseCoin = async (req, res, next) => {
  try {
    const { coinId, purpose = 'Redemption' } = req.body;

    if (!coinId) {
      return res.status(400).json({
        success: false,
        error: 'Please provide the coinId to use',
      });
    }

    const formattedCoinId = coinId.trim().toUpperCase();

    // 1. Match & Verify the Coin in Database
    const existingCoin = await Coin.findOne({
      coinId: formattedCoinId,
      user: req.user._id,
    });

    if (!existingCoin) {
      return res.status(400).json({
        success: false,
        error: `Verification Failed: Coin '${formattedCoinId}' does not exist, belongs to another user, or has already been used and removed!`,
      });
    }

    // 2. Archive to historical CoinLog for audit trail
    const auditLog = new CoinLog({
      coinId: existingCoin.coinId,
      user: existingCoin.user,
      userId: existingCoin.userId,
      taskId: existingCoin.taskId,
      taskName: existingCoin.taskName,
      amount: existingCoin.amount,
      issuedAt: existingCoin.issuedAt,
      redeemedAt: new Date(),
      redeemedPurpose: purpose,
      metadata: existingCoin.metadata,
    });
    await auditLog.save();

    // 3. Remove/Delete the active coin record from Database to prevent any reuse
    await Coin.findByIdAndDelete(existingCoin._id);

    // 4. Calculate remaining balance
    const remainingBalance = await Coin.countDocuments({ user: req.user._id });

    res.status(200).json({
      success: true,
      message: `✅ Coin '${formattedCoinId}' successfully verified and consumed! Active record removed.`,
      usedCoin: {
        coinId: formattedCoinId,
        taskName: existingCoin.taskName,
        purpose,
        redeemedAt: auditLog.redeemedAt,
      },
      remainingCoinBalance: remainingBalance,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get redemption / audit history for logged in user
// @route   GET /api/coins/history
// @access  Protected
export const getCoinHistory = async (req, res, next) => {
  try {
    const logs = await CoinLog.find({ user: req.user._id }).sort({ redeemedAt: -1 });

    res.status(200).json({
      success: true,
      totalRedeemed: logs.length,
      history: logs,
    });
  } catch (error) {
    next(error);
  }
};
