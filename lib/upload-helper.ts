import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function uploadImage(file: File, path: string): Promise<string> {
  const storage = getStorage();
  const storageRef = ref(storage, path);
  
  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

export function generateStoragePath(file: File, type: 'og' | 'favicon'): string {
  const timestamp = Date.now();
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  return `site-assets/${type}/${timestamp}.${extension}`;
}
