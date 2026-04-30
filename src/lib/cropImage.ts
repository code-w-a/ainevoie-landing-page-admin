import type { Area } from "react-easy-crop";

const OUTPUT_SIZE = 1024;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("image_load_failed"));
    image.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }
        reject(new Error("canvas_blob_failed"));
      },
      type,
      quality
    );
  });
}

export async function createSquareAvatarFile(
  imageSrc: string,
  cropPixels: Area,
  fileName = "provider-avatar.jpg"
) {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("canvas_context_failed");
  }

  context.drawImage(
    image,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE
  );

  const blob = await canvasToBlob(canvas, "image/jpeg", 0.92);
  return new File([blob], fileName, { type: "image/jpeg" });
}
