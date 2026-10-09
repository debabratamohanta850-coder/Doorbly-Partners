import React from 'react';
import { usePartner } from '../../context/PartnerContext';
import { ShieldAlert, Phone, MapPin, AlertTriangle, X, Share2 } from 'lucide-react';

interface EmergencySOSModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencySOSModal: React.FC<EmergencySOSModalProps> = ({ isOpen, onClose }) => {
  const { location, activeJob, partner } = usePartner();

  if (!isOpen) return null;

  const lat = location?.latitude || 0;
  const lng = location?.longitude || 0;
  const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;

  const emergencySmsBody = encodeURIComponent(
    `EMERGENCY ALERT: Doorbly Partner ${partner?.name || ''} (${partner?.mobile || ''}) needs immediate assistance. Location: ${mapsLink}${
      activeJob ? ` | Active Job #${activeJob.id.substring(0, 8)} at ${activeJob.customer_location_address}` : ''
    }`
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border-2 border-rose-500 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-600">
            <ShieldAlert className="w-6 h-6 stroke-[2.5]" />
            <h3 className="font-extrabold text-lg text-slate-900">
              Emergency SOS
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600">
          For critical safety situations, medical emergencies, or physical threats.
        </p>

        {/* Current GPS Coordinates Box */}
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>Current Partner Coordinates</span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            {lat !== 0 ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : 'Detecting GPS coordinates...'}
          </p>
          {activeJob && (
            <p className="text-[11px] text-slate-600 pt-1 border-t border-slate-200 mt-1">
              At: {activeJob.customer_location_address}
            </p>
          )}
        </div>

        {/* Emergency Buttons */}
        <div className="space-y-2.5 pt-1">
          {/* Call Police 112 */}
          <a
            href="tel:112"
            className="w-full py-3.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all"
          >
            <Phone className="w-4 h-4" />
            <span>CALL POLICE (112)</span>
          </a>

          {/* Call Doorbly Safety Line */}
          <a
            href="tel:18002083333"
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all"
          >
            <Phone className="w-3.5 h-3.5 text-teal-400" />
            <span>DOORBLY 24x7 SAFETY HELPLINE</span>
          </a>

          {/* SMS Coordinates to Emergency Contact */}
          <a
            href={`sms:?body=${emergencySmsBody}`}
            className="w-full py-2.5 px-4 border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Send Location via SMS</span>
          </a>
        </div>
      </div>
    </div>
  );
};
