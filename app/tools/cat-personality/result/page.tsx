"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaFacebookF, FaInstagram, FaLine, FaThreads } from "react-icons/fa6";
import { HiArrowDownTray, HiLink } from "react-icons/hi2";
import { CAT_PERSONALITIES } from "@/lib/cat-personality/results";
import { scoreQuiz } from "@/lib/cat-personality/score";
import { createPersonalityShareCard, downloadPersonalityShareCard } from "@/lib/cat-personality/share-card";
import { clearQuizAnswers, loadQuizAnswers } from "@/lib/cat-personality/storage";
import type { AxisLetter, QuizResult } from "@/lib/cat-personality/types";
import {
  cloudSharingConfigured,
  cloudShareUrl,
  threadsOAuthUrl,
  uploadCloudShareCard,
  type CloudShareCard,
} from "@/lib/share/cloud";

const AXIS_LABELS: Record<AxisLetter, string> = {
  E: "迎賓社交",
  I: "獨處充電",
  S: "熟悉務實",
  N: "好奇探索",
  T: "目標自主",
  F: "關係共感",
  J: "規律可預測",
  P: "隨興應變",
};

type ImageSharePlatform = "facebook" | "instagram" | "threads";

export default function CatPersonalityResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<QuizResult | null>(null);
  const [sharing, setSharing] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  const [shareBlob, setShareBlob] = useState<Blob | null>(null);
  const [cloudShare, setCloudShare] = useState<CloudShareCard | null>(null);
  const [cloudFallback, setCloudFallback] = useState(false);

  useEffect(() => {
    const answers = loadQuizAnswers();
    if (!answers) {
      router.replace("/tools/cat-personality/quiz");
      return;
    }
    try {
      const scored = scoreQuiz(answers);
      queueMicrotask(() => setResult(scored));
    } catch {
      router.replace("/tools/cat-personality/quiz");
    }
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

  if (!result) {
    return <main className="personality-result-page"><p className="result-loading">正在整理牠的貓格……</p></main>;
  }

  const personality = CAT_PERSONALITIES[result.code];
  const restart = () => {
    clearQuizAnswers();
    router.push("/tools/cat-personality/quiz");
  };
  const getShareUrl = (source = "share-card") => {
    const url = new URL("/tools/cat-personality", window.location.origin);
    url.searchParams.set("ref", source);
    return url.toString();
  };
  const getActiveShareUrl = (source: string) => cloudShare
    ? cloudShareUrl(cloudShare, source)
    : getShareUrl(source);
  const makeCard = () => createPersonalityShareCard(personality, result, getShareUrl());
  const shareCopy = `我家主子是「${personality.name}」${personality.code}！你家主子是哪一型？`;
  const openSharePage = (url: string, label: string) => {
    window.open(url, "_blank", "noopener,noreferrer,width=720,height=720");
    setShareOpen(false);
    setShareStatus(`已開啟 ${label} 分享頁。`);
  };
  const shareToLine = () => {
    const shareUrl = getActiveShareUrl("line");
    setShareOpen(false);
    setShareStatus("正在開啟 LINE 分享畫面。");
    window.location.assign(`https://line.me/R/share?text=${encodeURIComponent(`${shareCopy}\n${shareUrl}`)}`);
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
            title: `16 型貓格｜${personality.name}`,
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
    const shareUrl = getActiveShareUrl(platform);
    if (platform === "facebook" && cloudShare) {
      openSharePage(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "Facebook");
      return;
    }
    if (platform === "threads" && cloudShare?.capabilities.threadsOAuth) {
      window.location.assign(threadsOAuthUrl(cloudShare));
      return;
    }
    const file = new File([shareBlob], `16型貓格-${personality.code}.png`, { type: "image/png" });
    const canShareFile = typeof navigator.share === "function"
      && typeof navigator.canShare === "function"
      && navigator.canShare({ files: [file] });
    if (canShareFile) {
      setSharing(true);
      navigator.share({ title: `16 型貓格｜${personality.name}`, text: shareCopy, url: shareUrl, files: [file] })
        .then(() => {
          setShareStatus(platform === "instagram" ? "圖卡已交給分享選單，可接著選限時動態。" : "圖卡與文案已交給分享選單。");
          setShareOpen(false);
        })
        .catch((error: unknown) => {
          if (!(error instanceof DOMException && error.name === "AbortError")) {
            setShareStatus("分享沒有完成，請改用下載圖片。");
          }
        })
        .finally(() => setSharing(false));
      return;
    }
    downloadPersonalityShareCard(shareBlob, personality.code);
    if (platform === "facebook") {
      openSharePage(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "Facebook");
      setShareStatus("圖卡已下載；請在 Facebook 手動加入圖片。");
    } else if (platform === "threads") {
      window.location.assign(`https://www.threads.net/intent/post?text=${encodeURIComponent(`${shareCopy} ${shareUrl}`)}`);
    } else {
      setShareOpen(false);
      setShareStatus("圖卡已下載，請從 Instagram 上傳。");
    }
  };
  const download = async () => {
    setSharing(true);
    setShareStatus("");
    try {
      const blob = shareBlob ?? await makeCard();
      setShareBlob(blob);
      downloadPersonalityShareCard(blob, personality.code);
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
    } catch {
      const inputElement = document.createElement("textarea");
      inputElement.value = shareUrl;
      inputElement.style.position = "fixed";
      inputElement.style.opacity = "0";
      document.body.appendChild(inputElement);
      inputElement.select();
      document.execCommand("copy");
      inputElement.remove();
    }
    setShareStatus("連結已複製。");
    setShareOpen(false);
  };

  return (
    <main className="personality-result-page">
      <div className="personality-result-shell">
        <Link className="back-link" href="/tools/cat-personality">← 回到 16 型貓格</Link>

        <section className="personality-result-card" aria-labelledby="personality-result-title">
          <div className="personality-result-art">
            <Image src={personality.image} alt={personality.imageAlt} width={1024} height={1024} priority />
          </div>
          <div className="personality-result-copy">
            <p className="eyebrow">牠的貓格是</p>
            <span>{personality.code}</span>
            <h1 id="personality-result-title">{personality.name}</h1>
            <p>{personality.description}</p>
          </div>
        </section>

        <section className="personality-axes" aria-label="四個貓格向度">
          {result.axes.map((axis) => {
            const leftPercentage = Math.round((axis.leftScore / 9) * 100);
            return (
              <div className="personality-axis" key={`${axis.left}${axis.right}`}>
                <div>
                  <b className={axis.preferred === axis.left ? "is-preferred" : ""}>{AXIS_LABELS[axis.left]}</b>
                  <span>{axis.leftScore}：{axis.rightScore}</span>
                  <b className={axis.preferred === axis.right ? "is-preferred" : ""}>{AXIS_LABELS[axis.right]}</b>
                </div>
                <div className="personality-axis-track" aria-label={`${AXIS_LABELS[axis.left]} ${axis.leftScore}，${AXIS_LABELS[axis.right]} ${axis.rightScore}`}>
                  <span style={{ width: `${leftPercentage}%` }} />
                </div>
              </div>
            );
          })}
        </section>

        <div className="personality-result-actions">
          <button className="primary-action" type="button" aria-haspopup="dialog" aria-expanded={shareOpen} disabled={sharing} onClick={prepareShare}>分享結果</button>
          <button className="secondary-action" type="button" disabled={sharing} onClick={download}>下載圖卡</button>
          <button className="quiet-action" type="button" onClick={restart}>重新測驗</button>
          {shareStatus && <p role="status">{shareStatus}</p>}
        </div>
      </div>

      {shareOpen && (
        <div className="share-overlay" role="presentation" onMouseDown={() => setShareOpen(false)}>
          <section className="share-sheet" role="dialog" aria-modal="true" aria-labelledby="personality-share-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="share-sheet-heading">
              <div>
                <p className="eyebrow">選擇分享方式</p>
                <h2 id="personality-share-title">分享牠的貓格</h2>
              </div>
              <button type="button" aria-label="關閉分享選單" onClick={() => setShareOpen(false)}>×</button>
            </div>
            <div className="platform-grid">
              <button type="button" disabled={sharing || !shareBlob} onClick={() => shareImage("facebook")}><span className="platform-icon facebook"><FaFacebookF aria-hidden="true" /></span><b>Facebook</b></button>
              <button type="button" disabled={sharing || !shareBlob} onClick={shareToLine}><span className="platform-icon line"><FaLine aria-hidden="true" /></span><b>LINE</b></button>
              <button type="button" disabled={sharing || !shareBlob} onClick={() => shareImage("instagram")}><span className="platform-icon instagram"><FaInstagram aria-hidden="true" /></span><b>Instagram</b></button>
              <button type="button" disabled={sharing || !shareBlob} onClick={() => shareImage("threads")}><span className="platform-icon threads"><FaThreads aria-hidden="true" /></span><b>Threads</b></button>
            </div>
            <p className="share-platform-note">
              {sharing ? "正在準備圖卡與分享連結……" : cloudShare ? "已建立 7 天有效的公開結果連結。" : cloudFallback ? "公開分享目前已停用，已切回手機分享。" : "手機會開啟分享選單；Instagram 可接著選限時動態。"}
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
