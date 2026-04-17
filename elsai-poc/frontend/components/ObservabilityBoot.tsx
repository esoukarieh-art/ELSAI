"use client";

import { useEffect } from "react";

import { initObservability } from "@/lib/observability";

export default function ObservabilityBoot() {
  useEffect(() => {
    initObservability();
  }, []);
  return null;
}
