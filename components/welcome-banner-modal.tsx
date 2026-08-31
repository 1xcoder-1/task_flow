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
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border border-slate-800 rounded-3xl bg-slate-950 text-white shadow-2xl">
        {/* Sleek Minimal Header */}
        <div className="relative p-6 pt-7 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 text-center border-b border-slate-800/80">
          {/* Subtle Ambient Glow */}
          <div aria-hidden className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Urdu Calligraphy Pill */}
          <div className="inline-flex items-center gap-x-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full mb-3 shadow-sm">
            <span className="text-xl sm:text-2xl font-serif font-bold text-emerald-400 tracking-wider">
              اَلسَّلَامُ عَلَيْكُمْ
            </span>
          </div>

          <h2 className="text-2xl font-bold text-white tracking-tight">
            Welcome Back!
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-1">
            {todayFormatted}
          </p>
        </div>

        {/* User Card & Summary */}
        <div className="p-6 space-y-5 bg-slate-950">
          <div className="flex items-center gap-x-4 p-4 bg-slate-900/90 border border-slate-800 rounded-2xl">
            <Avatar className="h-12 w-12 border-2 border-emerald-500/40 shadow-sm shrink-0">
              <AvatarImage src={user.imageUrl} />
              <AvatarFallback className="bg-emerald-600 text-white font-bold">
                {user.firstName?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 space-y-1.5">
              <span className="font-extrabold text-base text-slate-100 truncate leading-snug">
                {user.fullName || user.firstName || "Member"}
              </span>
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="inline-flex items-center gap-x-1 text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {roleName}
                </span>
                {organization?.name && (
                  <span className="inline-flex items-center gap-x-1 text-slate-300 font-medium bg-slate-800 px-2.5 py-0.5 rounded-md border border-slate-700/60">
                    <Building2 className="h-3 w-3 text-slate-400" />
                    {organization.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Bullets */}
          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-x-2.5 bg-slate-900/50 p-3 rounded-xl border border-slate-800/60">
              <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Have a productive and successful day ahead!</span>
            </div>
            <div className="flex items-center gap-x-2.5 bg-slate-900/50 p-3 rounded-xl border border-slate-800/60">
              <CheckCircle2 className="h-4 w-4 text-sky-400 shrink-0" />
              <span>Your workspace dashboard is live and up-to-date.</span>
            </div>
          </div>

          {/* Clean Action Button */}
          <Button
            onClick={handleClose}
            className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-2xl shadow-lg transition-colors flex items-center justify-center gap-x-2 text-sm"
          >
            <span>Continue to Workspace</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
