function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials are missing");
  }

  return { keyId, keySecret };
}

async function createRazorpayOrder({ amount, currency = "INR", receipt, notes }) {
  const { keyId, keySecret } = getRazorpayCredentials();
  const authToken = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${authToken}`,
    },
    body: JSON.stringify({
      amount,
      currency,
      receipt,
      notes,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.description || "Failed to create Razorpay order");
  }

  return data;
}

module.exports = {
  createRazorpayOrder,
  getRazorpayCredentials,
};
