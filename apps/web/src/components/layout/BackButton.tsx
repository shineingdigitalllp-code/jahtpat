"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useGoBack } from "@/hooks/use-go-back";

export function BackButton() {
  const goBack = useGoBack();

  return (
    <Button variant="glass" size="icon" aria-label="Go back" onClick={goBack}>
      <ArrowLeft aria-hidden className="size-5" />
    </Button>
  );
}
