export type LocalFile = {
  id: string;
  name: string;
  mimeType: string;
  dataUrl: string;
  size: number;
};

export const ACCEPTED = "image/*,application/pdf";

export async function readLocalFile(file: File): Promise<LocalFile> {
  const id = `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 7)}`;

  // Optimize and downscale images in the browser to drastically reduce upload size and inference latency
  if (typeof window !== "undefined" && file.type.startsWith("image/")) {
    try {
      const optimized = await optimizeImage(file);
      return {
        id,
        name: file.name,
        mimeType: optimized.mimeType,
        dataUrl: optimized.dataUrl,
        size: optimized.size,
      };
    } catch (e) {
      console.warn("Client-side image optimization failed, falling back to raw reader:", e);
    }
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        id,
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        dataUrl: String(reader.result),
        size: file.size,
      });
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

function optimizeImage(file: File): Promise<{ dataUrl: string; mimeType: string; size: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Max 1600px is optimal: high enough for crisp OCR of small text, small enough for instant upload & inference
        const MAX_DIM = 1600;
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return resolve({
            dataUrl: String(reader.result),
            mimeType: file.type || "image/jpeg",
            size: file.size,
          });
        }
        // Fill white background in case of transparent PNG
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        const head = "data:image/jpeg;base64,";
        const byteSize = Math.round((dataUrl.length - head.length) * 0.75);
        resolve({
          dataUrl,
          mimeType: "image/jpeg",
          size: byteSize,
        });
      };
      img.onerror = () => reject(new Error("Could not load image"));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error("Could not read image file"));
    reader.readAsDataURL(file);
  });
}

