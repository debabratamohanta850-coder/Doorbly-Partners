import React, { useState } from 'react';
import { Download, X, Smartphone, Share } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { DoorblyLogoIcon } from '../../constants/branding';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isDirectInstallLink, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(isDirectInstallLink);

  if (isInstalled || dismissed) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between gap-3 border-b border-teal-500/30 shadow-md z-40">
        <div className="flex items-center gap-2.5 min-w-0">
          <DoorblyLogoIcon className="w-8 h-8 rounded-xl shrink-0" />
          <div className="min-w-0">
            <div className="text-xs font-extrabold tracking-tight truncate">
              Install Doorbly Partner App
            </div>
            <div className="text-[10px] text-teal-300 truncate">
              Fast access, instant job alerts & home screen icon
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleInstallClick}
            className="px-3 py-1.5 rounded-xl bg-[#0F766E] hover:bg-teal-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss install banner"
            className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 text-slate-900 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DoorblyLogoIcon className="w-11 h-11 rounded-2xl shrink-0" />
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Install Doorbly Partner
                  </h3>
                  <p className="text-xs text-slate-500">Official Android & Mobile Web App</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isInstallable ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tap the button below to install the <strong>Doorbly Partner</strong> app directly onto your phone home screen.
                </p>
                <button
                  onClick={async () => {
                    await install();
                    setShowGuideModal(false);
                  }}
                  className="w-full py-3.5 bg-[#0F766E] hover:bg-teal-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Install App Now</span>
                </button>
              </div>
            ) : isIOS ? (
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5 text-xs text-slate-700">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Share className="w-4 h-4 text-[#0F766E]" />
                  <span>Install on iPhone / iPad:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-600">
                  <li>Tap the <strong>Share</strong> icon in your Safari toolbar.</li>
                  <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                  <li>Tap <strong>Add</strong> in the top-right corner.</li>
                </ol>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5 text-xs text-slate-700">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-[#0F766E]" />
                  <span>Direct Install Steps (Android / Chrome):</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-600">
                  <li>Tap the browser menu <strong>(⋮)</strong> in the top-right corner.</li>
                  <li>Select <strong>Install App</strong> or <strong>Add to Home screen</strong>.</li>
                  <li>Confirm to add <strong>Doorbly Partner</strong> to your phone.</li>
                </ol>
              </div>
            )}

            <button
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
            >
              Continue to App
            </button>
          </div>
        </div>
      )}
    </>
  );
};
