import QRCode from "qrcode";
import type { AxisLetter, CatPersonality, QuizResult } from "./types";

const WIDTH = 1080;
const HEIGHT = 1350;
const TRAIT_LABELS: Record<AxisLetter, string> = {
  E: "迎賓社交",
  I: "獨處充電",
  S: "熟悉務實",
  N: "好奇探索",
  T: "目標自主",
  F: "關係共感",
  J: "規律可預測",
  P: "隨興應變",
};

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
  } while (context.measureText(text).width > maxWidth && size > 34);
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image loading failed"));
    image.src = source;
  });
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
) {
  const lines: string[] = [];
  let currentLine = "";

  for (const character of Array.from(text)) {
    const candidate = `${currentLine}${character}`;
    if (currentLine && context.measureText(candidate).width > maxWidth) {
      lines.push(currentLine);
      currentLine = character;
      if (lines.length === maxLines) break;
    } else {
      currentLine = candidate;
    }
  }

  if (lines.length < maxLines && currentLine) lines.push(currentLine);
  if (lines.join("").length < text.length && lines.length) {
    let finalLine = `${lines.at(-1)}…`;
    while (context.measureText(finalLine).width > maxWidth && finalLine.length > 1) {
      finalLine = `${finalLine.slice(0, -2)}…`;
    }
    lines[lines.length - 1] = finalLine;
  }
  return lines;
}

function roundedImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  size: number,
) {
  const radius = 34;
  context.save();
  context.beginPath();
  context.roundRect(x, y, size, size, radius);
  context.clip();
  context.drawImage(image, x, y, size, size);
  context.restore();
}

export async function createPersonalityShareCard(
  personality: CatPersonality,
  result: QuizResult,
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
  const illustration = await loadImage(new URL(personality.image, window.location.origin).toString());

  context.fillStyle = "#F5F0E6";
  context.fillRect(0, 0, WIDTH, HEIGHT);
  context.strokeStyle = "#D8CDBB";
  context.lineWidth = 2;
  context.strokeRect(54, 54, WIDTH - 108, HEIGHT - 108);

  context.fillStyle = "#8F412C";
  context.font = `700 24px ${sans}`;
  context.letterSpacing = "5px";
  context.fillText("好奇一下  CURIO LAB", 92, 124);

  context.fillStyle = "#6E685E";
  context.font = `500 32px ${sans}`;
  context.letterSpacing = "0px";
  context.fillText("我家主子的貓格是", 92, 224);

  context.fillStyle = "#B85C3D";
  context.font = `600 38px ${serif}`;
  context.fillText(personality.code, 92, 292);

  context.fillStyle = "#241C15";
  fitText(context, personality.name, 850, 88, serif, 600);
  context.fillText(personality.name, 92, 388);

  roundedImage(context, illustration, 92, 458, 560);

  context.fillStyle = "#8F412C";
  context.font = `700 22px ${sans}`;
  context.fillText("牠比較像", 712, 504);

  const traits = result.axes.map((axis) => TRAIT_LABELS[axis.preferred]);
  traits.forEach((trait, index) => {
    const y = 574 + index * 92;
    context.fillStyle = "#E9D8C8";
    context.beginPath();
    context.roundRect(692, y - 42, 296, 64, 32);
    context.fill();
    context.fillStyle = "#6F3828";
    fitText(context, trait, 244, 27, sans, 700);
    context.fillText(trait, 718, y);
  });

  const shortDescription = `${personality.description.split("。")[0]}。`;
  context.fillStyle = "#6E685E";
  context.font = `500 25px ${sans}`;
  const descriptionParts = wrapText(context, shortDescription, 296, 4);
  descriptionParts.forEach((part, index) => {
    context.fillText(part, 692, 950 + index * 42);
  });

  const qrDataUrl = await QRCode.toDataURL(shareUrl, {
    width: 170,
    margin: 1,
    color: { dark: "#241C15", light: "#F5F0E6" },
  });
  const qrImage = await loadImage(qrDataUrl);

  context.strokeStyle = "#D8CDBB";
  context.beginPath();
  context.moveTo(92, 1104);
  context.lineTo(988, 1104);
  context.stroke();

  context.fillStyle = "#241C15";
  context.font = `700 28px ${serif}`;
  context.fillText("你家主子是哪一型？", 92, 1182);
  context.fillStyle = "#8F412C";
  context.font = `600 23px ${sans}`;
  const displayUrl = shareUrl.replace(/^https?:\/\//, "").replace(/[?].*$/, "");
  fitText(context, displayUrl, 610, 23, sans, 600);
  context.fillText(displayUrl, 92, 1230);
  context.drawImage(qrImage, 818, 1132, 170, 170);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error("Image generation failed")),
      "image/png",
      0.95,
    );
  });
}

export function downloadPersonalityShareCard(blob: Blob, name: string) {
  const safeName = name.replace(/[\\/:*?"<>|]/g, "-");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `16型貓格-${safeName}.png`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
