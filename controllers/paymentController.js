const stripe = require("stripe")(process.env.STRIPE_API_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_ENDPOINT_SECRET;
async function createCheckoutSession(req, res) {
  const { order_id, items } = req.body;
  console.log(stripe);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "cad",
          product_data: {
            name: "QuickCart Order",
          },
          unit_amount: 1999,
        },
        quantity: 1,
      },
    ],
    success_url: "http://localhost:5173/payment-success", //check for payment status might need checkout id
    cancel_url: "http://localhost:5173/cart",
  });
  res.json({ url: session.url });
}

async function handleWebhook(req, res) {
  let event;
  if (endpointSecret) {
    // Get the signature sent by Stripe
    const signature = req.headers["stripe-signature"];
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        endpointSecret,
      );
      console.log(event);
    } catch (err) {
      req.log.warn({ err }, `⚠️ Webhook signature verification failed.`);
      return res.sendStatus(400);
    }

    // Handle the event
    switch (event.type) {
      case "payment_intent.created":
        req.log.info("Payment Intent Created");
        break;
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        req.log.info("Order is paid");
        //mark the order as paid
        // add this event to a db
        break;
      case "payment_method.attached":
        const paymentMethod = event.data.object;
        // Then define and call a method to handle the successful attachment of a PaymentMethod.
        // handlePaymentMethodAttached(paymentMethod);
        break;
      // ... handle other event types
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  }

  // Return a response to acknowledge receipt of the event
  res.json({ received: true });
}

module.exports = { createCheckoutSession, handleWebhook };
