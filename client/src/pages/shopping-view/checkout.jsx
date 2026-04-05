import Address from "@/components/shopping-view/address";
import img from "../../assets/account.jpg";
import { useDispatch, useSelector } from "react-redux";
import UserCartItemsContent from "@/components/shopping-view/cart-items-content";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  createNewOrder,
  verifyRazorpayPayment,
} from "@/store/shop/order-slice";
import { Navigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { fetchCartItems } from "@/store/shop/cart-slice";
import { formatPrice } from "@/lib/price-utils";

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
}

function ShoppingCheckout() {
  const { cartItems } = useSelector((state) => state.shopCart);
  const { user } = useSelector((state) => state.auth);
  const [currentSelectedAddress, setCurrentSelectedAddress] = useState(null);
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const dispatch = useDispatch();
  const { toast } = useToast();

  const totalCartAmount =
    cartItems && cartItems.items && cartItems.items.length > 0
      ? cartItems.items.reduce(
        (sum, currentItem) =>
          sum +
          (currentItem?.salePrice > 0
            ? currentItem?.salePrice
            : currentItem?.price) *
          currentItem?.quantity,
        0
      )
      : 0;

  async function handlePlaceOrder() {
    if (!cartItems?.items || cartItems.items.length === 0) {
      toast({
        title: "Your cart is empty. Please add items to proceed",
        variant: "destructive",
      });

      return;
    }

    if (currentSelectedAddress === null) {
      toast({
        title: "Please select one address to proceed.",
        variant: "destructive",
      });

      return;
    }

    setIsProcessingPayment(true);

    const isRazorpayLoaded = await loadRazorpayScript();

    if (!isRazorpayLoaded) {
      setIsProcessingPayment(false);
      toast({
        title: "Unable to load Razorpay checkout",
        description: "Please check your internet connection and try again.",
        variant: "destructive",
      });
      return;
    }

    const orderData = {
      userId: user?.id,
      cartId: cartItems?._id,
      cartItems: cartItems.items.map((singleCartItem) => ({
        productId: singleCartItem?.productId,
        title: singleCartItem?.title,
        image: singleCartItem?.image,
        size: singleCartItem?.size || "",
        price:
          singleCartItem?.salePrice > 0
            ? singleCartItem?.salePrice
            : singleCartItem?.price,
        quantity: singleCartItem?.quantity,
      })),
      addressInfo: {
        addressId: currentSelectedAddress?._id,
        address: currentSelectedAddress?.address,
        city: currentSelectedAddress?.city,
        pincode: currentSelectedAddress?.pincode,
        phone: currentSelectedAddress?.phone,
        notes: currentSelectedAddress?.notes,
      },
      totalAmount: totalCartAmount,
      orderDate: new Date(),
      orderUpdateDate: new Date(),
    };

    const createOrderResult = await dispatch(createNewOrder(orderData));
    const paymentOrderData = createOrderResult?.payload;

    if (!paymentOrderData?.success) {
      setIsProcessingPayment(false);
      toast({
        title: paymentOrderData?.message || "Failed to initiate payment.",
        variant: "destructive",
      });
      return;
    }

    const razorpayInstance = new window.Razorpay({
      key: paymentOrderData.keyId,
      amount: paymentOrderData.amount,
      currency: paymentOrderData.currency,
      name: "SmartBuy",
      description: "Test payment for your order",
      order_id: paymentOrderData.razorpayOrderId,
      handler: async function (response) {
        const verificationResult = await dispatch(
          verifyRazorpayPayment({
            dbOrderId: paymentOrderData.dbOrderId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          })
        );

        if (verificationResult?.payload?.success) {
          setIsOrderPlaced(true);
          dispatch(fetchCartItems(user?.id));
          toast({
            title: "Payment successful and order saved!",
          });
        } else {
          setIsProcessingPayment(false);
          toast({
            title:
              verificationResult?.payload?.message ||
              "Payment was completed but verification failed.",
            variant: "destructive",
          });
        }
      },
      modal: {
        ondismiss: function () {
          setIsProcessingPayment(false);
          toast({
            title: "Payment cancelled",
            description: "Your order was not placed.",
            variant: "destructive",
          });
        },
      },
      prefill: {
        name: user?.userName || "",
        email: user?.email || "",
        contact: currentSelectedAddress?.phone || "",
      },
      notes: {
        address: `${currentSelectedAddress?.address}, ${currentSelectedAddress?.city}`,
      },
      theme: {
        color: "#0f172a",
      },
    });

    razorpayInstance.on("payment.failed", function (response) {
      setIsProcessingPayment(false);
      toast({
        title: "Payment failed",
        description:
          response?.error?.description || "Please try the test payment again.",
        variant: "destructive",
      });
    });

    razorpayInstance.open();
  }

  if (isOrderPlaced) {
    return <Navigate to="/shop/payment-success" />;
  }

  return (
    <div className="flex flex-col">
      <div className="relative h-[300px] w-full overflow-hidden">
        <img src={img} className="h-full w-full object-cover object-center" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5 p-5">
        <Address
          selectedId={currentSelectedAddress}
          setCurrentSelectedAddress={setCurrentSelectedAddress}
        />
        <div className="flex flex-col gap-4">
          {cartItems && cartItems.items && cartItems.items.length > 0
            ? cartItems.items.map((item) => (
              <UserCartItemsContent
                key={item?.cartItemId || `${item?.productId}-${item?.size || "default"}`}
                cartItem={item}
              />
            ))
            : null}
          <div className="mt-8 space-y-4">
            <div className="flex justify-between">
              <span className="font-bold">Total</span>
              <span className="font-bold">{formatPrice(totalCartAmount)}</span>
            </div>
          </div>
          <div className="mt-4 w-full">
            <Button
              onClick={handlePlaceOrder}
              className="w-full"
              disabled={isProcessingPayment}
            >
              {isProcessingPayment ? "Opening Razorpay..." : "Pay with Razorpay"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShoppingCheckout;
