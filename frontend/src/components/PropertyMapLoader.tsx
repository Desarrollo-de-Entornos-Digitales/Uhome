"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const PropertyMap = dynamic(() => import("./PropertyMap"), {
  ssr: false,
  loading: () => (
    <div className="h-72 animate-pulse rounded-2xl bg-gray-100" />
  ),
});

export default function PropertyMapLoader(
  props: ComponentProps<typeof PropertyMap>,
) {
  return <PropertyMap {...props} />;
}
