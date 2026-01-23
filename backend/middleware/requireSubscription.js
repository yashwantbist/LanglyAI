import Subscription from "../models/Subscription.js";

const rank = {  A1: 1, A2: 2, B1: 3, B2: 4 };

export async function requireLevelAccess(req, res, next) {
  try {
    const { userId } = req.query; // pass userId in query OR use auth session
    const level = req.params.level?.toUpperCase();

    if (!userId) return res.status(401).json({ message: "Missing userId" });

    const sub = await Subscription.findOne({ user: userId });
    const plan = sub?.plan || "FREE";
    const ok = (rank[plan] || 0) >= (rank[level] || 0);

    if (!ok) {
      return res.status(403).json({ message: "Access denied. Upgrade required.", plan });
    }

    next();
  } catch (e) {
    res.status(500).json({ message: "Subscription check failed", error: e.message });
  }
}
