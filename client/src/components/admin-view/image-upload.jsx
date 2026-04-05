import { FileIcon, UploadCloudIcon, XIcon } from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import api from "@/lib/api";
import { normalizeImageUrl } from "@/lib/image-utils";
import { useToast } from "../ui/use-toast";

function ProductImageUpload({
  imageFile,
  setImageFile,
  imageLoadingState,
  uploadedImageUrl,
  setUploadedImageUrl,
  setImageLoadingState,
  isEditMode,
  isCustomStyling = false,
}) {
  const inputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const { toast } = useToast();

  function handleImageFileChange(event) {
    const selectedFile = event.target.files?.[0];

    if (selectedFile) setImageFile(selectedFile);
  }

  function handleDragOver(event) {
    event.preventDefault();
  }

  function handleDrop(event) {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) setImageFile(droppedFile);
  }

  function handleRemoveImage() {
    setImageFile(null);
    setUploadedImageUrl("");
    setPreviewUrl("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function uploadImageToCloudinary() {
    try {
      setImageLoadingState(true);
      const data = new FormData();
      data.append("my_file", imageFile);
      const response = await api.post("/admin/products/upload-image", data);

      if (response?.data?.success) {
        const imageUrl = normalizeImageUrl(
          response?.data?.imageUrl ||
            response?.data?.result?.secure_url ||
            response?.data?.result?.url
        );

        setUploadedImageUrl(imageUrl);
      } else {
        setUploadedImageUrl("");
        toast({
          title: "Image upload failed",
          description: response?.data?.message || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setUploadedImageUrl("");
      toast({
        title: "Image upload failed",
        description: "Please wait a moment and try again.",
        variant: "destructive",
      });
    } finally {
      setImageLoadingState(false);
    }
  }

  useEffect(() => {
    if (imageFile !== null) uploadImageToCloudinary();
  }, [imageFile]);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(normalizeImageUrl(uploadedImageUrl));
      return;
    }

    const localPreviewUrl = URL.createObjectURL(imageFile);
    setPreviewUrl(localPreviewUrl);

    return () => {
      URL.revokeObjectURL(localPreviewUrl);
    };
  }, [imageFile, uploadedImageUrl]);

  return (
    <div
      className={`w-full  mt-4 ${isCustomStyling ? "" : "max-w-md mx-auto"}`}
    >
      <Label className="text-lg font-semibold mb-2 block">Upload Image</Label>
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`${
          isEditMode ? "opacity-60" : ""
        } border-2 border-dashed rounded-lg p-4`}
      >
        <Input
          id="image-upload"
          type="file"
          className="hidden"
          ref={inputRef}
          onChange={handleImageFileChange}
          disabled={isEditMode}
        />
        {!imageFile && !previewUrl ? (
          <Label
            htmlFor="image-upload"
            className={`${
              isEditMode ? "cursor-not-allowed" : ""
            } flex flex-col items-center justify-center h-32 cursor-pointer`}
          >
            <UploadCloudIcon className="w-10 h-10 text-muted-foreground mb-2" />
            <span>Drag & drop or click to upload image</span>
          </Label>
        ) : imageLoadingState ? (
          <Skeleton className="h-10 bg-gray-100" />
        ) : (
          <div className="space-y-3">
            <div className="overflow-hidden rounded-md border bg-muted/30">
              <img
                src={previewUrl}
                alt="Product preview"
                className="h-40 w-full object-cover"
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center">
                <FileIcon className="mr-2 h-8 w-8 text-primary" />
                <p className="truncate text-sm font-medium">
                  {imageFile?.name || "Uploaded image"}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                onClick={handleRemoveImage}
              >
                <XIcon className="w-4 h-4" />
                <span className="sr-only">Remove File</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductImageUpload;
