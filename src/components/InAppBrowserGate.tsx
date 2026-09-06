"use client";

import { useSyncExternalStore } from "react";
import { isEmbedded } from "@/lib/bridgeClient";

/**
 * Blocks Facebook/Messenger/Instagram in-app browsers from using the app.
 *
 * Those embedded browsers silently drop or corrupt fetch/cookie sessions
 * (which broke the age-gate) and add nothing the product wants. The Surge
 * iframe embed is explicitly exempt — it is the supported embedded context.
 */

const IN_APP_UA =
  /FBAN|FBAV|FBMD|FBSV|FBBV|FBID|FB_IAB|FB4A|FBAV|MessengerForiOS|Messenger|Instagram|Snapchat|TikTok|Line\/|Pinterest/i;

function subscribeToBrowserContext() {
  return () => {};
}

function getBrowserSnapshot() {
  return !isEmbedded() && IN_APP_UA.test(navigator.userAgent);
}

function getServerSnapshot() {
  return false;
}

export default function InAppBrowserGate() {
  const blocked = useSyncExternalStore(
    subscribeToBrowserContext,
    getBrowserSnapshot,
    getServerSnapshot,
  );

  if (!blocked) return null;

  const host =
    typeof window !== "undefined"
      ? window.location.hostname + window.location.pathname
      : "this site";

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-neutral-950 px-6">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-neutral-50">
          This site can&rsquo;t run here
        </h1>
        <p className="mt-3 text-sm leading-6 text-neutral-400">
          Social media in-app browsers block the features this site needs.
          Open it in your phone&rsquo;s real browser instead:
        </p>
        <ol className="mt-4 space-y-1 text-left text-sm text-neutral-300">
          <li>1. Tap the <span className="font-semibold text-neutral-100">•••</span> menu at the top of this screen</li>
          <li>2. Choose <span className="font-semibold text-neutral-100">Open in browser</span> / <span className="font-semibold text-neutral-100">Open in Safari</span></li>
        </ol>
        <p className="mt-4 break-all rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-neutral-500">
          {host}
        </p>
      </div>
    </div>
  );
}
