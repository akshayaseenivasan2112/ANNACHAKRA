import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Loader2,
  AlertCircle,
  Sparkles,
  Volume2,
  CheckCircle,
} from 'lucide-react';
import { transcribeVoiceBatch } from '../utils/geminiClient';
import { VoiceBatchExtraction } from '../types/batch';

interface VoiceBatchRecorderProps {
  onExtractionSuccess: (extraction: VoiceBatchExtraction) => void;
}

export const VoiceBatchRecorder: React.FC<VoiceBatchRecorderProps> = ({
  onExtractionSuccess,
}) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [lastExtraction, setLastExtraction] = useState<VoiceBatchExtraction | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);

  // Clean up recording timer on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    setPermissionError(null);
    setLastExtraction(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermissionError(
        'Your browser does not support audio recording. Please use Chrome, Safari, or Edge.'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Determine preferred mime type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop audio tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());

        if (audioChunksRef.current.length === 0) {
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || 'audio/webm',
        });

        await processAudio(audioBlob, mediaRecorder.mimeType || 'audio/webm');
      };

      mediaRecorder.start(250); // collect in 250ms chunks
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone access error:', err);
      if (
        err.name === 'NotAllowedError' ||
        err.name === 'PermissionDeniedError' ||
        err.message?.includes('denied')
      ) {
        setPermissionError(
          'Microphone permission was denied. Please allow microphone access in your browser address bar to speak batch details.'
        );
      } else {
        setPermissionError(
          `Unable to access microphone: ${err.message || 'Check audio hardware settings.'}`
        );
      }
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (blob: Blob, mimeType: string) => {
    setIsProcessing(true);
    setStatusMessage('Encoding audio note...');

    try {
      // Convert Blob to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const dataUrl = reader.result as string;
          const audioBase64 = dataUrl.split(',')[1] || '';

          setStatusMessage('Gemini transcribing multilingual voice & extracting batch details...');
          const extraction = await transcribeVoiceBatch(audioBase64, mimeType);

          setIsProcessing(false);
          setStatusMessage('');
          setLastExtraction(extraction);
          onExtractionSuccess(extraction);
        } catch (err: any) {
          console.error('Error during voice batch extraction:', err);
          setIsProcessing(false);
          setStatusMessage('');
          setPermissionError(
            err?.status === 429
              ? 'Gemini voice API rate-limited. Please try speaking again in a few moments.'
              : 'Failed to transcribe audio. Check connection or try speaking again.'
          );
        }
      };
      reader.readAsDataURL(blob);
    } catch (err: any) {
      setIsProcessing(false);
      setStatusMessage('');
      setPermissionError('Audio processing failed: ' + (err.message || ''));
    }
  };

  // Mock voice test prompt for environments without physical mic or for instant review
  const handleSimulateVoicePrompt = (type: 'hindi' | 'tamil' | 'english') => {
    let mock: VoiceBatchExtraction;
    if (type === 'hindi') {
      mock = {
        transcript: 'पचास किलो दाल मखनी तैयार है, अभी गरम है पैंसठ डिग्री पर हॉट-होल्ड में रखना है, इसमें कोई एलर्जी नहीं है।',
        language: 'Hindi',
        dish: 'Dal Makhani',
        category: 'Cooked',
        quantity_kg: 50,
        temperature_c: 65,
        storage: 'Hot-hold',
        allergens: ['Milk'],
      };
    } else if (type === 'tamil') {
      mock = {
        transcript: 'இருபத்தைந்து கிலோ சாம்பார் சமைச்சாச்சு, நாற்பது டிகிரி இருக்கு, ஆம்பியன்ட் ஸ்டோரேஜ்ல வைக்கிறோம், வேர்க்கடலை எதுவும் இல்லை.',
        language: 'Tamil',
        dish: 'Sambar',
        category: 'Cooked',
        quantity_kg: 25,
        temperature_c: 40,
        storage: 'Ambient',
        allergens: [],
      };
    } else {
      mock = {
        transcript: 'Prepared 35 kg of Basmati rice, chilled down to 4.5 degrees celsius for cold storage, allergen free.',
        language: 'English',
        dish: 'Basmati Rice',
        category: 'Cooked',
        quantity_kg: 35,
        temperature_c: 4.5,
        storage: 'Chilled',
        allergens: [],
      };
    }

    setLastExtraction(mock);
    onExtractionSuccess(mock);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gradient-to-r from-emerald-50/80 to-amber-50/80 p-4 sm:p-5 rounded-2xl border border-emerald-200/80 shadow-xs space-y-3.5">
      
      {/* Top Banner with Mic Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Large Microphone Action Button */}
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`relative group flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl font-bold shadow-md transition-all ${
              isRecording
                ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse ring-4 ring-red-400/40'
                : isProcessing
                ? 'bg-amber-600 text-white cursor-wait opacity-80'
                : 'bg-[#0F5132] hover:bg-[#14663f] text-white active:scale-95'
            }`}
            title={isRecording ? 'Tap to finish recording' : 'Tap to start recording'}
          >
            {isRecording ? (
              <Square className="w-6 h-6 fill-current text-white" />
            ) : isProcessing ? (
              <Loader2 className="w-7 h-7 animate-spin text-white" />
            ) : (
              <Mic className="w-7 h-7 text-amber-300" />
            )}

            {/* Pulsing indicator ring when recording */}
            {isRecording && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-400 ring-2 ring-white animate-ping" />
            )}
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-1.5">
                <span>Voice Entry for Kitchen Workers</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Multilingual
                </span>
              </h3>
            </div>
            
            <p className="text-xs text-gray-600 mt-0.5">
              {isRecording ? (
                <span className="text-red-600 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-ping inline-block" />
                  Listening ({formatTimer(recordingSeconds)}) — Tap red square to finish
                </span>
              ) : isProcessing ? (
                <span className="text-amber-700 font-semibold">{statusMessage}</span>
              ) : (
                <span>Speak naturally in English, Hindi, Tamil, or Hinglish to auto-fill</span>
              )}
            </p>
          </div>
        </div>

        {/* Quick simulation buttons (for convenience or testing) */}
        {!isRecording && !isProcessing && (
          <div className="flex items-center gap-1.5 self-start sm:self-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1">
              Sample Voice:
            </span>
            <button
              type="button"
              onClick={() => handleSimulateVoicePrompt('hindi')}
              className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              title="Test Hindi voice transcription"
            >
              🇮🇳 Hindi
            </button>
            <button
              type="button"
              onClick={() => handleSimulateVoicePrompt('tamil')}
              className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              title="Test Tamil voice transcription"
            >
              🇮🇳 Tamil
            </button>
            <button
              type="button"
              onClick={() => handleSimulateVoicePrompt('english')}
              className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              title="Test English voice transcription"
            >
              English
            </button>
          </div>
        )}
      </div>

      {/* Permission or Processing Error Banner */}
      {permissionError && (
        <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-xs text-red-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Microphone Access Error: </span>
            <span>{permissionError}</span>
          </div>
        </div>
      )}

      {/* Transcript & Extracted Fields Preview */}
      {lastExtraction && (
        <div className="p-3.5 bg-white rounded-xl border border-emerald-300 shadow-2xs space-y-2 text-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <div className="flex items-center gap-1.5 font-bold text-gray-900">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Voice Note Processed ({lastExtraction.language})</span>
            </div>
            <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Form fields highlighted in green
            </span>
          </div>

          <div>
            <span className="font-bold text-gray-500 uppercase text-[10px] block">
              Original Spoken Transcript:
            </span>
            <p className="text-gray-800 font-medium italic mt-0.5">
              "{lastExtraction.transcript}"
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-gray-700 font-medium">
            {lastExtraction.dish && (
              <span>Dish: <strong className="text-gray-900">{lastExtraction.dish}</strong></span>
            )}
            {lastExtraction.category && (
              <span>Category: <strong className="text-gray-900">{lastExtraction.category}</strong></span>
            )}
            {lastExtraction.quantity_kg !== null && (
              <span>Quantity: <strong className="text-gray-900">{lastExtraction.quantity_kg} kg</strong></span>
            )}
            {lastExtraction.temperature_c !== null && (
              <span>Temp: <strong className="text-gray-900">{lastExtraction.temperature_c} °C</strong></span>
            )}
            {lastExtraction.storage && (
              <span>Storage: <strong className="text-gray-900">{lastExtraction.storage}</strong></span>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
