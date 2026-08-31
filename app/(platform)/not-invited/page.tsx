"use client";

import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@clerk/nextjs";

export default function NotInvitedPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl space-y-6">
        <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto text-rose-500">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold text-rose-500 tracking-widest uppercase bg-rose-500/10 px-3 py-1 rounded-full">
            404 — Access Restricted
          </span>
          <h1 className="text-2xl font-bold text-white tracking-tight">Private Application</h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            This workspace is restricted to invited team members only. Uninvited users cannot access this platform.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
          <SignOutButton>
            <Button variant="outline" className="w-full bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Sign Out & Return
            </Button>
          </SignOutButton>
        </div>
      </div>
    </div>
  );
}
