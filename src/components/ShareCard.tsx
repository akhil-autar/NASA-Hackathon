import { useCallback } from "react";
import { APP_NAME } from "../config";
import { Icon } from "./Icon";

interface Props {
  stars: number;
  stormDate: string; // YYYY-MM-DD
  stormLabel: string; // e.g. "X9.3 flare"
}

/**
 * Make a shareable image in the browser (canvas) with the storm date, stars
 * and the app name. No personal details. Share via the device share sheet, or
 * download as a fallback.
 */
export function ShareCard({ stars, stormDate, stormLabel }: Props) {
  const makeBlob = useCallback(async (): Promise<Blob | null> => {
    const w = 1200;
    const h = 630;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#0b0d17");
    grad.addColorStop(1, "#241019");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = "center";
    ctx.fillStyle = "#eaf0ff";
    ctx.font = "bold 64px system-ui, sans-serif";
    ctx.fillText(APP_NAME, w / 2, 140);

    ctx.font = "40px system-ui, sans-serif";
    ctx.fillStyle = "#a7b0cf";
    ctx.fillText(`${stormLabel} · ${stormDate}`, w / 2, 220);

    // Stars
    ctx.font = "120px system-ui, sans-serif";
    let row = "";
    for (let i = 0; i < 3; i++) row += i < stars ? "★" : "☆";
    ctx.fillStyle = "#ffd24a";
    ctx.fillText(row, w / 2, 400);

    ctx.font = "32px system-ui, sans-serif";
    ctx.fillStyle = "#8fb7ff";
    ctx.fillText("Data from NASA · the real Sun was the opponent", w / 2, 520);

    return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  }, [stars, stormDate, stormLabel]);

  const share = useCallback(async () => {
    const blob = await makeBlob();
    if (!blob) return;
    const file = new File([blob], "sol-watch.png", { type: "image/png" });

    const nav = navigator as Navigator & {
      canShare?: (d: { files: File[] }) => boolean;
      share?: (d: { files: File[]; title?: string }) => Promise<void>;
    };
    try {
      if (nav.canShare && nav.canShare({ files: [file] }) && nav.share) {
        await nav.share({ files: [file], title: APP_NAME });
        return;
      }
    } catch {
      // fall through to download
    }
    // Download fallback
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sol-watch.png";
    a.click();
    URL.revokeObjectURL(url);
  }, [makeBlob]);

  return (
    <button type="button" className="btn btn-secondary btn-block" onClick={share}>
      <Icon name="share" />
      Share my stars
    </button>
  );
}
