import React, { useState, useEffect } from 'react';
import { TrustLogEntry, DonorProfile, FoodBatch } from '../types/batch';
import {
  verifyTrustChain,
  VerificationResult,
} from '../utils/cryptoLog';
import { formatDateTime } from '../utils/spoilage';
import {
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  Download,
  AlertTriangle,
  FileCode,
  CheckCircle2,
  Lock,
  Key,
  Flame,
  Layers,
  ChevronDown,
  ChevronUp,
  Fingerprint,
  Award,
  Thermometer,
  Clock,
  Sparkles,
} from 'lucide-react';

interface TrustLogTabProps {
  trustLog: TrustLogEntry[];
  donorProfile: DonorProfile;
  batches: FoodBatch[];
  onTamperLog: (entryIndex: number, field: string, newVal: any) => void;
  onRestoreLog: () => void;
  onResetLog: () => void;
  demoSigningKey: string;
}

export const TrustLogTab: React.FC<TrustLogTabProps> = ({
  trustLog,
  donorProfile,
  batches,
  onTamperLog,
  onRestoreLog,
  onResetLog,
  demoSigningKey,
}) => {
  const [verification, setVerification] = useState<VerificationResult>({
    isValid: true,
    brokenAtIndex: null,
    totalEntries: trustLog.length,
  });

  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [selectedEntryIndex, setSelectedEntryIndex] = useState<number | null>(null);
  const [tamperModalOpen, setTamperModalOpen] = useState<boolean>(false);
  const [tamperTargetIndex, setTamperTargetIndex] = useState<number>(0);
  const [tamperField, setTamperField] = useState<string>('temperatureC');
  const [tamperNewValue, setTamperNewValue] = useState<string>('48.5');

  // Verify chain on mount and whenever trustLog changes
  const runVerification = async () => {
    setIsVerifying(true);
    const result = await verifyTrustChain(trustLog);
    setVerification(result);
    setIsVerifying(false);
  };

  useEffect(() => {
    runVerification();
  }, [trustLog]);

  // Trust Score calculation based on the 4 components:
  // 1. FSSAI licence valid (+25)
  // 2. Percent of handovers with verified temp (+25)
  // 3. Percent of handovers within safe clock (+25)
  // 4. Hash chain intact (+25)
  const isFssaiValid = /^\d{14}$/.test(donorProfile?.fssaiNumber?.trim() || '');
  const fssaiScore = isFssaiValid ? 25 : 0;

  const handoverEntries = trustLog.filter((e) => e.eventType === 'HANDOVER_CONFIRMED');
  const verifiedTempCount = handoverEntries.filter(
    (e) => typeof e.payload?.handoverTempC === 'number' && !isNaN(e.payload.handoverTempC)
  ).length;
  const tempScore =
    handoverEntries.length > 0
      ? Math.round((verifiedTempCount / handoverEntries.length) * 25)
      : 25;

  const safeCount = handoverEntries.filter(
    (e) => e.payload?.withinSafeWindow !== false && !e.payload?.isOverride
  ).length;
  const safeClockScore =
    handoverEntries.length > 0
      ? Math.round((safeCount / handoverEntries.length) * 25)
      : 25;

  const chainScore = verification.isValid ? 25 : 0;
  const totalTrustScore = fssaiScore + tempScore + safeClockScore + chainScore;

  const badgeInfo =
    totalTrustScore >= 90
      ? { label: 'FSSAI Audit Ready', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300' }
      : totalTrustScore >= 70
      ? { label: 'Good', bg: 'bg-amber-100 text-amber-900 border-amber-300' }
      : { label: 'Needs Attention', bg: 'bg-red-100 text-red-900 border-red-300' };

  const handleExportJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(trustLog, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `annachakra-trustlog-${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleApplyTamper = () => {
    let parsedVal: any = tamperNewValue;
    if (!isNaN(Number(tamperNewValue))) {
      parsedVal = Number(tamperNewValue);
    }
    onTamperLog(tamperTargetIndex, tamperField, parsedVal);
    setTamperModalOpen(false);
  };

  const isTampered = trustLog.some((e) => e.isTampered);

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#0F5132]/10 text-[#0F5132] flex items-center justify-center">
                <Fingerprint className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                <span>Tamper-Proof Trust Log ("Prove")</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                  SHA-256 Hash Chain
                </span>
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Cryptographically linked immutable audit trail for FSSAI compliance, cold-chain proofs & donor accountability
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={runVerification}
              disabled={isVerifying}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-colors"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
              <span>Verify chain</span>
            </button>

            <button
              type="button"
              onClick={handleExportJson}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0F5132] hover:bg-[#14663f] text-white text-xs font-bold shadow-2xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export log (JSON)</span>
            </button>

            <button
              type="button"
              onClick={onResetLog}
              className="p-1.5 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 text-xs"
              title="Reset demo log"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* SIH 2026 Trust Score Card (4 Components: FSSAI + Temp + Clock + Chain) */}
        <div className="p-4 rounded-2xl bg-linear-to-r from-emerald-50/80 via-white to-amber-50/60 border border-emerald-200/90 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-emerald-100">
            <div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#0F5132]" />
                <h3 className="text-sm font-extrabold text-gray-900">
                  Donor & Facility Trust Score
                </h3>
                <span
                  className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border shadow-2xs ${badgeInfo.bg}`}
                >
                  {badgeInfo.label}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Objective food-safety provenance score calculated automatically across 4 criteria (0-100)
              </p>
            </div>

            <div className="flex items-baseline gap-1 bg-white px-4 py-2 rounded-xl border border-emerald-200 shadow-2xs self-start md:self-auto">
              <span className="text-2xl font-black font-mono text-[#0F5132]">
                {totalTrustScore}
              </span>
              <span className="text-xs font-bold text-gray-400">/100</span>
            </div>
          </div>

          {/* 4 Pillars Breakdown */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-3 text-xs">
            <div className="p-2.5 bg-white rounded-xl border border-gray-100 shadow-2xs">
              <div className="flex items-center justify-between text-gray-500 text-[10px] font-bold uppercase">
                <span>1. FSSAI Licence</span>
                <span className="font-mono text-[#0F5132] font-black">+{fssaiScore}/25</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                {isFssaiValid ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                )}
                <span className="text-[11px] font-semibold text-gray-800 truncate">
                  {isFssaiValid ? '14-digit FoSCoS valid' : 'Invalid FSSAI format'}
                </span>
              </div>
            </div>

            <div className="p-2.5 bg-white rounded-xl border border-gray-100 shadow-2xs">
              <div className="flex items-center justify-between text-gray-500 text-[10px] font-bold uppercase">
                <span>2. Verified Handover Temp</span>
                <span className="font-mono text-[#0F5132] font-black">+{tempScore}/25</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="text-[11px] font-semibold text-gray-800 truncate">
                  {tempScore === 25 ? '100% core probe verified' : `${tempScore * 4}% verified`}
                </span>
              </div>
            </div>

            <div className="p-2.5 bg-white rounded-xl border border-gray-100 shadow-2xs">
              <div className="flex items-center justify-between text-gray-500 text-[10px] font-bold uppercase">
                <span>3. Within Safe Clock</span>
                <span className="font-mono text-[#0F5132] font-black">+{safeClockScore}/25</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                <span className="text-[11px] font-semibold text-gray-800 truncate">
                  {safeClockScore === 25 ? 'Zero shelf-life breaches' : 'Some clock delays'}
                </span>
              </div>
            </div>

            <div className="p-2.5 bg-white rounded-xl border border-gray-100 shadow-2xs">
              <div className="flex items-center justify-between text-gray-500 text-[10px] font-bold uppercase">
                <span>4. Hash Chain Intact</span>
                <span className="font-mono text-[#0F5132] font-black">+{chainScore}/25</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                {verification.isValid ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <ShieldAlert className="w-3.5 h-3.5 text-red-600 shrink-0" />
                )}
                <span className="text-[11px] font-semibold text-gray-800 truncate">
                  {verification.isValid ? 'Zero tamperings detected' : 'Broken hash link!'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Chain Status Strip & Tamper Test Banner */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-gray-50/80 p-4 rounded-2xl border border-gray-200/80">
          
          {/* Status Indicator */}
          <div className="md:col-span-6 flex items-center gap-3">
            {verification.isValid ? (
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-red-100 border border-red-300 flex items-center justify-center text-red-600 shrink-0 animate-pulse">
                <ShieldAlert className="w-6 h-6" />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-black ${
                    verification.isValid ? 'text-emerald-800' : 'text-red-700'
                  }`}
                >
                  {verification.isValid
                    ? `Chain Valid (${trustLog.length} verified blocks)`
                    : `Chain Broken at Entry #${verification.brokenAtIndex}`}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-white border border-gray-200 text-gray-600">
                  Genesis: OK
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {verification.isValid
                  ? 'All sequential SHA-256 hash pointers & HMAC signatures intact.'
                  : verification.reason || 'Cryptographic pointer discrepancy detected.'}
              </p>
            </div>
          </div>

          {/* Tamper Test Controls */}
          <div className="md:col-span-6 flex flex-wrap items-center justify-start md:justify-end gap-2.5">
            {isTampered ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200">
                  ⚠ Tamper Active: Edits Detected
                </span>
                <button
                  type="button"
                  onClick={onRestoreLog}
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  Restore original entry
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setTamperModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-xs rounded-xl border border-amber-300 shadow-2xs transition-colors"
              >
                <Flame className="w-3.5 h-3.5 text-[#D97706]" />
                <span>Tamper with an entry (Demo test)</span>
              </button>
            )}
          </div>

        </div>

        {/* Explanatory Principle Statement */}
        <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
          <div>
            <strong className="block text-gray-900">Why AnnaChakra Trust Log is Tamper-Proof:</strong>
            <span className="text-gray-700 leading-relaxed">
              "Changing any record breaks every hash after it, so edits cannot go unnoticed." Each block encapsulates the exact SHA-256 digest of its predecessor, creating mathematical certainty for health inspectors and recipient NGOs.
            </span>
          </div>
        </div>

      </div>

      {/* Trust Log Entries Table */}
      <div className="bg-white rounded-3xl border border-gray-200/90 overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-gray-700">
              Audit Ledger Records ({trustLog.length})
            </span>
            <span className="text-[10px] text-gray-400">Newest first</span>
          </div>
          <span className="text-[11px] text-gray-500 font-mono">
            Key: {demoSigningKey.slice(0, 14)}... (HMAC)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-100/70 text-gray-600 font-bold uppercase border-b border-gray-200">
              <tr>
                <th className="px-4 py-2.5"># & Event</th>
                <th className="px-4 py-2.5">Timestamp</th>
                <th className="px-4 py-2.5">Actor</th>
                <th className="px-4 py-2.5">Batch / Item</th>
                <th className="px-4 py-2.5">Payload Summary</th>
                <th className="px-4 py-2.5">SHA-256 Hash</th>
                <th className="px-4 py-2.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono">
              {trustLog
                .slice()
                .reverse()
                .map((entry) => {
                  const isEntryTampered = entry.isTampered;
                  const isBrokenPoint = verification.brokenAtIndex === entry.index;
                  const isSubsequentBroken =
                    verification.brokenAtIndex !== null &&
                    entry.index >= verification.brokenAtIndex;

                  return (
                    <React.Fragment key={entry.index}>
                      <tr
                        className={`transition-colors ${
                          isEntryTampered
                            ? 'bg-red-100/80 font-bold'
                            : isSubsequentBroken
                            ? 'bg-red-50/50'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                isSubsequentBroken
                                  ? 'bg-red-600 text-white'
                                  : 'bg-gray-200 text-gray-700'
                              }`}
                            >
                              #{entry.index}
                            </span>
                            <span className="font-sans font-extrabold text-xs text-gray-900 block truncate max-w-[140px]">
                              {entry.eventType}
                            </span>
                          </div>
                          {isEntryTampered && (
                            <span className="text-[9px] font-sans font-bold text-red-700 block mt-0.5">
                              [TAMPERED DATA]
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-gray-500 text-[11px] font-sans">
                          {formatDateTime(entry.timestamp)}
                        </td>

                        <td className="px-4 py-3 font-sans">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              entry.actor === 'donor'
                                ? 'bg-emerald-100 text-emerald-900'
                                : entry.actor === 'receiver'
                                ? 'bg-blue-100 text-blue-900'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {entry.actor}
                          </span>
                        </td>

                        <td className="px-4 py-3 font-sans font-bold text-gray-900">
                          {entry.dishName}
                        </td>

                        <td className="px-4 py-3 font-sans text-gray-600 text-[11px] max-w-xs truncate">
                          {JSON.stringify(entry.payload)}
                        </td>

                        <td className="px-4 py-3 text-[10px] text-gray-500">
                          <span
                            className={`px-1.5 py-0.5 rounded ${
                              isSubsequentBroken ? 'bg-red-200 text-red-950 font-bold' : 'bg-gray-100'
                            }`}
                            title={entry.hash}
                          >
                            ...{entry.hash.slice(-8)}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right font-sans">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedEntryIndex(
                                selectedEntryIndex === entry.index ? null : entry.index
                              )
                            }
                            className="text-[#0F5132] hover:underline font-bold text-xs"
                          >
                            {selectedEntryIndex === entry.index ? 'Close' : 'Inspect'}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Block Inspector */}
                      {selectedEntryIndex === entry.index && (
                        <tr className="bg-gray-50">
                          <td colSpan={7} className="p-4 sm:p-5">
                            <div className="p-4 bg-white rounded-2xl border border-gray-200 space-y-3 font-sans text-xs">
                              <div className="flex items-center justify-between border-b pb-2">
                                <span className="font-extrabold text-sm text-gray-900">
                                  Cryptographic Block Inspector #{entry.index} ({entry.eventType})
                                </span>
                                <span className="font-mono text-[10px] text-gray-500">
                                  Actor: {entry.actor}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-[11px]">
                                <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200 break-all">
                                  <span className="text-[10px] font-sans font-bold text-gray-500 block uppercase">
                                    Current Block Hash (SHA-256)
                                  </span>
                                  <span className="text-[#0F5132] font-bold">{entry.hash}</span>
                                </div>

                                <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200 break-all">
                                  <span className="text-[10px] font-sans font-bold text-gray-500 block uppercase">
                                    Previous Block Hash Pointer
                                  </span>
                                  <span className="text-gray-700">{entry.previousHash}</span>
                                </div>
                              </div>

                              <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200 font-mono text-[11px] break-all">
                                <span className="text-[10px] font-sans font-bold text-gray-500 block uppercase">
                                  Digital HMAC-SHA-256 Signature (Demo Key)
                                </span>
                                <span className="text-amber-800 font-bold">{entry.signature}</span>
                              </div>

                              <div>
                                <span className="text-[10px] font-sans font-bold text-gray-500 block uppercase mb-1">
                                  Canonical Payload JSON:
                                </span>
                                <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl overflow-x-auto text-[11px] font-mono">
                                  {JSON.stringify(entry.payload, null, 2)}
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tamper Modal Dialog */}
      {tamperModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center gap-2 text-amber-900">
              <Flame className="w-5 h-5 text-amber-600" />
              <h3 className="text-lg font-black">Tamper Simulation Test</h3>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Select an entry and alter its recorded temperature or quantity without re-signing. Watch how the cryptographic chain immediately breaks at that point and all subsequent records turn RED.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Target Entry:</label>
                <select
                  value={tamperTargetIndex}
                  onChange={(e) => setTamperTargetIndex(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-xl bg-gray-50 font-bold"
                >
                  {trustLog.map((e) => (
                    <option key={e.index} value={e.index}>
                      #{e.index} - {e.eventType} ({e.dishName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Field to Alter:</label>
                <select
                  value={tamperField}
                  onChange={(e) => setTamperField(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl bg-gray-50 font-bold"
                >
                  <option value="initialTempC">initialTempC (Storage Temperature)</option>
                  <option value="quantityKg">quantityKg (Quantity in kg)</option>
                  <option value="freshnessScore">freshnessScore (Photo score)</option>
                  <option value="handoverTempC">handoverTempC (Handover probe)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Falsified Value:</label>
                <input
                  type="text"
                  value={tamperNewValue}
                  onChange={(e) => setTamperNewValue(e.target.value)}
                  placeholder="e.g. 48.5 or 99"
                  className="w-full px-3 py-2 border border-amber-300 rounded-xl bg-white font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setTamperModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleApplyTamper}
                className="px-4 py-2 text-xs font-black text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs"
              >
                Apply Tampered Value
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Honesty Footer */}
      <div className="text-center text-[11px] font-semibold text-gray-400 py-2">
        Demo data is fictional. WhatsApp, SMS and signatures are simulated. AI gives decision support, a human confirms every donation.
      </div>

    </div>
  );
};
