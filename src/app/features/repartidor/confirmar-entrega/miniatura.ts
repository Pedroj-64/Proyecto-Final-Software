/** Lado mayor de la miniatura de la foto de entrega (px). */
export const LADO_MINIATURA = 320;
/** Calidad JPEG de la miniatura (0 a 1). */
export const CALIDAD_MINIATURA = 0.7;

/** Tamaño de la miniatura conservando la proporción; nunca agranda una imagen pequeña. */
export function dimensionesMiniatura(
  ancho: number,
  alto: number,
  lado = LADO_MINIATURA,
): { ancho: number; alto: number } {
  const escala = Math.min(1, lado / Math.max(ancho, alto, 1));
  return {
    ancho: Math.max(1, Math.round(ancho * escala)),
    alto: Math.max(1, Math.round(alto * escala)),
  };
}

function cargarImagen(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const imagen = new Image();
    imagen.onload = () => resolve(imagen);
    imagen.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    imagen.src = url;
  });
}

/**
 * Reduce una foto a una miniatura JPEG (lado mayor de 320 px, calidad 0,7) en texto (data URL),
 * para que la evidencia de entrega quepa en el almacenamiento del navegador.
 */
export async function crearMiniatura(
  archivo: File,
  lado = LADO_MINIATURA,
  calidad = CALIDAD_MINIATURA,
): Promise<string> {
  if (!archivo.type.startsWith('image/')) {
    throw new Error('El archivo no es una imagen.');
  }
  const url = URL.createObjectURL(archivo);
  try {
    const imagen = await cargarImagen(url);
    const { ancho, alto } = dimensionesMiniatura(imagen.naturalWidth, imagen.naturalHeight, lado);
    const canvas = document.createElement('canvas');
    canvas.width = ancho;
    canvas.height = alto;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('El navegador no puede procesar la imagen.');
    ctx.drawImage(imagen, 0, 0, ancho, alto);
    return canvas.toDataURL('image/jpeg', calidad);
  } finally {
    URL.revokeObjectURL(url);
  }
}
