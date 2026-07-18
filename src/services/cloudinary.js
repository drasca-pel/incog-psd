export async function uploadToCloudinary(file) {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("upload_preset", "Incog_uploads");

  const response = await fetch(
    "https://api.cloudinary.com/v1_1/f3zjhg4c/auto/upload",
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Upload failed");
  }

return {
  url: data.secure_url,
  publicId: data.public_id,
  resourceType: data.resource_type,
  type: file.type,
  name: file.name,
};
}
