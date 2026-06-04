"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { brands } from "@/config/brands";
import { Settings } from "lucide-react";

export function BrandSwitcher() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      <p className="text-[10px] font-medium uppercase tracking-widest text-navy-400 mb-2 px-3">
        Brands
      </p>
      {brands.map((brand) => {
        const isActive = pathname.startsWith(`/dashboard/${brand.id}`);
        return (
          <Link
            key={brand.id}
            href={`/dashboard/${brand.id}`}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
              isActive
                ? "bg-surface-3 text-white"
                : "text-navy-300 hover:text-white hover:bg-surface-2"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 transition-all ${
                isActive ? "scale-125" : "opacity-60 group-hover:opacity-100"
              }`}
              style={{ backgroundColor: brand.color }}
            />
            {brand.label}
            {isActive && (
              <span
                className="ml-auto w-1 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: brand.color }}
              />
            )}
          </Link>
        );
      })}

      <div className="mt-4 pt-4 border-t border-navy-700">
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
            pathname === "/settings"
              ? "bg-surface-3 text-white"
              : "text-navy-400 hover:text-white hover:bg-surface-2"
          }`}
        >
          <Settings className="w-3.5 h-3.5 flex-shrink-0" />
          Settings
        </Link>
      </div>
    </nav>
  );
}
