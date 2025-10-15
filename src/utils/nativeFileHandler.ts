import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

export const isNativePlatform = () => {
  return Capacitor.isNativePlatform();
};

export const saveFileNatively = async (
  filename: string,
  content: string,
  mimeType: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (isNativePlatform()) {
      // For native platforms (Android/iOS), use Filesystem and Share
      const result = await Filesystem.writeFile({
        path: filename,
        data: content,
        directory: Directory.Cache,
      });

      // Share the file so user can choose where to save it
      await Share.share({
        title: `Save ${filename}`,
        text: `Export from GuestNest`,
        url: result.uri,
        dialogTitle: 'Save file to...',
      });

      return { success: true };
    } else {
      // For web, use traditional blob download
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return { success: true };
    }
  } catch (error) {
    console.error('Error saving file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save file',
    };
  }
};
