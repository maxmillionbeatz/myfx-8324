import QRCode from "qrcode";

type RenderArgs = {
    canvas: HTMLCanvasElement;
    bgImage: string;
    entity: any;
    format: "roi" | "pnl" | "roi_pnl";
    enabled: Set<string>;
    message?: string;
    referral?: {
        code?: string;
        link?: string;
    };
};

export async function renderPnLPoster({
    canvas,
    bgImage,
    entity,
    format,
    enabled,
    message,
    referral,
}: RenderArgs) {
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = bgImage;

    await new Promise(r => (img.onload = r));

    canvas.width = 1104;
    canvas.height = 620;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // overlay
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#fff";
    ctx.font = "700 42px Manrope";
    ctx.fillText(
        `${entity.side} ${entity.symbol} ${entity.leverage}x`,
        60,
        90
    );
    console.log(entity.pnl, entity.roi)

    let pnlText = "";
    if (format !== "roi") pnlText += `${entity.pnl?.toFixed(2)} USDC `;
    if (format !== "pnl") pnlText += `${entity.roi?.toFixed(2)}%`;

    ctx.font = "700 72px Manrope";
    ctx.fillStyle = entity.pnl >= 0 ? "#00e0b8" : "#ff678c";
    ctx.fillText(pnlText, 60, 160);

    ctx.font = "400 22px Manrope";
    ctx.fillStyle = "#fff";

    let y = 220;

    const add = (label: string, value: any) => {
        ctx.fillText(`${label}: ${value}`, 60, y);
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
}
