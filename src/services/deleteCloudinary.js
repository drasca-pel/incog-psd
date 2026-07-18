export async function deleteFromCloudinary(publicId, resourceType = "image") {

  try {

    const response = await fetch(
      "YOUR_BACKEND_DELETE_ENDPOINT",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          publicId,
          resourceType,
        }),
      }
    );

    const data = await response.json();

    return data;

  } catch (error) {

    console.error(
      "Cloudinary Delete Error:",
      error
    );

  }

}