"use client";

import dynamic from "next/dynamic";

const GeoapifyMap = dynamic(() => import("./GeoapifyMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[500px] items-center justify-center text-gray-500">
      Loading map...
    </div>
  ),
});

export default function MapSection() {
  return <GeoapifyMap />;
}
