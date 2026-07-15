import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import Stripe from "stripe";

import User from "../models/User.js";
import Subscription from "../models/Subscription.js";
import Plan from "../models/Plan.js";

const router = express.Router();

const ACTIVE_STATUSES = new Set(["active", "trialing"]);

const requireEnv = (name) => {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}`,
    );
  }

  return value;
};

const stripeSecretKey = requireEnv(
  "STRIPE_SECRET_KEY",
);

const stripeWebhookSecret = requireEnv(
  "STRIPE_WEBHOOK_SECRET",
);

const stripe = new Stripe(stripeSecretKey);

const isLiveStripeKey = () =>
  stripeSecretKey.startsWith("sk_live_") ||
  stripeSecretKey.startsWith("rk_live_");

const normalizePlanName = (planName) =>
  String(planName || "FREE")
    .trim()
    .toUpperCase();

const getFrontendUrl = () => {
  const frontendUrl = requireEnv(
    "FRONTEND_URL",
  ).replace(/\/+$/, "");

  if (
    process.env.NODE_ENV === "production" &&
    /localhost|127\.0\.0\.1/i.test(frontendUrl)
  ) {
    throw new Error(
      `Invalid production FRONTEND_URL: ${frontendUrl}`,
    );
  }

  return frontendUrl;
};

const toDate = (unixSeconds) => {
  const value = Number(unixSeconds);

  return Number.isFinite(value)
    ? new Date(value * 1000)
    : undefined;
};

const getSubscriptionPeriod = (
  subscription,
) => {
  const firstItem =
    subscription?.items?.data?.[0];

  const startTimestamp =
    firstItem?.current_period_start ??
    subscription?.current_period_start;

  const endTimestamp =
    firstItem?.current_period_end ??
    subscription?.current_period_end;

  return {
    currentPeriodStart:
      toDate(startTimestamp),
    currentPeriodEnd:
      toDate(endTimestamp),
  };
};

const findUserIdForSubscription = async ({
  subscription,
  session,
}) => {
  const metadataUserId =
    session?.client_reference_id ||
    session?.metadata?.userId ||
    subscription?.metadata?.userId;

  if (
    metadataUserId &&
    mongoose.Types.ObjectId.isValid(
      metadataUserId,
    )
  ) {
    return metadataUserId;
  }

  const customerId =
    typeof subscription?.customer === "string"
      ? subscription.customer
      : subscription?.customer?.id;

  if (customerId) {
    const user = await User.findOne({
      stripeCustomerId: customerId,
    }).select("_id");

    if (user) {
      return user._id.toString();
    }
  }

  if (subscription?.id) {
    const storedSubscription =
      await Subscription.findOne({
        stripeSubscriptionId:
          subscription.id,
      }).select("user");

    if (storedSubscription?.user) {
      return storedSubscription.user.toString();
    }
  }

  return null;
};

const saveSubscription = async ({
  subscription,
  session,
}) => {
  const userId =
    await findUserIdForSubscription({
      subscription,
      session,
    });

  if (!userId) {
    throw new Error(
      `Unable to find user for Stripe subscription ${subscription.id}`,
    );
  }

  const status =
    subscription.status || "inactive";

  const purchasedPlan =
    normalizePlanName(
      session?.metadata?.planName ||
        subscription?.metadata?.planName,
    );

  const hasAccess =
    ACTIVE_STATUSES.has(status);

  const {
    currentPeriodStart,
    currentPeriodEnd,
  } = getSubscriptionPeriod(subscription);

  const update = {
    stripeSubscriptionId:
      subscription.id,
    status,
    plan: hasAccess
      ? purchasedPlan
      : "FREE",
    cancelAtPeriodEnd: Boolean(
      subscription.cancel_at_period_end,
    ),
  };

  if (currentPeriodStart) {
    update.currentPeriodStart =
      currentPeriodStart;
  }

  if (currentPeriodEnd) {
    update.currentPeriodEnd =
      currentPeriodEnd;
  }

  return Subscription.findOneAndUpdate(
    { user: userId },
    {
      $set: update,
      $setOnInsert: {
        user: userId,
      },
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );
};

const getOrCreateStripeCustomer =
  async (user) => {
    let customerId =
      user.stripeCustomerId;

    
    if (customerId) {
      try {
        const customer =
          await stripe.customers.retrieve(
            customerId,
          );

        if (customer.deleted) {
          customerId = null;
        }
      } catch (error) {
        if (
          error?.code ===
          "resource_missing"
        ) {
          customerId = null;
        } else {
          throw error;
        }
      }
    }

    if (!customerId) {
      const customer =
        await stripe.customers.create({
          email: user.email,
          name: user.name || undefined,
          metadata: {
            userId:
              user._id.toString(),
          },
        });

      customerId = customer.id;

      user.stripeCustomerId =
        customerId;

      await user.save();
    }

    return customerId;
  };

export const stripeWebhook = async (
  req,
  res,
) => {
  const signature =
    req.headers["stripe-signature"];

  if (!signature) {
    return res
      .status(400)
      .send(
        "Missing Stripe-Signature header",
      );
  }

  let event;

  try {
    event =
      stripe.webhooks.constructEvent(
        req.body,
        signature,
        stripeWebhookSecret,
      );
  } catch (error) {
    console.error(
      "Stripe webhook signature error:",
      error.message,
    );

    return res
      .status(400)
      .send(
        `Webhook Error: ${error.message}`,
      );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session =
          event.data.object;

        if (
          session.mode !==
            "subscription" ||
          !session.subscription
        ) {
          break;
        }

        const subscription =
          await stripe.subscriptions.retrieve(
            session.subscription,
          );

        await saveSubscription({
          subscription,
          session,
        });

        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription =
          event.data.object;

        await saveSubscription({
          subscription,
        });

        break;
      }

      default:
        console.log(
          `Ignored Stripe event: ${event.type}`,
        );
    }

    return res.json({
      received: true,
    });
  } catch (error) {
    console.error(
      `Stripe webhook processing failed for ${event.id}:`,
      error,
    );

    /*
     * Return 500 so Stripe retries the event.
     */
    return res.status(500).json({
      received: false,
      message:
        "Webhook processing failed",
    });
  }
};


router.get("/sync", async (req, res) => {
  const sessionId = String(
    req.query?.session_id || "",
  ).trim();

  if (!sessionId) {
    return res.status(400).json({
      message: "Missing session_id",
    });
  }

  try {
    const session =
      await stripe.checkout.sessions.retrieve(
        sessionId,
      );

    if (
      session.mode !== "subscription" ||
      session.status !== "complete" ||
      !session.subscription
    ) {
      return res.status(400).json({
        message:
          "Checkout did not complete a subscription",
        mode: session.mode,
        status: session.status,
        paymentStatus:
          session.payment_status,
      });
    }

    const subscription =
      await stripe.subscriptions.retrieve(
        session.subscription,
      );

    const updated =
      await saveSubscription({
        subscription,
        session,
      });

    return res.json(updated);
  } catch (error) {
    console.error(
      "Stripe sync error:",
      error,
    );

    return res.status(500).json({
      message:
        "Subscription synchronization failed",
      error:
        process.env.NODE_ENV ===
        "production"
          ? undefined
          : error.message,
    });
  }
});

/*
 * Create Stripe Checkout Session.
 */
router.post(
  "/create-checkout-session",
  async (req, res) => {
    const userId = String(
      req.body?.userId || "",
    ).trim();

    const planName =
      normalizePlanName(
        req.body?.planName,
      );

    if (
      !mongoose.Types.ObjectId.isValid(
        userId,
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid or missing userId",
      });
    }

    if (
      !["A1", "A2", "B1", "B2"].includes(
        planName,
      )
    ) {
      return res.status(400).json({
        message: "Invalid planName",
      });
    }

    try {
      const [user, plan] =
        await Promise.all([
          User.findById(userId),

          Plan.findOne({
            name: planName,
          }),
        ]);

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      if (!plan?.stripePriceId) {
        return res.status(404).json({
          message:
            "Plan not found or Stripe Price ID is missing",
        });
      }

      
      const stripePrice =
        await stripe.prices.retrieve(
          plan.stripePriceId,
        );

      if (
        stripePrice.livemode !==
        isLiveStripeKey()
      ) {
        throw new Error(
          `Stripe Price ${
            plan.stripePriceId
          } is ${
            stripePrice.livemode
              ? "live"
              : "test"
          }, but the server key is ${
            isLiveStripeKey()
              ? "live"
              : "test"
          }`,
        );
      }

      if (
        stripePrice.type !== "recurring"
      ) {
        throw new Error(
          `Stripe Price ${plan.stripePriceId} is not recurring`,
        );
      }

      const customerId =
        await getOrCreateStripeCustomer(
          user,
        );

      const frontendUrl =
        getFrontendUrl();

      const successUrl =
        `${frontendUrl}/dashboard` +
        "?session_id={CHECKOUT_SESSION_ID}";

      const cancelUrl =
        `${frontendUrl}/pricing`;

      console.log(
        "Creating Stripe Checkout:",
        {
          stripeMode:
            isLiveStripeKey()
              ? "live"
              : "test",
          frontendUrl,
          successUrl,
          cancelUrl,
          planName,
          userId:
            user._id.toString(),
        },
      );

      const session =
        await stripe.checkout.sessions.create(
          {
            mode: "subscription",
            customer: customerId,

            line_items: [
              {
                price:
                  plan.stripePriceId,
                quantity: 1,
              },
            ],

            success_url: successUrl,
            cancel_url: cancelUrl,

            client_reference_id:
              user._id.toString(),

            metadata: {
              userId:
                user._id.toString(),
              planName,
            },

            subscription_data: {
              metadata: {
                userId:
                  user._id.toString(),
                planName,
              },
            },

            allow_promotion_codes: true,
          },
        );

      return res.status(201).json({
        url: session.url,
        sessionId: session.id,
        mode: session.livemode
          ? "live"
          : "test",
      });
    } catch (error) {
      console.error(
        "Stripe Checkout error:",
        error,
      );

      return res.status(500).json({
        message:
          "Stripe Checkout failed",
        error:
          process.env.NODE_ENV ===
          "production"
            ? undefined
            : error.message,
      });
    }
  },
);

router.get("/plans", async (req, res) => {
  try {
    const plans = await Plan.find()
      .select(
        "name stripePriceId amount billingInterval",
      )
      .sort({ amount: 1 });

    return res.json(plans);
  } catch (error) {
    console.error(
      "Get plans error:",
      error,
    );

    return res.status(500).json({
      message:
        "Failed to retrieve plans",
    });
  }
});

router.get("/:userId", async (req, res) => {
  if (
    !mongoose.Types.ObjectId.isValid(
      req.params.userId,
    )
  ) {
    return res.status(400).json({
      message: "Invalid userId",
    });
  }

  try {
    const subscription =
      await Subscription.findOne({
        user: req.params.userId,
      });

    if (!subscription) {
      return res.json({
        plan: "FREE",
        status: "inactive",
        cancelAtPeriodEnd: false,
      });
    }

    const result =
      subscription.toObject();

    if (
      !ACTIVE_STATUSES.has(
        subscription.status,
      )
    ) {
      result.plan = "FREE";
    }

    return res.json(result);
  } catch (error) {
    console.error(
      "Get subscription error:",
      error,
    );

    return res.status(500).json({
      message:
        "Failed to fetch subscription",
    });
  }
});

export default router;