import { v2 as cloudinary } from "cloudinary";

// 🔹 Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 🔹 Upload Image Function
export const uploadImage = async (file, folder = "connect_platform") => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder,
    });

    return {
      public_id: result.public_id,
      url: result.secure_url,
    };
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    throw new Error("Image upload failed");
  }
};

export default cloudinary;