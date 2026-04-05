const Feature = require("../../models/Feature");
const { normalizeStoredImageUrl } = require("../../helpers/image-url");

const addFeatureImage = async (req, res) => {
  try {
    const { image } = req.body;
    const normalizedImageUrl = normalizeStoredImageUrl(image);

    if (!normalizedImageUrl) {
      return res.status(400).json({
        success: false,
        message: "Feature image is required",
      });
    }

    const featureImages = new Feature({
      image: normalizedImageUrl,
    });

    await featureImages.save();

    res.status(201).json({
      success: true,
      data: featureImages,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

const getFeatureImages = async (req, res) => {
  try {
    const images = await Feature.find({});
    const normalizedImages = [];
    const bulkUpdates = [];

    for (const imageDoc of images) {
      const normalizedImageUrl = normalizeStoredImageUrl(imageDoc.image);

      if (normalizedImageUrl && normalizedImageUrl !== imageDoc.image) {
        imageDoc.image = normalizedImageUrl;
        bulkUpdates.push({
          updateOne: {
            filter: { _id: imageDoc._id },
            update: { $set: { image: normalizedImageUrl } },
          },
        });
      }

      normalizedImages.push(imageDoc);
    }

    if (bulkUpdates.length > 0) {
      await Feature.bulkWrite(bulkUpdates);
    }

    res.status(200).json({
      success: true,
      data: normalizedImages,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

module.exports = { addFeatureImage, getFeatureImages };
