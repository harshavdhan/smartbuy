import { Card, CardContent, CardFooter } from "../ui/card";
import { Button } from "../ui/button";
import { brandOptionsMap, categoryOptionsMap } from "@/config";
import { Badge } from "../ui/badge";
import { normalizeImageUrl } from "@/lib/image-utils";
import { formatPrice } from "@/lib/price-utils";
import { getNormalizedSizes } from "@/lib/size-utils";

function ShoppingProductTile({
  product,
  handleGetProductDetails,
  handleAddtoCart,
}) {
  const productSizes = getNormalizedSizes(product?.size);
  const requiresSizeSelection = productSizes.length > 0;

  return (
    <Card className="w-full max-w-sm mx-auto">
      <div onClick={() => handleGetProductDetails(product?._id)}>
        <div className="relative">
          <img
            src={normalizeImageUrl(product?.image)}
            alt={product?.title}
            className="w-full h-[300px] object-cover rounded-t-lg object-top"
          />
          {product?.totalStock === 0 ? (
            <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600">
              Out Of Stock
            </Badge>
          ) : product?.totalStock < 10 ? (
            <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600">
              {`Only ${product?.totalStock} items left`}
            </Badge>
          ) : product?.salePrice > 0 ? (
            <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600">
              Sale
            </Badge>
          ) : null}
        </div>
        <CardContent className="p-4">
          <h2 className="text-xl font-bold mb-2 cursor-pointer">{product?.title}</h2>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[16px] text-muted-foreground">
              {categoryOptionsMap[product?.category]}
            </span>
            <span className="text-[16px] text-muted-foreground">
              {brandOptionsMap[product?.brand]}
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span
              className={`${product?.salePrice > 0 ? "line-through" : ""
                } text-lg font-semibold text-primary`}
            >
              {formatPrice(product?.price)}
            </span>
            {product?.salePrice > 0 ? (
              <span className="text-lg font-semibold text-primary">
                {formatPrice(product?.salePrice)}
              </span>
            ) : null}
          </div>
        </CardContent>
      </div>
      <CardFooter>
        {product?.totalStock === 0 ? (
          <Button className="w-full opacity-60 cursor-not-allowed">
            Out Of Stock
          </Button>
        ) : (
          <Button
            onClick={() =>
              requiresSizeSelection
                ? handleGetProductDetails(product?._id)
                : handleAddtoCart(product?._id, product?.totalStock)
            }
            className="w-full"
          >
            {requiresSizeSelection ? "Choose Size" : "Add to cart"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default ShoppingProductTile;
