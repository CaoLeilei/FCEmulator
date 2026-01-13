// 测试帧缓冲区数据格式
const frameBuffer = new Uint8Array(256 * 240 * 4);

// 填充一些测试数据
// 像素 (0,0): R=255, G=0, B=0, A=255
const idx = (0 * 256 + 0) * 4;
frameBuffer[idx] = 255;     // R
frameBuffer[idx + 1] = 0;   // G
frameBuffer[idx + 2] = 0;   // B
frameBuffer[idx + 3] = 255; // A

// 像素 (1,0): R=0, G=255, B=0, A=255
const idx2 = (0 * 256 + 1) * 4;
frameBuffer[idx2] = 0;     // R
frameBuffer[idx2 + 1] = 255; // G
frameBuffer[idx2 + 2] = 0;   // B
frameBuffer[idx2 + 3] = 255; // A

console.log('帧缓冲区测试数据:');
console.log('前12个字节:', Array.from(frameBuffer.slice(0, 12)));
console.log('像素 (0,0) RGBA:', [
  frameBuffer[idx],
  frameBuffer[idx + 1],
  frameBuffer[idx + 2],
  frameBuffer[idx + 3]
]);
console.log('像素 (1,0) RGBA:', [
  frameBuffer[idx2],
  frameBuffer[idx2 + 1],
  frameBuffer[idx2 + 2],
  frameBuffer[idx2 + 3]
]);
