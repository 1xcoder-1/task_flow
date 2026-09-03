"use client";

import { useEffect, useState } from "react";
import { useUser, useOrganization } from "@clerk/nextjs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCircle2, ShieldCheck, ArrowRight, Building2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const WelcomeBannerModal = () => {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { organization, membership } = useOrganization();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isUserLoaded || !user?.id) return;

    // Per-session login key: shows whenever any user (Admin or Member) logs in / opens app session
    const sessionKey = `welcome_modal_session_v4_${user.id}`;
    const alreadyShownInSession = sessionStorage.getItem(sessionKey);

    if (!alreadyShownInSession) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isUserLoaded, user?.id]);

  const handleClose = () => {
    if (user?.id) {
      const sessionKey = `welcome_modal_session_v4_${user.id}`;
      sessionStorage.setItem(sessionKey, "true");
    }
    setIsOpen(false);
  };

  if (!isUserLoaded || !user) return null;

  const roleName = membership?.role === "org:admin" ? "Workspace Admin" : "Team Member";
  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border border-slate-200/80 rounded-2xl bg-white text-slate-800 shadow-xl">
        {/* Clean Professional Header */}
        <div className="relative p-6 pt-6 bg-slate-50/80 text-center border-b border-slate-100">
          {/* Urdu Calligraphy Badge */}
          <div className="inline-flex items-center gap-x-2 bg-emerald-50 border border-emerald-200/80 px-4 py-1.5 rounded-full mb-2.5 shadow-2xs">
            <span className="text-xl sm:text-2xl font-serif font-bold text-emerald-700 tracking-wider">
              اَلسَّلَامُ عَلَيْكُمْ
            </span>
          </div>

          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Welcome Back!
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {todayFormatted}
          </p>
        </div>

        {/* User Information & Quick Status */}
        <div className="p-5 space-y-4 bg-white">
          <div className="flex items-center gap-x-3.5 p-3.5 bg-slate-50/80 border border-slate-200/70 rounded-xl">
            <Avatar className="h-11 w-11 border border-emerald-300 shadow-2xs shrink-0">
              <AvatarImage src={user.imageUrl} />
              <AvatarFallback className="bg-emerald-600 text-white font-bold">
                {user.firstName?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 space-y-1">
              <span className="font-bold text-sm text-slate-800 truncate leading-snug">
                {user.fullName || user.firstName || "Member"}
              </span>
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="inline-flex items-center gap-x-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 text-[11px]">
                  <ShieldCheck className="h-3 w-3 text-emerald-600" />
                  {roleName}
                </span>
                {organization?.name && (
                  <span className="inline-flex items-center gap-x-1 text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60 text-[11px]">
                    <Building2 className="h-3 w-3 text-slate-500" />
                    {organization.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Status Cards */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-x-2.5 bg-slate-50/50 p-2.5 rounded-xl border border-slate-200/60 text-slate-700">
              <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="font-medium">Have a productive and successful day ahead!</span>
            </div>
            <div className="flex items-center gap-x-2.5 bg-slate-50/50 p-2.5 rounded-xl border border-slate-200/60 text-slate-700">
              <CheckCircle2 className="h-4 w-4 text-sky-600 shrink-0" />
              <span className="font-medium">Your workspace dashboard is live and ready.</span>
            </div>
          </div>

          {/* Clean Professional Action Button */}
          <Button
            onClick={handleClose}
            className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-x-2 text-xs mt-2"
          >
            <span>Continue to Workspace</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
