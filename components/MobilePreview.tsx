"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

// 9:16 phone frame — matches Meta Reels / Stories / Feed portrait spec

interface MobilePreviewProps {
  thumbnailUrl?: string;
  videoUrl?: string;
  adName: string;
}

export function MobilePreview({ thumbnailUrl, videoUrl, adName }: MobilePreviewProps) {
  const videoRef              = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted]     = useState(true);

  function togglePlay() {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); }
    else         { videoRef.current.play();  setPlaying(true);  }
  }

  function toggleMute() {
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    setMuted((m) => !m);
  }

  // Phone width fixed at 220px → height = 220 * (16/9) ≈ 391px  (portrait 9:16)
  const W = 220;
  const H = Math.round(W * (16 / 9));

  return (
    <div className="flex justify-center items-center py-6 bg-surface">
      {/* Outer shell */}
      <div
        style={{
          width:  `${W}px`,
          height: `${H}px`,
          borderRadius: "2rem",
          border: "6px solid #0d1b2a",
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          position: "relative",
          backgroundColor: "#000",
          flexShrink: 0,
        }}
      >
        {/* Notch */}
        <div style={{
          position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
          width: "60px", height: "14px", backgroundColor: "#0d1b2a",
          borderBottomLeftRadius: "8px", borderBottomRightRadius: "8px", zIndex: 10,
        }} />

        {/* Content */}
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            poster={thumbnailUrl}
            muted={muted}
            loop
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />
        ) : thumbnailUrl ? (
          <Image src={thumbnailUrl} alt={adName} fill style={{ objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", textAlign: "center", padding: "0 12px" }}>
              No preview available
            </span>
          </div>
        )}

        {/* Overlay controls */}
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "14px 10px 10px" }}>
          {/* Top-right mute */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={toggleMute}
              style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.45)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {muted
                ? <VolumeX style={{ width: "13px", height: "13px", color: "#fff" }} />
                : <Volume2 style={{ width: "13px", height: "13px", color: "#fff" }} />}
            </button>
          </div>

          {/* Centre play/pause */}
          {!playing ? (
            <button onClick={togglePlay}
              style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.5)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Play style={{ width: "20px", height: "20px", color: "#fff", marginLeft: "2px" }} />
            </button>
          ) : (
            <button onClick={togglePlay}
              style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.4)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0 }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}>
              <Pause style={{ width: "20px", height: "20px", color: "#fff" }} />
            </button>
          )}

          {/* Bottom — Facebook-style UI */}
          <div style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)", borderRadius: "0 0 1.5rem 1.5rem", margin: "-10px", padding: "24px 10px 10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.25)", flexShrink: 0 }} />
              <div>
                <div style={{ color: "#fff", fontSize: "9px", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "130px" }}>{adName}</div>
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "8px" }}>Sponsored</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
