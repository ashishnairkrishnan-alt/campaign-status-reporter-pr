"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

// Mobile phone frame with 9:16 content — matches Instagram/Facebook Reels/Stories spec

interface MobilePreviewProps {
  thumbnailUrl?: string;
  videoUrl?: string;
  adName: string;
}

export function MobilePreview({ thumbnailUrl, videoUrl, adName }: MobilePreviewProps) {
  const videoRef             = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted]     = useState(true);

  function togglePlay() {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); }
    else          { videoRef.current.play(); setPlaying(true); }
  }

  function toggleMute() {
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    setMuted((m) => !m);
  }

  return (
    // Phone outer shell
    <div className="flex justify-center py-4">
      <div
        className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border-[6px] border-navy-900"
        style={{ width: "240px", height: "calc(240px * 16/9)" }}
      >
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-navy-900 rounded-b-xl z-10" />

        {/* Content area — 9:16 */}
        <div className="absolute inset-0 bg-black">
          {videoUrl ? (
            <>
              <video
                ref={videoRef}
                src={videoUrl}
                poster={thumbnailUrl}
                muted={muted}
                loop
                playsInline
                className="w-full h-full object-cover"
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
              />
              {/* Video controls overlay */}
              <div className="absolute inset-0 flex flex-col justify-between p-3">
                {/* Mute top-right */}
                <div className="flex justify-end">
                  <button
                    onClick={toggleMute}
                    className="w-7 h-7 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm"
                  >
                    {muted
                      ? <VolumeX className="w-3.5 h-3.5 text-white" />
                      : <Volume2 className="w-3.5 h-3.5 text-white" />}
                  </button>
                </div>
                {/* Play/pause centre */}
                {!playing && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button
                      onClick={togglePlay}
                      className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm"
                    >
                      <Play className="w-5 h-5 text-white ml-0.5" />
                    </button>
                  </div>
                )}
                {playing && (
                  <button
                    onClick={togglePlay}
                    className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                  >
                    <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                      <Pause className="w-5 h-5 text-white" />
                    </div>
                  </button>
                )}
              </div>
            </>
          ) : thumbnailUrl ? (
            <Image src={thumbnailUrl} alt={adName} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-navy-900">
              <span className="text-white/30 text-xs text-center px-4">No preview available</span>
            </div>
          )}
        </div>

        {/* Facebook-style overlay UI */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-white/20" />
            <div className="flex-1">
              <div className="text-white text-[9px] font-semibold truncate">{adName}</div>
              <div className="text-white/60 text-[8px]">Sponsored</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
