import type { Channel } from "@/types";

const META_ICON = (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 0 0 8.44-9.9c0-5.53-4.5-10.02-10-10.02Z" />
  </svg>
);

const GOOGLE_ICON = (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84Z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" fill="#EA4335"/>
  </svg>
);

const TIKTOK_ICON = (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34l-.01-8.46a8.17 8.17 0 0 0 4.78 1.52V5.03a4.85 4.85 0 0 1-1-.34Z" />
  </svg>
);

const icons: Record<Channel, React.ReactNode> = {
  meta: META_ICON,
  google: GOOGLE_ICON,
  tiktok: TIKTOK_ICON,
};

const colors: Record<Channel, string> = {
  meta: "text-blue-400",
  google: "",
  tiktok: "text-white",
};

const bgColors: Record<Channel, string> = {
  meta: "bg-blue-500/20",
  google: "bg-white/10",
  tiktok: "bg-black/40",
};

interface ChannelIconProps {
  channel: Channel;
  size?: "sm" | "md";
}

export function ChannelIcon({ channel, size = "sm" }: ChannelIconProps) {
  const dim = size === "sm" ? "w-5 h-5" : "w-6 h-6";
  const iconDim = size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5";
  return (
    <span
      className={`${dim} rounded-full ${bgColors[channel]} ${colors[channel]} flex items-center justify-center flex-shrink-0`}
    >
      <span className={iconDim}>{icons[channel]}</span>
    </span>
  );
}
