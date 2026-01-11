import QRCode from "qrcode";

type RenderArgs = {
  canvas: HTMLCanvasElement;
  bgImage: string;
  entity: any;
  format: "roi" | "pnl" | "roi_pnl";
  enabled: Set<string>;
  dimensions: {
    width: number
    height: number
  }
  message?: string;
  referral?: {
    code?: string;
    link?: string;
  },
  logo?: string
};

export async function renderPnLPoster({
  canvas,
  bgImage,
  entity,
  format,
  enabled,
  message,
  referral,
  dimensions,
  logo = "/logo.webp"
}: RenderArgs) {
  const ctx = canvas.getContext("2d")!;
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = bgImage;

  await new Promise(r => (img.onload = r));

  canvas.width = dimensions.width;
  canvas.height = dimensions.height;


  let y = 120;

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // gradient overlay
  const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
  grad.addColorStop(0.4, "#000000df");
  grad.addColorStop(0.7, "#00000000");

  ctx.fill


  // Fill rectangle with gradient
  ctx.fillStyle = grad;
  ctx.fillRect(0, 160, canvas.width, 350);

  // overlay
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#fff";

  ctx.font = "700 42px Manrope";
  ctx.fillText(
    `${entity.side} ${entity.symbol} ${entity.leverage}x`,
    60,
    y + 90
  );

  let pnlText = "";
  if (format !== "pnl") pnlText += `${entity.roi?.toFixed(2)}%`;
  if (format !== "roi") pnlText += `$${entity.pnl?.toFixed(2)} `;

  ctx.font = "700 62px Manrope";
  ctx.fillStyle = "#000000"

  ctx.fillRect(60, y + 100, 400, 72)

  ctx.fillStyle = entity.pnl >= 0 ? "#00e0b8" : "#ff678c";
  ctx.fillText(pnlText, 60, y + 150)

  ctx.font = "400 22px Manrope";
  ctx.fillStyle = "#fff";


  const add = (label: string, value: any) => {
    ctx.fillText(`${label}: ${value}`, 60, y + 220);
    y += 32;
  };

  if (enabled.has("openPrice")) add("Open", entity.openPrice);
  if (enabled.has("markPrice")) add("Mark", entity.markPrice);
  if (enabled.has("quantity")) add("Qty", entity.quantity);
  if (enabled.has("leverage")) add("Lev", entity.leverage);
  if (enabled.has("openTime"))
    add("Opened", new Date(entity.openTime).toLocaleString());

  if (message) {
    ctx.font = "500 26px Manrope";
    ctx.fillText(`“${message}”`, 60, canvas.height - 80);
  }

  if (referral?.link) {
    const qr = await QRCode.toDataURL(referral.link);
    const qrImg = new Image();
    qrImg.src = qr;
    await new Promise(r => (qrImg.onload = r));

    ctx.drawImage(qrImg, canvas.width - 180, canvas.height - 180, 120, 120);
    ctx.font = "500 16px Manrope";
    ctx.fillText(
      referral.code || "",
      canvas.width - 180,
      canvas.height - 30
    );


  }

  if (true) {
    const text = "https://oklong.io"
    const qr = await QRCode.toDataURL(text);
    const qrImg = new Image();
    qrImg.src = qr;
    await new Promise(r => (qrImg.onload = r));


    ctx.drawImage(qrImg, canvas.width - 360, canvas.height - 180, 120, 120);
    ctx.font = "500 16px Manrope";
    ctx.fillText(
      text || "",
      canvas.width - 360,
      canvas.height - 30
    );


  }
  if (logo) {

    const qrImg = new Image();
    qrImg.src = logo;
    await new Promise(r => (qrImg.onload = r));

    const ratio = 600 / 120;
    const maxWidth = 300;

    const height = maxWidth / ratio;

    const imgCtx = ctx.drawImage(qrImg, 10, 10, maxWidth, height)

    // ctx.font = "500 16px Manrope";
    // ctx.fillText(
    //   text || "",
    //   canvas.width - 360,
    //   canvas.height - 30
    // );


  }
}
