import React, { useRef, useState } from 'react';
import { Camera, Loader2, AlertCircle, Sliders, Check, Sparkles } from 'lucide-react';
import { downscaleImage } from '../utils/imageHelper';
import { checkPhotoFreshness } from '../utils/geminiClient';
import { PhotoFreshnessResult } from '../types/batch';

interface PhotoUploadButtonProps {
  onPhotoAnalyzed: (result: PhotoFreshnessResult) => void;
  buttonText?: string;
  variant?: 'primary' | 'secondary' | 'compact';
  currentPhoto?: PhotoFreshnessResult | null;
}

export const PhotoUploadButton: React.FC<PhotoUploadButtonProps> = ({
  onPhotoAnalyzed,
  buttonText = 'Add photo',
  variant = 'secondary',
  currentPhoto,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorInfo, setErrorInfo] = useState<{ message: string; tempUrl?: string } | null>(null);

  // Manual fallback slider states
  const [manualScore, setManualScore] = useState<number>(75);
  const [manualFoodName, setManualFoodName] = useState<string>('Prepared food');
  const [manualIssue, setManualIssue] = useState<string>('none');

  const handleClick = () => {
    setErrorInfo(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setStatusMessage('Compressing photo (1024px max)...');
    setErrorInfo(null);

    let tempUrl = '';

    try {
      // Step 1: Downscale image
      const { base64, mimeType, dataUrl } = await downscaleImage(file, 1024);
      tempUrl = dataUrl;

      // Step 2: Call Gemini API (with automatic 1-time retry built-in)
      setStatusMessage('Gemini analyzing visual freshness...');
      const result = await checkPhotoFreshness(base64, mimeType, dataUrl);

      setIsLoading(false);
      setStatusMessage('');
      onPhotoAnalyzed(result);
    } catch (err: any) {
      console.error('Failed to analyze photo with Gemini:', err);
      setIsLoading(false);
      setStatusMessage('');
      setErrorInfo({
        message:
          err?.status === 429
            ? 'Gemini API is temporarily rate-limited. You can enter a manual score below to continue testing.'
            : 'Gemini inspection was unable to reach the server. You can enter a manual score below so the demo never breaks.',
        tempUrl,
      });
    } finally {
      // Reset input value so user can re-select same file if desired
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleApplyManualScore = () => {
    const manualResult: PhotoFreshnessResult = {
      id: `photo-manual-${Date.now()}`,
      thumbnailUrl:
        errorInfo?.tempUrl ||
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%230F5132"/><text x="50" y="55" font-family="sans-serif" font-size="12" fill="%23fff" text-anchor="middle">Manual Photo</text></svg>',
      is_food: true,
      food_identified: manualFoodName.trim() || 'Manual assessment item',
      freshness_score: manualScore,
      visible_issues: manualIssue === 'none' ? ['none'] : [manualIssue],
      confidence: 'medium',
      note: `Manual assessment recorded at score ${manualScore}/100.`,
      timestamp: Date.now(),
      isManualScore: true,
    };

    setErrorInfo(null);
    onPhotoAnalyzed(manualResult);
  };

  const handleLoadSamplePhoto = () => {
    const sampleResult: PhotoFreshnessResult = {
      id: `photo-sample-${Date.now()}`,
      thumbnailUrl:
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%230F5132" rx="16"/><circle cx="100" cy="100" r="60" fill="%23D97706"/><circle cx="100" cy="100" r="48" fill="%23FBBF24"/><text x="100" y="105" font-family="sans-serif" font-size="12" font-weight="bold" fill="%230a3822" text-anchor="middle">Fresh Curry (88/100)</text></svg>',
      is_food: true,
      food_identified: 'Vegetable curry & rice',
      freshness_score: 88,
      visible_issues: ['none'],
      confidence: 'high',
      note: 'Fresh appearance, natural steam and vibrant colours observed. Visual score 88/100.',
      timestamp: Date.now(),
      isManualScore: false,
    };
    setErrorInfo(null);
    onPhotoAnalyzed(sampleResult);
  };

  return (
    <div className="relative inline-flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className={`inline-flex items-center gap-1.5 font-bold transition-all ${
          variant === 'primary'
            ? 'px-3.5 py-2 text-xs sm:text-sm bg-[#0F5132] hover:bg-[#14663f] text-white rounded-xl shadow-xs'
            : variant === 'compact'
            ? 'px-2.5 py-1 text-xs bg-emerald-50 hover:bg-emerald-100 text-[#0F5132] border border-emerald-200 rounded-lg'
            : 'px-3 py-1.5 text-xs bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl shadow-2xs'
        } ${isLoading ? 'opacity-80 cursor-wait' : 'active:scale-95'}`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D97706]" />
            <span className="text-[11px] sm:text-xs">
              {statusMessage || 'Processing...'}
            </span>
          </>
        ) : (
          <>
            <Camera className="w-3.5 h-3.5" />
            <span>{currentPhoto ? 'Retake photo' : buttonText}</span>
          </>
        )}
      </button>

      <button
        type="button"
        onClick={handleLoadSamplePhoto}
        title="Test photo freshness analysis with sample verified assessment (works offline)"
        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-100/80 hover:bg-emerald-200 text-center rounded-xl transition-all cursor-pointer active:scale-95 border border-emerald-300/60"
      >
        <Sparkles className="w-3 h-3 text-amber-600" />
        <span>Sample photo</span>
      </button>

      {/* Manual Score Fallback Card (shown when error occurs so demo never breaks) */}
      {errorInfo && (
        <div className="mt-3 p-4 bg-white rounded-2xl border-2 border-amber-400 shadow-lg text-xs space-y-3 z-20">
          <div className="flex items-start gap-2 text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Offline / Rate Limit Fallback:</span>
              <p className="text-[11px] text-gray-600 mt-0.5">{errorInfo.message}</p>
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-700 flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-[#0F5132]" />
                Enter Score Manually:
              </span>
              <span
                className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                  manualScore >= 75
                    ? 'bg-emerald-100 text-emerald-800'
                    : manualScore >= 45
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {manualScore} / 100
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={manualScore}
              onChange={(e) => setManualScore(Number(e.target.value))}
              className="w-full accent-[#0F5132] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400 font-mono">
              <span>0 (Unsafe)</span>
              <span>45 (Halve safe hours)</span>
              <span>75+ (Safe)</span>
              <span>100</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-0.5">
                  Identified Food
                </label>
                <input
                  type="text"
                  value={manualFoodName}
                  onChange={(e) => setManualFoodName(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white"
                  placeholder="e.g. Sambar"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-0.5">
                  Visible Issue
                </label>
                <select
                  value={manualIssue}
                  onChange={(e) => setManualIssue(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white"
                >
                  <option value="none">None (Fresh)</option>
                  <option value="wilting">Wilting</option>
                  <option value="discolouration">Discolouration</option>
                  <option value="dryness">Dryness</option>
                  <option value="slime">Slime / Odour</option>
                  <option value="mould">Mould</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setErrorInfo(null)}
              className="px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApplyManualScore}
              className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg bg-[#0F5132] hover:bg-[#14663f] text-white text-xs font-bold shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply manual assessment</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
