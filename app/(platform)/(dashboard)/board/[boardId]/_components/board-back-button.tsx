"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export const BoardBackButton = () => {
  const router = useRouter();

  return (
    <Button 
      onClick={() => router.back()} 
      variant="transparent" 
      className="text-white hover:bg-white/20 px-2"
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      Back
    </Button>
  );
};
