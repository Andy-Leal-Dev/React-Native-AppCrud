import * as FileSystem from 'expo-file-system';

export const NOTES_DIR = FileSystem.documentDirectory + 'notes_media/';

export async function ensureDirExists() {
  const dirInfo = await FileSystem.getInfoAsync(NOTES_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(NOTES_DIR, { intermediates: true });
  }
}

export async function copyFileToNotesDir(fileUri, fileName) {
  await ensureDirExists();
  const newPath = NOTES_DIR + fileName;
  await FileSystem.copyAsync({ from: fileUri, to: newPath });
  return newPath;
}

export async function deleteFile(fileUri) {
  try {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(fileUri);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}

 export const calculateFileHash = async (fileUri) => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      throw new Error('File does not exist');
    }
    
    // Leer el archivo como base64
    const fileContent = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Crear un hash simple (en producción, usa una librería como crypto-js)
    let hash = 0;
    for (let i = 0; i < fileContent.length; i++) {
      const char = fileContent.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return hash.toString();
  } catch (error) {
    console.error('Error calculating file hash:', error);
    // Fallback: usar timestamp + tamaño del archivo
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    return `${fileInfo.size}-${Date.now()}`;
  }
};
