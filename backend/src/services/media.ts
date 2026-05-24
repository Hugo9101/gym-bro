import { v2 as cloudinary } from 'cloudinary';
import https from 'https';

cloudinary.config({ secure: true });

function downloadBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      })
      .on('error', reject);
  });
}

export async function uploadFromUrl(mediaUrl: string): Promise<string> {
  const buffer = await downloadBuffer(mediaUrl);

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: 'gym-bro/workouts', resource_type: 'image' }, (err, result) => {
        if (err || !result) return reject(err ?? new Error('Upload failed'));
        resolve(result.secure_url);
      })
      .end(buffer);
  });
}
