import { createCanvas } from 'canvas';

export async function generateStickerBuffer(color = '#FF69B4', label = 'GG') {
  const canvas = createCanvas(320, 320);
  const ctx    = canvas.getContext('2d');
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, 320, 320);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(20, 20, 280, 280, 40);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 80px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label.toUpperCase(), 160, 160);
  return canvas.toBuffer('image/png');
}
