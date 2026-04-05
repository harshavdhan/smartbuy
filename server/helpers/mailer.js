const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

const ORDER_STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  inProcess: "In Process",
  inShipping: "In Shipping",
  delivered: "Delivered",
  rejected: "Rejected",
};

const ORDER_STATUS_MESSAGES = {
  pending: {
    headline: "We're preparing your order",
    summary:
      "We've received your order and our team is reviewing it before the next step.",
    detail:
      "You'll receive another update as soon as your order moves forward.",
  },
  confirmed: {
    headline: "Your order has been confirmed",
    summary:
      "Good news. Your payment was successful and your order is now confirmed.",
    detail:
      "We're getting everything ready for processing and shipment.",
  },
  inProcess: {
    headline: "Your order is being processed",
    summary:
      "Our team is currently packing and preparing your items for dispatch.",
    detail:
      "We'll notify you again once your order has been shipped.",
  },
  inShipping: {
    headline: "Your order is on the way",
    summary:
      "Your package has been shipped and is now on its way to your delivery address.",
    detail:
      "Please keep an eye on your phone and email for delivery updates.",
  },
  delivered: {
    headline: "Your order has been delivered",
    summary:
      "Your order has been delivered successfully. We hope you enjoy your purchase.",
    detail:
      "If you need any help with your order, our support team is here for you.",
  },
  rejected: {
    headline: "Your order update",
    summary:
      "We're sorry, but your order could not be completed and has been marked as rejected.",
    detail:
      "If you have any questions, please contact support for more information.",
  },
};

let transporter;
const SMARTBUY_LOGO_PATH = path.resolve(
  __dirname,
  "..",
  "..",
  "client",
  "src",
  "assets",
  "logo.png"
);
const SMARTBUY_LOGO_CID = "smartbuy-logo";

function getOrderStatusLabel(orderStatus = "") {
  return ORDER_STATUS_LABELS[orderStatus] || orderStatus;
}

function getMailTransportConfig() {
  const {
    MAIL_SERVICE,
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASS,
  } = process.env;

  if (!SMTP_USER || !SMTP_PASS || (!MAIL_SERVICE && !SMTP_HOST)) {
    return null;
  }

  const config = {
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  };

  if (MAIL_SERVICE) {
    config.service = MAIL_SERVICE;
  } else {
    config.host = SMTP_HOST;
    config.port = Number(SMTP_PORT) || 587;
    config.secure = SMTP_SECURE === "true" || Number(SMTP_PORT) === 465;
  }

  return config;
}

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  const transportConfig = getMailTransportConfig();

  if (!transportConfig) {
    return null;
  }

  transporter = nodemailer.createTransport(transportConfig);
  return transporter;
}

function getOrderStatusMessage(orderStatus) {
  return (
    ORDER_STATUS_MESSAGES[orderStatus] || {
      headline: "Your order status has been updated",
      summary: `Your order status is now ${getOrderStatusLabel(orderStatus)}.`,
      detail: "Thank you for shopping with SmartBuy.",
    }
  );
}

function buildProductLines(cartItems = []) {
  return cartItems.length
    ? cartItems
      .map((item) => {
        const details = [];

        if (item?.size) {
          details.push(`Size: ${item.size}`);
        }

        if (item?.quantity) {
          details.push(`Quantity: ${item.quantity}`);
        }

        const detailsText = details.length ? ` (${details.join(", ")})` : "";

        return `- ${item?.title || "Product"}${detailsText}`;
      })
      .join("\n")
    : "- Product details unavailable";
}

function buildProductListHtml(cartItems = []) {
  return cartItems.length
    ? cartItems
      .map((item) => {
        const details = [];

        if (item?.size) {
          details.push(`Size: ${item.size}`);
        }

        if (item?.quantity) {
          details.push(`Quantity: ${item.quantity}`);
        }

        const detailsText = details.length ? ` (${details.join(", ")})` : "";

        return `<li style="margin: 0 0 8px; color: #374151;">${item?.title || "Product"
          }${detailsText}</li>`;
      })
      .join("")
    : '<li style="margin: 0; color: #374151;">Product details unavailable</li>';
}

