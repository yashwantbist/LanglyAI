// routes/striperoutes.js
import express from "express";
import Stripe from "stripe";
import User from "../models/User.js";
import Subscription from "../models/Subscription.js";
import Plan from "../models/Plan.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

//  helper: avoid Invalid Date
const toDate = (unixSeconds) => {
  const n = Number(unixSeconds);
  return Number.isFinite(n) ? new Date(n * 1000) : undefined;
};

//  1) SYNC (must be BEFORE "/:userId")
router.get("/sync", async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id) return res.status(400).json({ message: "Missing session_id" });

    const session = await stripe.checkout.sessions.retrieve(session_id);

    // If not a subscription checkout session or not completed yet
    if (!session?.subscription) {
      return res.status(400).json({
        message: "No subscription found in session",
        mode: session?.mode,
        payment_status: session?.payment_status,
      });
    }

    const sub = await stripe.subscriptions.retrieve(session.subscription);

    // debug (optional)
    // console.log("SYNC SUB:", sub.id, sub.status, sub.current_period_start, sub.current_period_end);

    const update = {
      stripeSubscriptionId: session.subscription,
      status: sub.status || "active",
      plan: session.metadata?.planName || "FREE",
      cancelAtPeriodEnd: !!sub.cancel_at_period_end,
    };

    const start = toDate(sub.current_period_start);
    const end = toDate(sub.current_period_end);
    if (start) update.currentPeriodStart = start;
    if (end) update.currentPeriodEnd = end;

    const updated = await Subscription.findOneAndUpdate(
      { user: session.client_reference_id }, // userId saved in Checkout session
      update,
      { upsert: true, new: true }
    );

    return res.json(updated);
  } catch (err) {
    console.error("SYNC ERROR:", err);
    return res.status(500).json({ message: "Sync failed", error: err.message });
  }
});

//  3) Create checkout session
router.post("/create-checkout-session", async (req, res) => {
  const { userId, planName } = req.body || {};
  if (!userId || !planName) {
    return res.status(400).json({ message: "Missing userId or planName" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
      });
      stripeCustomerId = customer.id;
      user.stripeCustomerId = stripeCustomerId;
      await user.save();
    }

    const plan = await Plan.findOne({ name: planName });
    if (!plan?.stripePriceId) {
      return res
        .status(404)
        .json({ message: "Plan not found or missing stripePriceId" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing`,
      client_reference_id: user._id.toString(),
      metadata: { planName },
    });

    return res.json({ url: session.url });
  } catch (err) {
    console.error("CHECKOUT ERROR:", err);
    return res.status(500).json({ message: "Stripe checkout failed", error: err.message });
  }
});


//  4) Webhook (called by Stripe, uses raw body in server.js)
router.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body, // Buffer
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("WEBHOOK SIGNATURE ERROR:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      // If for some reason subscription isn’t present, just ack
      if (!session?.subscription) return res.json({ received: true });

      const sub = await stripe.subscriptions.retrieve(session.subscription);

      const update = {
        stripeSubscriptionId: session.subscription,
        status: sub.status || "active",
        plan: session.metadata?.planName || "FREE",
        cancelAtPeriodEnd: !!sub.cancel_at_period_end,
      };

      const start = toDate(sub.current_period_start);
      const end = toDate(sub.current_period_end);
      if (start) update.currentPeriodStart = start;
      if (end) update.currentPeriodEnd = end;

      await Subscription.findOneAndUpdate(
        { user: session.client_reference_id },
        update,
        { upsert: true, new: true }
      );
    }

    return res.json({ received: true });
  } catch (err) {
    console.error("WEBHOOK PROCESS ERROR:", err);
    // Return 200 to stop Stripe retry spam due to your DB validation bugs
    return res.json({ received: true });
  }
});

router.get("/plans", async (req, res) => {
  const plans = await Plan.find().select("name stripePriceId amount billingInterval");
  res.json(plans);
});

//  2) Get subscription for dashboard
router.get("/:userId", async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ user: req.params.userId });
    if (!subscription) return res.json({ plan: "FREE", status: "inactive" });
    return res.json(subscription);
  } catch (err) {
    console.error("GET SUB ERROR:", err);
    return res.status(500).json({ message: "Failed to fetch subscription" });
  }
});



export default router;
