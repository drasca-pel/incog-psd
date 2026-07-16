import { storage } from "./firebase";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

export async function uploadFiles(files, folder = "broadcasts") {
  const uploaded = [];

  for (const file of files) {
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `${folder}/${fileName}`);

    await uploadBytes(storageRef, file);

    const url = await getDownloadURL(storageRef);

    uploaded.push({
      name: file.name,
      type: file.type,
      size: file.size,
      url,
    });
  }

  return uploaded;
}