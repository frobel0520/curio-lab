import { formatDuration } from "./calculate";
import type { CalculatorInput, CalculatorResult } from "./types";
import QRCode from "qrcode";

const WIDTH = 1080;
const HEIGHT = 1350;
const currency = new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 0 });

function fitText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startSize: number,
  family: string,
  weight = 600,
) {
  let size = startSize;
  do {
    context.font = `${weight} ${size}px ${family}`;
    size -= 2;
  } while (context.measureText(text).width > maxWidth && size > 42);
}

function line(
  context: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  context.beginPath();
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.stroke();
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image loading failed"));
    image.src = source;
  });
}

export async function createShareCard(
  input: CalculatorInput,
  result: CalculatorResult,
  shareUrl: string,
) {
  await document.fonts?.ready;

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable");

  const serif = '"Noto Serif TC", "Songti TC", serif';
  const sans = '"Noto Sans TC", "Microsoft JhengHei", sans-serif';
  const cat = input.catName.trim() || "我家主子";

  context.fillStyle = "#F5F0E6";
  context.fillRect(0, 0, WIDTH, HEIGHT);
  context.strokeStyle = "#D8CDBB";
  context.lineWidth = 2;
  context.strokeRect(54, 54, WIDTH - 108, HEIGHT - 108);

  context.fillStyle = "rgba(184, 92, 61, 0.09)";
  context.font = `500 520px ${serif}`;
  context.fillText("?", 730, 455);

  context.fillStyle = "#8F412C";
  context.font = `700 24px ${sans}`;
  context.letterSpacing = "5px";
  context.fillText("好奇一下  CURIO LAB", 92, 124);

  context.fillStyle = "#6E685E";
  context.font = `500 35px ${sans}`;
  context.letterSpacing = "0px";
  context.fillText("這些年，我大約為", 92, 260);

  context.fillStyle = "#B85C3D";
  fitText(context, cat, 880, 92, serif, 600);
  context.fillText(cat, 92, 370);

  context.fillStyle = "#241C15";
  fitText(
    context,
    `NT$ ${currency.format(result.estimatedHistoricalTotal)}`,
    890,
    110,
    serif,
    600,
  );
  context.fillText(`NT$ ${currency.format(result.estimatedHistoricalTotal)}`, 92, 520);

  context.strokeStyle = "#D8CDBB";
  line(context, 92, 605, 988, 605);

  const metrics = [
    ["一起生活", formatDuration(result.monthsTogether)],
    ["平均每天", `NT$ ${currency.format(result.avgPerDay)}`],
    ["最大支出", result.largestCategory.label],
  ];

  metrics.forEach(([label, value], index) => {
    const x = 92 + index * 306;
    context.fillStyle = "#6E685E";
    context.font = `500 24px ${sans}`;
    context.fillText(label, x, 690);
    context.fillStyle = "#241C15";
    fitText(context, value, 260, 38, serif, 600);
    context.fillText(value, x, 750);
  });

  context.strokeStyle = "#D8CDBB";
  line(context, 92, 830, 988, 830);

  const qrDataUrl = await QRCode.toDataURL(shareUrl, {
    width: 180,
    margin: 1,
    color: { dark: "#241C15", light: "#F5F0E6" },
  });
  const qrImage = await loadImage(qrDataUrl);

  context.fillStyle = "#241C15";
  context.font = `700 27px ${serif}`;
  context.fillText("換你算算看", 92, 1168);
  context.fillStyle = "#8F412C";
  const displayUrl = shareUrl.replace(/^https?:\/\//, "").replace(/[?].*$/, "");
  fitText(context, displayUrl, 620, 28, sans, 600);
  context.fillText(displayUrl, 92, 1214);
  context.drawImage(qrImage, 808, 1054, 180, 180);
  context.fillStyle = "#6E685E";
  context.font = `600 20px ${sans}`;
  context.fillText("掃碼試算", 849, 1268);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error("Image generation failed")),
      "image/png",
      0.95,
    );
  });
}

export function downloadShareCard(blob: Blob, catName: string) {
  const safeName = catName.trim().replace(/[\\/:*?"<>|]/g, "-") || "主子";
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `主子帳本-${safeName}.png`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
