"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaFacebookF, FaInstagram, FaLine, FaThreads } from "react-icons/fa6";
import { HiArrowDownTray, HiLink } from "react-icons/hi2";
import { calculateCatCost, formatDuration } from "@/lib/calculator/calculate";
import { createShareCard, downloadShareCard } from "@/lib/calculator/share-card";
import { clearInput, loadInput } from "@/lib/calculator/storage";
import type { CalculatorInput, CalculatorResult } from "@/lib/calculator/types";
import {
  cloudSharingConfigured,
  cloudShareUrl,
  threadsOAuthUrl,
  uploadCloudShareCard,
  type CloudShareCard,
} from "@/lib/share/cloud";

const currency = new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 0 });
type ImageSharePlatform = "facebook" | "instagram" | "threads";

export default function ResultPage() {
  const router = useRouter();
  const [input, setInput] = useState<CalculatorInput | null>(null);
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [sharing, setSharing] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  const [shareBlob, setShareBlob] = useState<Blob | null>(null);
  const [cloudShare, setCloudShare] = useState<CloudShareCard | null>(null);
  const [cloudFallback, setCloudFallback] = useState(false);

  useEffect(() => {
    const stored = loadInput();
    if (!stored) {
      router.replace("/tools/cat-cost/calculator");
      return;
    }
    queueMicrotask(() => {
      setInput(stored);
      setResult(calculateCatCost(stored));
    });
  }, [router]);

  useEffect(() => {
    if (!shareOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShareOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [shareOpen]);

  if (!input || !result) {
    return <main className="result-page"><p className="result-loading">正在整理你們的帳本……</p></main>;
  }

  const cat = input.catName.trim() || "主子";
  const restart = () => {
    clearInput();
    router.push("/tools/cat-cost/calculator");
  };

  const getShareUrl = (source = "share-card") => {
    const url = new URL("/tools/cat-cost", window.location.origin);
    url.searchParams.set("ref", source);
    return url.toString();
  };

  const getActiveShareUrl = (source: string) => cloudShare
    ? cloudShareUrl(cloudShare, source)
    : getShareUrl(source);

  const makeCard = () => createShareCard(input, result, getShareUrl());
  const shareCopy = `${cat}的主子帳本：估算 NT$ ${currency.format(result.estimatedHistoricalTotal)}。換你算算看`;
  const openSharePage = (url: string, label: string) => {
    window.open(url, "_blank", "noopener,noreferrer,width=720,height=720");
    setShareOpen(false);
    setShareStatus(`已開啟 ${label} 分享頁。`);
  };

  const shareToLine = () => {
    const shareUrl = getActiveShareUrl("line");
    const text = `${shareCopy}\n${shareUrl}`;
    setShareOpen(false);
    setShareStatus("正在開啟 LINE 分享畫面。");
    window.location.assign(`https://line.me/R/share?text=${encodeURIComponent(text)}`);
  };

  const platformLabels: Record<ImageSharePlatform, string> = {
    facebook: "Facebook",
    instagram: "Instagram",
    threads: "Threads",
  };

  const prepareShare = async () => {
    setShareOpen(true);
    setShareStatus("");
    if (shareBlob && (cloudShare || cloudFallback || !cloudSharingConfigured())) return;

    setSharing(true);
    try {
      const blob = shareBlob ?? await makeCard();
      setShareBlob(blob);
      if (cloudSharingConfigured() && !cloudShare && !cloudFallback) {
        try {
          const uploaded = await uploadCloudShareCard({
            image: blob,
            title: `${cat}的主子帳本`,
            caption: shareCopy,
            returnUrl: getShareUrl("shared-result"),
          });
          setCloudShare(uploaded);
        } catch {
          setCloudFallback(true);
          setShareStatus("公開分享目前已停用，已切回手機分享。");
        }
      }
    } catch {
      setShareStatus("圖片產生失敗，請關閉後再試一次。");
    } finally {
      setSharing(false);
    }
  };

  const shareImage = (platform: ImageSharePlatform) => {
    if (!shareBlob) return;

    const label = platformLabels[platform];
    const shareUrl = getActiveShareUrl(platform);

    if (platform === "facebook" && cloudShare) {
      openSharePage(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
        "Facebook",
      );
      return;
    }
    if (platform === "threads" && cloudShare?.capabilities.threadsOAuth) {
      window.location.assign(threadsOAuthUrl(cloudShare));
      return;
    }
    const safeCat = cat.replace(/[\\/:*?"<>|]/g, "-");
    const file = new File([shareBlob], `主子帳本-${safeCat}.png`, { type: "image/png" });
    const canShareFile = typeof navigator.share === "function"
      && typeof navigator.canShare === "function"
      && navigator.canShare({ files: [file] });

    if (canShareFile) {
      setSharing(true);
      navigator.share({
          title: `${cat}的主子帳本`,
          text: shareCopy,
          url: shareUrl,
          files: [file],
        })
        .then(() => {
          const destinationHint = platform === "instagram" ? "，在 Instagram 內可選限時動態" : "";
          setShareStatus(`圖卡與文案已交給分享選單${destinationHint}。`);
          setShareOpen(false);
        })
        .catch((error: unknown) => {
          if (!(error instanceof DOMException && error.name === "AbortError")) {
            setShareStatus(`${label} 分享沒有完成，請改用下載圖片。`);
          }
        })
        .finally(() => setSharing(false));
      return;
    }

    downloadShareCard(shareBlob, cat);
    if (platform === "facebook") {
      openSharePage(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
        "Facebook",
      );
      setShareStatus("圖卡已下載；Facebook 已開啟，請手動加入圖片。");
    } else if (platform === "threads") {
      window.location.assign(
        `https://www.threads.net/intent/post?text=${encodeURIComponent(`${shareCopy} ${shareUrl}`)}`,
      );
    } else {
      setShareOpen(false);
      setShareStatus("圖卡已下載，請從 Instagram 限時動態上傳。");
    }
  };

  const download = async () => {
    setSharing(true);
    setShareStatus("");
    try {
      const blob = shareBlob ?? await makeCard();
      downloadShareCard(blob, cat);
      setShareStatus("結果圖卡已下載。");
      setShareOpen(false);
    } catch {
      setShareStatus("圖片產生失敗，請稍後再試。");
    } finally {
      setSharing(false);
    }
  };

  const copyLink = async () => {
    const shareUrl = getActiveShareUrl("copy-link");
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareStatus("連結已複製。");
    } catch {
      const inputElement = document.createElement("textarea");
      inputElement.value = shareUrl;
      inputElement.style.position = "fixed";
      inputElement.style.opacity = "0";
      document.body.appendChild(inputElement);
      inputElement.select();
      document.execCommand("copy");
      inputElement.remove();
      setShareStatus("連結已複製。");
    }
    setShareOpen(false);
  };

  return (
    <main className="result-page">
      <section className="result-hero">
        <Link className="back-link" href="/tools/cat-cost/calculator">← 回去調整</Link>
        <p className="eyebrow">相處期間估算</p>
        <h1>你目前大約已經為<br /><em>{cat}</em> 花了</h1>
        <strong>NT$ {currency.format(result.estimatedHistoricalTotal)}</strong>
        <p>依你提供的資料與目前消費模式估算，不是一份精密帳本。</p>
      </section>

      <section className="result-metrics" aria-label="主要結果">
        <div><span>一起生活</span><b>{formatDuration(result.monthsTogether)}</b></div>
        <div><span>相處期間平均每月</span><b>NT$ {currency.format(result.avgPerMonth)}</b></div>
        <div><span>相處期間平均每天</span><b>NT$ {currency.format(result.avgPerDay)}</b></div>
        <div><span>最大支出</span><b>{result.largestCategory.label}</b></div>
      </section>

      <section className="result-breakdown">
        <div className="section-heading">
          <p className="eyebrow">錢都去了哪裡</p>
          <h2>最大的進貢項目是{result.largestCategory.label}。</h2>
          <p>約占全部估算的 {Math.round(result.largestCategory.percentage)}%。</p>
        </div>
        <ol>
          {result.categoryTotals.map((category) => (
            <li key={category.key}>
              <div>
                <span>{category.label}</span>
                <b>NT$ {currency.format(category.amount)}</b>
              </div>
              <div className="breakdown-track" aria-label={`${category.label}占 ${Math.round(category.percentage)}%`}>
                <span style={{ width: `${category.percentage}%` }} />
              </div>
              <small>{Math.round(category.percentage)}%</small>
            </li>
          ))}
        </ol>
      </section>

      <section className="share-panel">
        <div>
          <p className="eyebrow">結果圖卡</p>
          <h2>把你和主子的這些年，分享出去。</h2>
          <p>選擇社群平台，或複製連結、下載結果圖片。</p>
        </div>
        <div className="share-actions">
          <button
            className="primary-action"
            type="button"
            aria-haspopup="dialog"
            aria-expanded={shareOpen}
            disabled={sharing}
            onClick={prepareShare}
          >
            分享結果
            <span aria-hidden="true">→</span>
          </button>
          <button className="secondary-action" type="button" disabled={sharing} onClick={download}>下載圖片</button>
          <button className="quiet-action" type="button" onClick={restart}>重新計算</button>
          {shareStatus && <p role="status">{shareStatus}</p>}
        </div>
      </section>

      {shareOpen && (
        <div className="share-overlay" role="presentation" onMouseDown={() => setShareOpen(false)}>
          <section
            className="share-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="share-sheet-heading">
              <div>
                <p className="eyebrow">選擇分享方式</p>
                <h2 id="share-title">分享{cat}的主子帳本</h2>
              </div>
              <button type="button" aria-label="關閉分享選單" onClick={() => setShareOpen(false)}>×</button>
            </div>

            <div className="platform-grid">
              <button type="button" disabled={sharing || !shareBlob} onClick={() => shareImage("facebook")}>
                <span className="platform-icon facebook"><FaFacebookF aria-hidden="true" /></span>
                <b>Facebook</b>
              </button>
              <button type="button" disabled={sharing || !shareBlob} onClick={shareToLine}>
                <span className="platform-icon line"><FaLine aria-hidden="true" /></span>
                <b>LINE</b>
              </button>
              <button type="button" disabled={sharing || !shareBlob} onClick={() => shareImage("instagram")}>
                <span className="platform-icon instagram"><FaInstagram aria-hidden="true" /></span>
                <b>Instagram</b>
              </button>
              <button type="button" disabled={sharing || !shareBlob} onClick={() => shareImage("threads")}>
                <span className="platform-icon threads"><FaThreads aria-hidden="true" /></span>
                <b>Threads</b>
              </button>
            </div>

            <p className="share-platform-note">
              {sharing
                ? "正在準備圖卡與分享連結……"
                : cloudShare
                  ? "已建立 7 天有效的公開結果連結。Instagram 仍會使用手機分享選單。"
                  : cloudFallback
                    ? "公開分享目前已停用，已自動切回手機分享與圖片下載。"
                  : "手機會開啟分享選單；請再選擇剛才點的平台。Instagram 可接著選限時動態。"}
            </p>

            <div className="share-utilities">
              <button type="button" disabled={sharing} onClick={copyLink}><HiLink aria-hidden="true" /><span>複製連結</span></button>
              <button type="button" disabled={sharing} onClick={download}><HiArrowDownTray aria-hidden="true" /><span>{sharing ? "產生中…" : "下載圖片"}</span></button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
