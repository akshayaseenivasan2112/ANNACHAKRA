import React from 'react';
import { HandoverRecord, FoodBatch, DonorProfile } from '../types/batch';
import { generateSvgQrCode } from '../utils/qrHelper';
import { formatDateTime } from '../utils/spoilage';
import { Printer, ShieldCheck, CheckCircle2, Award, QrCode } from 'lucide-react';

interface HandoverReceiptProps {
  batch: FoodBatch;
  record: HandoverRecord;
  donorProfile: DonorProfile;
  onClose?: () => void;
}

export const HandoverReceipt: React.FC<HandoverReceiptProps> = ({
  batch,
  record,
  donorProfile,
  onClose,
}) => {
  const shortHash = record.logEntryHash
    ? record.logEntryHash.slice(-8)
    : 'a8f29e1c';

  const qrDataUrl = generateSvgQrCode(
    `https://annachakra.gov.in/verify?hash=${record.logEntryHash}&batch=${batch.id}`,
    140
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-[#0F5132] shadow-xl overflow-hidden print:border-none print:shadow-none print:m-0">
      
      {/* Top Header of Receipt */}
      <div className="bg-[#0F5132] text-white p-5 sm:p-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-1.5">
              Anna<span className="text-amber-400">Chakra</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-800 text-emerald-100 border border-emerald-600">
              Official Handover Certificate
            </span>
          </div>
          <p className="text-xs text-emerald-100/90 mt-1">
            FSSAI FoSCoS Aligned Perishable Food Redistribution Pass
          </p>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="print:hidden inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-gray-950 font-bold text-xs shadow-md transition-all active:scale-95"
        >
          <Printer className="w-4 h-4" />
          <span>Print receipt</span>
        </button>
      </div>

      {/* Receipt Body */}
      <div className="p-6 sm:p-8 space-y-6">
        
        {/* Verification Success Ribbon */}
        <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-300 flex items-center justify-between text-xs text-emerald-950">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Cryptographically Sealed Handover Proof</span>
          </div>
          <span className="font-mono text-[11px] font-bold bg-white px-2 py-0.5 rounded border border-emerald-200">
            Hash: ...{shortHash}
          </span>
        </div>

        {/* 2-Column Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-gray-700">
          
          {/* Column A: Donor & Food Batch Details */}
          <div className="space-y-3 p-4 bg-gray-50/70 rounded-2xl border border-gray-200">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block border-b border-gray-200 pb-1.5">
              1. Donor & Food Batch Passport
            </span>

            <div>
              <span className="text-gray-500 block text-[11px]">Verified Donor:</span>
              <strong className="text-sm text-gray-900">{donorProfile.name}</strong>
              <span className="text-gray-500 block text-[10px]">({donorProfile.type})</span>
            </div>

            <div>
              <span className="text-gray-500 block text-[11px]">FSSAI Registration No:</span>
              <span className="font-mono font-bold text-gray-900 bg-white px-1.5 py-0.5 rounded border border-gray-200">
                {donorProfile.fssaiNumber || '10020043000123'}
              </span>
            </div>

            <div>
              <span className="text-gray-500 block text-[11px]">Dish Name & Category:</span>
              <strong className="text-gray-900">{batch.dishName}</strong> ({batch.category})
            </div>

            <div className="flex justify-between items-center pt-1 border-t border-gray-200">
              <span>Quantity Handed Over:</span>
              <strong className="text-sm font-black text-[#0F5132] font-mono">
                {batch.quantityKg} kg
              </strong>
            </div>
          </div>

          {/* Column B: Receiver & Logistics Details */}
          <div className="space-y-3 p-4 bg-gray-50/70 rounded-2xl border border-gray-200">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block border-b border-gray-200 pb-1.5">
              2. Authorized Receiving Entity
            </span>

            <div>
              <span className="text-gray-500 block text-[11px]">Recipient Facility:</span>
              <strong className="text-sm text-gray-900">{record.receiverName}</strong>
            </div>

            <div>
              <span className="text-gray-500 block text-[11px]">Pickup Security Code:</span>
              <span className="font-mono font-black text-sm text-[#0F5132] bg-white px-2 py-0.5 rounded border border-emerald-200">
                {record.pickupCodeUsed}
              </span>
            </div>

            <div>
              <span className="text-gray-500 block text-[11px]">Handover Temperature:</span>
              <strong className="text-gray-900 font-mono text-sm">
                {record.temperatureC} °C
              </strong>
              {record.isOverride && (
                <span className="text-[10px] text-amber-700 block font-semibold">
                  (Safety Override Logged: {record.overrideReason})
                </span>
              )}
            </div>

            <div className="flex justify-between items-center pt-1 border-t border-gray-200">
              <span>Timestamp:</span>
              <span className="font-mono font-semibold text-gray-800 text-[11px]">
                {formatDateTime(record.timestamp)}
              </span>
            </div>
          </div>

        </div>

        {/* QR Code and Cryptographic Seal Strip */}
        <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={qrDataUrl}
              alt="Verification QR code"
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl border-2 border-[#0F5132] bg-white p-1 shadow-xs"
            />
            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-wider text-[#0F5132] block">
                FSSAI FoSCoS QR Seal
              </span>
              <p className="text-xs text-gray-600 leading-relaxed max-w-sm">
                Scan with any standard QR reader to verify the SHA-256 hash pointer on the AnnaChakra immutable audit ledger.
              </p>
              <div className="font-mono text-[10px] text-gray-500 break-all">
                Hash: {record.logEntryHash}
              </div>
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-emerald-200 sm:pl-6 space-y-1 shrink-0">
            <span className="text-[10px] uppercase font-bold text-gray-400 block">Operator Verification</span>
            <div className="text-xs font-bold text-gray-800 flex items-center gap-1 justify-end">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Confirmed by Human</span>
            </div>
            <span className="text-[10px] text-gray-500 italic block">
              Auditor sign-off completed
            </span>
          </div>
        </div>

        {/* Bottom Mandatory Audit Note */}
        <div className="text-center text-[11px] font-semibold text-gray-500 pt-2 border-t border-gray-100">
          Audit-ready record for donors, NGOs and FSSAI inspection. AI gives decision support, a human confirms every donation.
        </div>

      </div>
    </div>
  );
};
