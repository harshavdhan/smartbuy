import { Avatar, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { Dialog, DialogContent } from "../ui/dialog";
import { Separator } from "../ui/separator";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, fetchCartItems } from "@/store/shop/cart-slice";
import { useToast } from "../ui/use-toast";
import {
  fetchProductDetails,
  setProductDetails,
} from "@/store/shop/products-slice";
import { Label } from "../ui/label";
import StarRatingComponent from "../common/star-rating";
import { useEffect, useState } from "react";
import { addReview, getReviews } from "@/store/shop/review-slice";
import { normalizeImageUrl } from "@/lib/image-utils";
import { formatPrice } from "@/lib/price-utils";
import { getNormalizedSizes } from "@/lib/size-utils";

function ProductDetailsDialog({
  open,
  setOpen,
  productDetails,
  onRequireLogin,
}) {
  const [reviewMsg, setReviewMsg] = useState("");
  const [rating, setRating] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { cartItems } = useSelector((state) => state.shopCart);
  const { reviews } = useSelector((state) => state.shopReview);

  const { toast } = useToast();

  function handleRatingChange(getRating) {
    console.log(getRating, "getRating");

    setRating(getRating);
  }

  function handleAddToCart(
    getCurrentProductId,
    getTotalStock,
    selectedProductSize = selectedSize,
    availableSizes = productSizes
  ) {
    let getCartItems = cartItems.items || [];
    const requiresSizeSelection = availableSizes.length > 0;

    if (requiresSizeSelection && !selectedProductSize) {
      toast({
        title: "Please select a size first",
        variant: "destructive",
      });

      return;
    }

    if (!isAuthenticated || !user?.id) {
      handleDialogClose();
      toast({
        title: "Please login to add products to your cart",
        variant: "destructive",
      });
      onRequireLogin?.();
      return;
    }

    if (getCartItems.length) {
        const indexOfCurrentItem = getCartItems.findIndex(
          (item) =>
            item.productId === getCurrentProductId &&
          (item.size || "") === (selectedProductSize || "")
        );
      if (indexOfCurrentItem > -1) {
        const getQuantity = getCartItems[indexOfCurrentItem].quantity;
        if (getQuantity + 1 > getTotalStock) {
          toast({
            title: `Only ${getQuantity} quantity can be added for this item`,
            variant: "destructive",
          });

          return;
        }
      }
    }
    dispatch(
      addToCart({
        userId: user?.id,
        productId: getCurrentProductId,
        quantity: 1,
        size: selectedProductSize,
      })
    ).then((data) => {
      if (data?.payload?.success) {
        dispatch(fetchCartItems(user?.id));
        toast({
          title: "Product is added to cart",
        });
      }
    });
  }

  function handleDialogClose() {
    setOpen(false);
    dispatch(setProductDetails());
    setRating(0);
    setReviewMsg("");
    setSelectedSize("");
  }

  function handleAddReview() {
    if (!isAuthenticated || !user?.id) {
      handleDialogClose();
      toast({
        title: "Please login to submit a review",
        variant: "destructive",
      });
      onRequireLogin?.();
      return;
    }

    dispatch(
      addReview({
        productId: productDetails?._id,
        userId: user?.id,
        userName: user?.userName,
        reviewMessage: reviewMsg,
        reviewValue: rating,
      })
    ).then((data) => {
      if (data.payload.success) {
        setRating(0);
        setReviewMsg("");
        dispatch(getReviews(productDetails?._id));
        toast({
          title: "Review added successfully!",
        });
      }
    });
  }

  useEffect(() => {
    if (productDetails !== null) dispatch(getReviews(productDetails?._id));
  }, [productDetails]);

  useEffect(() => {
    setSelectedSize("");
  }, [productDetails?._id]);

  console.log(reviews, "reviews");

  const averageReview =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, reviewItem) => sum + reviewItem.reviewValue, 0) /
      reviews.length
      : 0;
  const marketBasketRecommendations =
    productDetails?.marketBasketRecommendations || [];
  const productSizes = getNormalizedSizes(productDetails?.size);

  function handleRecommendedProductAction(recommendedProduct) {
    if (getNormalizedSizes(recommendedProduct?.size).length > 0) {
      dispatch(fetchProductDetails(recommendedProduct?._id));
      return;
    }

    handleAddToCart(
      recommendedProduct?._id,
      recommendedProduct?.totalStock,
      "",
      []
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="grid max-h-[90vh] w-[95vw] max-w-[95vw] grid-cols-1 gap-4 overflow-y-auto p-4 sm:max-w-[88vw] sm:p-6 lg:max-w-[72vw] lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-8 xl:max-w-[68vw]">
        <div className="relative overflow-hidden rounded-lg lg:sticky lg:top-0 lg:self-start">
          <img
            src={normalizeImageUrl(productDetails?.image)}
            alt={productDetails?.title}
            width={600}
            height={600}
            className="aspect-[4/3] w-full object-cover sm:aspect-square"
          />
        </div>
        <div className="min-w-0 space-y-5">
          <div>
            <h1 className="text-2xl font-extrabold sm:text-3xl">
              {productDetails?.title}
            </h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary">
                Category: {productDetails?.category}
              </Badge>
              <Badge variant="secondary">
                Brand: {productDetails?.brand}
              </Badge>
            </div>
            {productSizes.length > 0 ? (
              <div className="mt-3">
                <p className="mb-2 text-sm font-medium text-foreground">Available Sizes</p>
                <div className="flex flex-wrap gap-2">
                  {productSizes.map((sizeItem) => (
                    <button
                      key={sizeItem}
                      type="button"
                      onClick={() => setSelectedSize(sizeItem)}
                    >
                      <Badge
                        variant={selectedSize === sizeItem ? "default" : "outline"}
                        className="cursor-pointer"
                      >
                      {sizeItem}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <p className="mt-3 text-base text-muted-foreground sm:mt-4 sm:text-xl lg:text-sm">
              {productDetails?.description}
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p
              className={`text-xl font-bold text-primary sm:text-2xl ${productDetails?.salePrice > 0 ? "line-through" : ""
                }`}
            >
              {formatPrice(productDetails?.price)}
            </p>
            {productDetails?.salePrice > 0 ? (
              <p className="text-xl font-bold text-muted-foreground sm:text-2xl">
                {formatPrice(productDetails?.salePrice)}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-0.5">
              <StarRatingComponent rating={averageReview} />
            </div>
            <span className="text-muted-foreground">
              ({averageReview.toFixed(2)})
            </span>
          </div>
          <div>
            {productDetails?.totalStock === 0 ? (
              <Button className="w-full opacity-60 cursor-not-allowed">
                Out of Stock
              </Button>
            ) : (
              <Button
                className="w-full"
                disabled={productSizes.length > 0 && !selectedSize}
                onClick={() =>
                  handleAddToCart(
                    productDetails?._id,
                    productDetails?.totalStock,
                    selectedSize,
                    productSizes
                  )
                }
              >
                {productSizes.length > 0 && !selectedSize
                  ? "Select Size to Add"
                  : "Add to Cart"}
              </Button>
            )}
          </div>
          {marketBasketRecommendations.length > 0 ? (
            <>
              <Separator />
              <div>
                <h2 className="mb-3 text-lg font-bold sm:text-xl">
                  Frequently Bought Together
                </h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  Based on past successful orders from your store.
                </p>
                <div className="grid gap-3">
                  {marketBasketRecommendations.map((recommendedProduct) => (
                    <div
                      key={recommendedProduct?._id}
                      className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center"
                    >
                      <img
                        src={normalizeImageUrl(recommendedProduct?.image)}
                        alt={recommendedProduct?.title}
                        className="h-20 w-full rounded-md object-cover sm:h-16 sm:w-16"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold">
                          {recommendedProduct?.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {formatPrice(
                            recommendedProduct?.salePrice > 0
                              ? recommendedProduct?.salePrice
                              : recommendedProduct?.price
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Confidence: {recommendedProduct?.confidence}%
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="w-full sm:w-auto"
                        disabled={recommendedProduct?.totalStock === 0}
                        onClick={() => handleRecommendedProductAction(recommendedProduct)}
                      >
                        {recommendedProduct?.totalStock === 0
                          ? "Out of Stock"
                          : getNormalizedSizes(recommendedProduct?.size).length > 0
                            ? "View Sizes"
                            : "Add"}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
          <Separator />
          <div className="max-h-[40vh] overflow-auto pr-1 lg:max-h-[32vh]">
            <h2 className="mb-4 text-lg font-bold sm:text-xl">Reviews</h2>
            <div className="grid gap-6">
              {reviews && reviews.length > 0 ? (
                reviews.map((reviewItem, index) => (
                  <div
                    key={`${reviewItem?._id || reviewItem?.userName}-${index}`}
                    className="flex gap-3 sm:gap-4"
                  >
                    <Avatar className="w-10 h-10 border">
                      <AvatarFallback>
                        {reviewItem?.userName[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid gap-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold">{reviewItem?.userName}</h3>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <StarRatingComponent rating={reviewItem?.reviewValue} />
                      </div>
                      <p className="text-muted-foreground">
                        {reviewItem.reviewMessage}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <h1>No Reviews</h1>
              )}
            </div>
            <div className="mt-8 flex-col flex gap-2">
              <Label>Write a review</Label>
              <div className="flex gap-1">
                <StarRatingComponent
                  rating={rating}
                  handleRatingChange={handleRatingChange}
                />
              </div>
              <Input
                name="reviewMsg"
                value={reviewMsg}
                onChange={(event) => setReviewMsg(event.target.value)}
                placeholder="Write a review..."
              />
              <Button
                onClick={handleAddReview}
                disabled={reviewMsg.trim() === ""}
              >
                Submit
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ProductDetailsDialog;
