import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMarketBasketInsightsForAdmin } from "@/store/admin/order-slice";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { normalizeImageUrl } from "@/lib/image-utils";

function AdminMarketBasketView() {
  const dispatch = useDispatch();
  const { marketBasketInsights } = useSelector((state) => state.adminOrder);

  useEffect(() => {
    dispatch(getMarketBasketInsightsForAdmin());
  }, [dispatch]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Basket Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        {marketBasketInsights && marketBasketInsights.length > 0 ? (
          <div className="grid gap-4">
            {marketBasketInsights.map((insightItem) => (
              <div key={insightItem.pairKey} className="rounded-lg border p-4">
                <div className="grid gap-4 md:grid-cols-[1fr_1fr] md:items-center">
                  {insightItem.products.map((product) => (
                    <div key={product._id} className="flex items-center gap-3">
                      <img
                        src={normalizeImageUrl(product.image)}
                        alt={product.title}
                        className="h-16 w-16 rounded-md object-cover"
                      />
                      <div>
                        <p className="font-semibold">{product.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Product ID: {product._id}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span>Bought together in {insightItem.pairCount} paid orders</span>
                  <span>Support: {insightItem.pairSupport}%</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">
            No market basket insights yet. Place some successful multi-product
            orders to generate frequent pair recommendations.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default AdminMarketBasketView;
