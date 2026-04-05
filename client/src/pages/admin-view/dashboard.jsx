import ProductImageUpload from "@/components/admin-view/image-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addFeatureImage, getFeatureImages } from "@/store/common-slice";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { normalizeImageUrl } from "@/lib/image-utils";

function AdminDashboard() {
  const [imageFile, setImageFile] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [imageLoadingState, setImageLoadingState] = useState(false);
  const dispatch = useDispatch();
  const { featureImageList } = useSelector((state) => state.commonFeature);

  function handleUploadFeatureImage() {
    dispatch(addFeatureImage(uploadedImageUrl)).then((data) => {
      if (data?.payload?.success) {
        dispatch(getFeatureImages());
        setImageFile(null);
        setUploadedImageUrl("");
      }
    });
  }

  useEffect(() => {
    dispatch(getFeatureImages());
  }, [dispatch]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Banner Images</CardTitle>
      </CardHeader>
      <CardContent>
        <ProductImageUpload
          imageFile={imageFile}
          setImageFile={setImageFile}
          uploadedImageUrl={uploadedImageUrl}
          setUploadedImageUrl={setUploadedImageUrl}
          setImageLoadingState={setImageLoadingState}
          imageLoadingState={imageLoadingState}
          isCustomStyling={true}
        />
        <Button onClick={handleUploadFeatureImage} className="mt-5 w-full">
          Upload
        </Button>
        <div className="mt-5 flex flex-col gap-4">
          {featureImageList && featureImageList.length > 0
            ? featureImageList.map((featureImgItem) => (
                <div
                  className="relative"
                  key={featureImgItem?._id || featureImgItem?.image}
                >
                  <img
                    src={normalizeImageUrl(featureImgItem.image)}
                    className="h-[300px] w-full rounded-t-lg object-cover"
                  />
                </div>
              ))
            : null}
        </div>
      </CardContent>
    </Card>
  );
}

export default AdminDashboard;
