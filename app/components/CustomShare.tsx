import { useEffect, useRef, useState } from "react";
import { useSharePnLScript } from "@orderly.network/ui-share";
import { renderPnLPoster } from "./renderPoster";
import { config } from "process";

const OPTIONAL = ["openPrice", "markPrice", "quantity", "leverage", "openTime"];

export function SharePnLWidget({ pnl, hide }: any) {
    const { entity, referralInfo, shareOptions } =
        useSharePnLScript({ pnl, hide });

    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [bg, setBg] = useState(0);
    const [format, setFormat] = useState<"roi" | "pnl" | "roi_pnl">("roi_pnl");
    const [enabled, setEnabled] = useState(new Set(OPTIONAL));
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!entity || !canvasRef.current) return;

        (async () => {
            const img = new Image();
            img.src = shareOptions.backgroundImages[bg];
            await img.decode();

            const { naturalWidth, naturalHeight } = img;
            console.log({ naturalWidth, naturalHeight })

            canvasRef.current.style.maxWidth = naturalWidth + "px";
            // canvasRef.current.style.height = naturalHeight + "px";

            renderPnLPoster({
                canvas: canvasRef.current!,
                bgImage: img.src,
                entity,
                format,
                enabled,
                message,
                referral: {
                    code: referralInfo?.code,
                    link: referralInfo?.link,
                },
                dimensions: { width: naturalWidth, height: naturalHeight }
            });
        })();
    }, [entity, bg, format, enabled, message]);

    if (!entity) return null;

    const download = () => {
        const a = document.createElement("a");
        a.href = canvasRef.current!.toDataURL();
        a.download = "pnl.png";
        a.click();
        hide?.();
    };

    const copy = async () => {
        const blob = await new Promise<Blob | null>(r =>
            canvasRef.current!.toBlob(r)
        );
        if (!blob) return;
        await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
        ]);
        hide?.();
    };

    return (
        <div className="oui-flex max-w-lg oui-flex-col oui-gap-4">

            {/* preview */}
            <canvas
                ref={canvasRef}
                className="oui-w-full oui-rounded-lg"
                width={960}
                height={540}

            />

            {/* backgrounds */}
            <div className="oui-overflow-hidden">
                <div className="oui-overflow-x-scroll oui-flex oui-gap-2  ">

                    {shareOptions.backgroundImages.map((b: string, i: number) => (

                        <button
                            key={b}
                            onClick={() => setBg(i)}

                            className={`oui-h-12 max-h-12 overflow-hidden h-auto oui-rounded-md oui-cursor-pointer ${i === bg ? "ring-2 ring-red-500" : ""
                                }`}
                        >

                            <img
                                className="bg-cover_ object-cover"
                                src={b}
                                alt=""
                            />
                        </button>
                    ))}
                </div>
            </div>

            {/* format */}
            <div className="oui-flex oui-gap-4">
                {["roi_pnl", "roi", "pnl"].map(f => (
                    <label key={f}>
                        <input
                            type="radio"
                            checked={format === f}
                            onChange={() => setFormat(f as any)}
                        />{" "}
                        {f.toUpperCase()}
                    </label>
                ))}
            </div>

            {/* options */}
            <div className="oui-grid oui-grid-cols-2">
                {OPTIONAL.map(k => (
                    <label key={k}>
                        <input
                            type="checkbox"
                            checked={enabled.has(k)}
                            onChange={() =>
                                setEnabled(s => {
                                    const n = new Set(s);
                                    n.has(k) ? n.delete(k) : n.add(k);
                                    return n;
                                })
                            }
                        />{" "}
                        {k}
                    </label>
                ))}
            </div>

            <input
                maxLength={25}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Your message"
                className="oui-input"
            />

            <div className="oui-flex oui-gap-4">
                <button onClick={download} className="oui-btn">
                    Download
                </button>
                <button onClick={copy} className="oui-btn-primary">
                    Copy
                </button>
            </div>
        </div>
    );
}
