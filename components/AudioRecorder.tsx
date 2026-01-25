
import React, { useState, useRef, useCallback } from 'react';

interface Props {
  onRecordingComplete: (blob: Blob) => void;
  isProcessing: boolean;
}

export const AudioRecorder: React.FC<Props> = ({ onRecordingComplete, isProcessing }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    setPermissionError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Browser does not support audio recording.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: recorder.mimeType });
        onRecordingComplete(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Error accessing microphone:", err);
      let msg = "Could not access microphone.";
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = "Microphone permission denied. Please allow access in your browser settings and try again.";
      }
      setPermissionError(msg);
    }
  }, [onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center py-6">
      <div className="relative">
        {isRecording && (
          <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-25"></div>
        )}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={`
            relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-xl
            ${isRecording ? 'bg-red-500 hover:bg-red-600 scale-110' : 'bg-orange-500 hover:bg-orange-600'}
            ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95'}
          `}
        >
          {isRecording ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-20a3 3 0 00-3 3v10a3 3 0 003 3h0a3 3 0 003-3V5a3 3 0 00-3-3z" />
            </svg>
          )}
        </button>
      </div>
      
      <div className="mt-4 text-center max-w-sm">
        {permissionError ? (
          <p className="text-red-500 text-sm font-medium">{permissionError}</p>
        ) : isRecording ? (
          <p className="text-red-600 font-bold animate-pulse text-lg">Listening... {formatTime(recordingTime)}</p>
        ) : isProcessing ? (
          <p className="text-slate-500 font-medium italic">Expert AI is analyzing your speech...</p>
        ) : (
          <p className="text-slate-400 font-medium">Tap to speak in Gujarati</p>
        )}
      </div>
    </div>
  );
};
