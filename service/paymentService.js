require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_API_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_ENDPOINT_SECRET;
const checkout_session = require("../models/checkoutSession");
const Order = require("../models/orderModel");
const { CouldNotCompletePaymentError } = require("../errors/paymentErrors");
const { InternalServerError } = require("../utils/ExpressError");
async function createCheckoutSessionService(order_id, amount, log) {
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "cad",
          product_data: {
            name: `Payment for Order Number: ${order_id}`,
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    metadata: {
      order_id: order_id,
    },
    allow_promotion_codes: true,
    success_url: `http://localhost:5173/payment-success/{CHECKOUT_SESSION_ID}`, //check for payment status might need checkout id
    cancel_url: "http://localhost:5173/cart",
    custom_text: {
      submit: { message: "Click the button below to Pay" },
    },
  });
  let information = {
    id: session.id,
    created_at: session.created,
    amount: session.amount_total,
    order_id: order_id,
    currency: session.currency,
    status: session.payment_status,
  };
  try {
    await checkout_session.add(information);
  } catch (err) {
    log.error({ err }, "Error in checkout flow");
    throw new InternalServerError();
  }
  return session;
}

async function handleWebhook(event, log) {
  switch (event.type) {
    case "checkout.session.completed":
      try {
        const session = event.data.object;
        //mark the order as paid

        await checkout_session.update(session.id, session.payment_status);
        if (session.payment_status === "paid" && session.metadata.order_id) {
          let response = await Order.markPaymentAsComplete(
            session.metadata.order_id,
          );
          // from awaiting_payment
          if (response.rowCount === 0) {
            log.info("Nothing to update");
          } else {
            log.info("Order is paid");
          }
        }
      } catch (err) {
        log.error(err.message);
        throw new CouldNotCompletePaymentError();
      }
      // add this event to a db
      break;
  }
}

module.exports = { createCheckoutSessionService, handleWebhook };
