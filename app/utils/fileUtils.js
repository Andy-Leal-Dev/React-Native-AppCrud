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