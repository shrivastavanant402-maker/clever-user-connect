export type LocalFile = {
  id: string;
  name: string;
  mimeType: string;
  dataUrl: string;
  size: number;
};

export const ACCEPTED = "image/*,application/pdf";

export function readLocalFile(file: File): Promise<LocalFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 7)}`,
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        dataUrl: String(reader.result),
        size: file.size,
      });
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}
