/**
 * Placeholder ad banner — styled like an AdMob native banner.
 * In production, replace the inner content with the AdMob SDK call.
 */
export default function AdBanner() {
  return (
    <div className="col-span-2 sm:col-span-3 lg:col-span-4 xl:col-span-5">
      <div className="relative flex items-center gap-3 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white px-4 py-3 overflow-hidden">
        <div className="shrink-0 w-12 h-12 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-lg">
          Ad
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide">Sponsored</p>
          <p className="text-sm font-medium text-gray-800 truncate">
            Your business here — reach thousands of buyers across Pakistan
          </p>
          <p className="text-xs text-gray-400 truncate">AdMob Banner Placeholder</p>
        </div>
        <span className="shrink-0 text-[10px] text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">
          Ad
        </span>
      </div>
    </div>
  );
}
