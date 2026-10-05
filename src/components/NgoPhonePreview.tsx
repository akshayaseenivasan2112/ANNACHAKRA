import React, { useState, useEffect } from 'react';
import {
  FoodBatch,
  Receiver,
  SpoilageCalculationResult,
  DonorProfile,
} from '../types/batch';
import {
  generateWhatsAppMessage,
  buildWhatsAppWebLink,
  AlertLanguage,
} from '../utils/whatsappMessages';
import {
  Phone,
  MessageCircle,
  Copy,
  ExternalLink,
  Check,
  CheckCheck,
  X,
  Timer,
  Info,
  DollarSign,
  Share2,
  KeyRound,
  ArrowRight,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface NgoPhonePreviewProps {
  batch: FoodBatch;
  receiver: Receiver;
  donorProfile: DonorProfile;
  spoilage: SpoilageCalculationResult;
  alertCostRupees?: number;
  onAccept: (receiver: Receiver, pickupCode: string) => void;
  onDecline: (receiver: Receiver, reason: string) => void;
  onTimeout?: (receiver: Receiver) => void;
  onGoToHandover?: (batchId: string) => void;
  onClose?: () => void;
  timeRemainingSeconds?: number;
}

export const NgoPhonePreview: React.FC<NgoPhonePreviewProps> = ({
  batch,
  receiver,
  donorProfile,
  spoilage,
  alertCostRupees = 0.15,
  onAccept,
  onDecline,
  onTimeout,
  onGoToHandover,
  onClose,
  timeRemainingSeconds = 900, // 15 mins default
}) => {
  const [language, setLanguage] = useState<AlertLanguage>('en');
  const [copied, setCopied] = useState<boolean>(false);
  const [declineReasonSelectorOpen, setDeclineReasonSelectorOpen] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(timeRemainingSeconds);
  const [localAcceptedCode, setLocalAcceptedCode] = useState<string | null>(
    batch.dispatchOffer?.status === 'accepted' ? batch.dispatchOffer.pickupCode || '4821' : null
  );

  // Timer countdown
  useEffect(() => {
    if (batch.dispatchOffer?.status === 'accepted') return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onTimeout) onTimeout(receiver);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [batch.dispatchOffer?.status, receiver, onTimeout]);

  const messageText = generateWhatsAppMessage(
    donorProfile.name,
    batch,
    receiver,
    spoilage,
    language
  );

  const waLink = buildWhatsAppWebLink(messageText, receiver.phone);

  const handleCopySMS = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleAcceptClick = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setLocalAcceptedCode(code);
    onAccept(receiver, code);
  };

  const handleDeclineReason = (reason: string) => {
    setDeclineReasonSelectorOpen(false);
    onDecline(receiver, reason);
  };

  const formatCountdownStr = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem.toString().padStart(2, '0')}`;
  };

  const isAccepted = localAcceptedCode !== null || batch.dispatchOffer?.status === 'accepted';
  const displayCode = localAcceptedCode || batch.dispatchOffer?.pickupCode || '4821';

  return (
    <div className="relative max-w-sm mx-auto bg-slate-900 rounded-[40px] p-3 shadow-2xl border-4 border-slate-700 overflow-hidden transform transition-all">
      {/* Phone Notch */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-900 rounded-full z-20 flex items-center justify-center">
        <div className="w-3 h-3 rounded-full bg-slate-800" />
      </div>

      {/* Screen Inner Frame */}
      <div className="bg-[#EFEAE2] rounded-[32px] overflow-hidden flex flex-col h-[590px] shadow-inner relative text-xs">
        
        {/* WhatsApp App Bar */}
        <div className="bg-[#075E54] text-white px-4 pt-6 pb-2.5 flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#128C7E] flex items-center justify-center font-bold text-white text-xs border border-white/20">
              {receiver.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h4 className="font-bold text-xs leading-tight text-white truncate max-w-[150px]">
                {receiver.name}
              </h4>
              <span className="text-[10px] text-emerald-200 block">online • WhatsApp Business</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Sub-header: Language Switcher & Expiry Timer */}
        <div className="bg-[#075E54]/90 px-3 py-1.5 text-white flex items-center justify-between border-t border-white/10 text-[10px]">
          {/* Language selector */}
          <div className="flex items-center bg-black/20 rounded-md p-0.5">
            {(['en', 'hi', 'ta'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={`px-1.5 py-0.5 rounded font-bold uppercase transition-colors ${
                  language === lang
                    ? 'bg-amber-400 text-gray-950 shadow-2xs'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                {lang === 'en' ? 'EN' : lang === 'hi' ? 'हिंदी' : 'தமிழ்'}
              </button>
            ))}
          </div>

          {/* 15-Minute Countdown */}
          {!isAccepted ? (
            <div className="flex items-center gap-1 text-amber-300 font-mono font-bold">
              <Timer className="w-3 h-3 text-amber-300 animate-pulse" />
              <span>Expires in {formatCountdownStr(countdown)}</span>
            </div>
          ) : (
            <span className="text-emerald-200 font-bold flex items-center gap-1">
              <Check className="w-3 h-3" /> Offer Accepted
            </span>
          )}
        </div>

        {/* WhatsApp Chat Conversation Area */}
        <div className="flex-1 p-3 overflow-y-auto space-y-3 font-sans">
          {/* Timestamp chip */}
          <div className="text-center">
            <span className="px-2.5 py-0.5 rounded-md bg-white/70 shadow-2xs text-[9px] font-bold text-gray-500 uppercase tracking-wider">
              Today • AnnaChakra Automated Gateway
            </span>
          </div>

          {/* Received Message Bubble */}
          <div className="bg-white rounded-2xl rounded-tl-xs p-3 shadow-xs border border-black/5 space-y-2 max-w-[94%]">
            <div className="text-[11px] text-gray-800 whitespace-pre-line leading-relaxed font-sans">
              {messageText}
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-[9px] text-gray-400">
              <span>AnnaChakra Verified Donor</span>
              <span className="flex items-center gap-0.5 font-mono">
                Just now <CheckCheck className="w-3 h-3 text-blue-500 inline" />
              </span>
            </div>
          </div>

          {/* When Accepted: Show Reply Bubble and 4-Digit Pickup Code */}
          {isAccepted ? (
            <div className="space-y-2.5 pt-1">
              {/* NGO Acceptance Reply Bubble */}
              <div className="ml-auto bg-[#DCF8C6] rounded-2xl rounded-tr-xs p-3 shadow-xs border border-black/5 max-w-[90%] space-y-1">
                <p className="text-[11px] text-gray-900 font-bold">
                  1 • ACCEPT. Driver dispatched for pickup!
                </p>
                <p className="text-[10px] text-gray-600">
                  ETA at donor kitchen: about {receiver.driveMinutes} minutes.
                </p>
                <div className="text-[9px] text-gray-400 text-right font-mono flex items-center justify-end gap-0.5">
                  Delivered <CheckCheck className="w-3 h-3 text-blue-500" />
                </div>
              </div>

              {/* Verified Pickup Code Card */}
              <div className="bg-white rounded-2xl p-3 border-2 border-emerald-600 shadow-md space-y-2 text-center">
                <div className="flex items-center justify-center gap-1.5 text-emerald-800 font-bold text-[11px]">
                  <KeyRound className="w-4 h-4 text-emerald-700" />
                  <span>Driver Handover Verification Code</span>
                </div>
                <div className="py-2 px-4 bg-emerald-50 rounded-xl border border-emerald-300 inline-block font-mono text-2xl font-black tracking-widest text-[#0F5132]">
                  {displayCode}
                </div>
                <p className="text-[10px] text-gray-500 leading-snug">
                  Driver must present this 4-digit code to the donor kitchen operator at the Handover desk.
                </p>
                {onGoToHandover && (
                  <button
                    type="button"
                    onClick={() => onGoToHandover(batch.id)}
                    className="w-full mt-1 py-2 px-3 bg-[#0F5132] hover:bg-[#14663f] text-white font-extrabold rounded-xl shadow-xs text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Proceed to Handover Desk</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
                  </button>
                )}
              </div>
            </div>
          ) : declineReasonSelectorOpen ? (
            /* Reason Selector for Decline */
            <div className="bg-white rounded-2xl p-3 border border-red-200 shadow-md space-y-2">
              <div className="flex items-center justify-between text-red-800 font-bold text-[11px]">
                <span className="flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Select Decline Reason:
                </span>
                <button
                  type="button"
                  onClick={() => setDeclineReasonSelectorOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-xs"
                >
                  ✕
                </button>
              </div>
              <p className="text-[10px] text-gray-500">
                Logged to Trust Log. Cascade will automatically escalate to the next best match.
              </p>
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                {[
                  'Capacity full',
                  'Cannot transport',
                  'Food type unsuitable',
                  'Off hours',
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => handleDeclineReason(reason)}
                    className="p-2 text-left bg-gray-50 hover:bg-red-50 hover:text-red-700 hover:border-red-300 text-gray-800 font-medium rounded-lg border border-gray-200 text-[10px] transition-colors leading-tight"
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Simulated Quick Action Reply Buttons */
            <div className="space-y-1.5 pt-1">
              <div className="text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Simulated NGO Response (One-Tap):
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleAcceptClick}
                  className="py-2.5 px-3 bg-[#128C7E] hover:bg-[#075E54] active:scale-95 text-white font-extrabold rounded-xl shadow-sm text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>1 • ACCEPT</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeclineReasonSelectorOpen(true)}
                  className="py-2.5 px-3 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold rounded-xl shadow-sm text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <X className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>2 • DECLINE</span>
                </button>
              </div>

              {/* Fast Timeout Trigger button for demo convenience */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => onTimeout && onTimeout(receiver)}
                  className="text-[9px] text-gray-400 hover:text-gray-600 underline"
                >
                  (Simulate 15m timeout & escalate)
                </button>
              </div>
            </div>
          )}

          {/* External Action Links: Real WhatsApp & SMS Copy */}
          <div className="pt-2 flex flex-col gap-1.5">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-3 bg-white hover:bg-emerald-50 text-[#075E54] font-bold rounded-xl border border-emerald-300 flex items-center justify-center gap-1.5 shadow-2xs text-[11px]"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in WhatsApp (wa.me)</span>
            </a>

            <button
              type="button"
              onClick={handleCopySMS}
              className="py-2 px-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl border border-gray-300 flex items-center justify-center gap-1.5 shadow-2xs text-[11px]"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Copied SMS text to clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-gray-500" />
                  <span>Send as SMS (Copy message)</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* Phone Bottom Footer: Feasibility & Simulation note */}
        <div className="bg-white/95 px-3 py-2 border-t border-gray-200/80 text-[10px] space-y-0.5">
          <div className="flex items-center justify-between text-gray-600 font-medium">
            <span className="flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-[#D97706]" />
              Alert cost estimate:
            </span>
            <span className="font-bold text-gray-900 font-mono">
              ₹{alertCostRupees.toFixed(2)} / alert
            </span>
          </div>
          <div className="text-[9px] text-gray-400 text-center italic">
            Simulated. Pilot uses WhatsApp Business API / SMS gateway.
          </div>
        </div>

      </div>
    </div>
  );
};
