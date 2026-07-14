// Zpracování nahraného obrázku – konverze do JPEG (řeší i HEIC z iPhonu)
// a zmenšení na max 1024px. Vrací base64, které frontend posílá s každým testem.
import sharp from 'sharp';

export default async (req) => {
  try {
    const buffer = Buffer.from(await req.arrayBuffer());
    if (!buffer.length) {
      return Response.json({ error: 'Chybí obrázek' }, { status: 400 });
    }

    const jpeg = await sharp(buffer)
      .rotate()
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    return Response.json({ imageBase64: jpeg.toString('base64') });
  } catch (err) {
    return Response.json({ error: 'Obrázek se nepodařilo zpracovat: ' + err.message }, { status: 400 });
  }
};

export const config = { path: '/api/prepare-image' };