async function sendOrderEmail({
  to,
  userName,
  orderId,
  subject,
  preheader = "Order notification",
  headline,
  summary,
  detail,
  currentStatusLabel,
  cartItems = [],
}) {
  const activeTransporter = getTransporter();

  if (!activeTransporter) {
    return {
      sent: false,
      reason:
        "Email not sent because SMTP is not configured. Add mail settings in server/.env.",
    };
  }

  const customerName = userName || "User";
  const fromName = process.env.MAIL_FROM_NAME || "SmartBuy";
  const fromEmail = process.env.MAIL_FROM_EMAIL || process.env.SMTP_USER;
  const productLines = buildProductLines(cartItems);
  const productListHtml = buildProductListHtml(cartItems);
  const hasLogo = fs.existsSync(SMARTBUY_LOGO_PATH);
  const logoSectionHtml = hasLogo
    ? `<img src="cid:${SMARTBUY_LOGO_CID}" alt="SmartBuy" style="display: block; max-width: 180px; height: auto;" />`
    : '<div style="font-size: 24px; font-weight: 700; letter-spacing: 0.4px;">SmartBuy</div>';

  await activeTransporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject,
    attachments: hasLogo
      ? [
          {
            filename: "smartbuy-logo.png",
            path: SMARTBUY_LOGO_PATH,
            cid: SMARTBUY_LOGO_CID,
          },
        ]
      : [],
    text: `Hello ${customerName},

${headline}

Order ID: ${orderId}
Current status: ${currentStatusLabel}
Products:
${productLines}

${summary}
${detail}

Thank you for shopping with SmartBuy.`,
    html: `
      <div style="background-color: #f3f4f6; padding: 32px 16px; font-family: Arial, sans-serif; color: #111827;">
        <div style="max-width: 640px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden;">
          <div style="background-color: #111827; padding: 24px 32px; color: #ffffff;">
            ${logoSectionHtml}
            <div style="margin-top: 8px; font-size: 14px; color: #d1d5db;">${preheader}</div>
          </div>
          <div style="padding: 32px;">
            <p style="margin: 0 0 16px; font-size: 16px;">Hello ${customerName},</p>
            <h2 style="margin: 0 0 12px; font-size: 24px; color: #111827;">${headline}</h2>
            <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.7; color: #4b5563;">${summary}</p>

            <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; background-color: #f9fafb; margin-bottom: 24px;">
              <div style="margin-bottom: 10px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280;">Order details</div>
              <div style="margin-bottom: 8px; font-size: 15px;"><strong>Order ID:</strong> ${orderId}</div>
              <div style="margin-bottom: 12px; font-size: 15px;"><strong>Current status:</strong> ${currentStatusLabel}</div>
              <div style="margin-bottom: 8px; font-size: 15px;"><strong>Products:</strong></div>
              <ul style="margin: 0; padding-left: 20px; font-size: 15px;">
                ${productListHtml}
              </ul>
            </div>

            <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.7; color: #4b5563;">${detail}</p>
            <p style="margin: 0; font-size: 15px;">Thank you for shopping with <strong>SmartBuy</strong>.</p>
          </div>
        </div>
      </div>
    `,
  });

  return {
    sent: true,
    reason: `Email sent to ${to}`,
  };
}

async function sendOrderStatusUpdateEmail({
  to,
  userName,
  orderId,
  orderStatus,
  cartItems = [],
}) {
  const prettyStatus = getOrderStatusLabel(orderStatus);
  const { headline, summary, detail } = getOrderStatusMessage(orderStatus);
  return sendOrderEmail({
    to,
    userName,
    orderId,
    subject: `SmartBuy order update: ${prettyStatus}`,
    preheader: "Order status notification",
    headline,
    summary,
    detail,
    currentStatusLabel: prettyStatus,
    cartItems,
  });
}

async function sendOrderPlacedEmail({
  to,
  userName,
  orderId,
  orderStatus = "confirmed",
  cartItems = [],
}) {
  const prettyStatus = getOrderStatusLabel(orderStatus);

  return {
    ...(await sendOrderEmail({
      to,
      userName,
      orderId,
      subject: "SmartBuy order confirmation",
      preheader: "Your order has been placed successfully",
      headline: "Your order has been placed successfully",
      summary:
        "Thank you for shopping with SmartBuy. We've received your order and your payment has been confirmed.",
      detail:
        "Our team is now preparing your items for shipment. We'll email you again as soon as your order is dispatched.",
      currentStatusLabel: prettyStatus,
      cartItems,
    })),
  };
}

module.exports = {
  getOrderStatusLabel,
  sendOrderPlacedEmail,
  sendOrderStatusUpdateEmail,
};
