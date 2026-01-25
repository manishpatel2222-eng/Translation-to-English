
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Layout } from './components/Layout';
import { AudioRecorder } from './components/AudioRecorder';
import { HistoryList } from './components/HistoryList';
import { TranslationResult, HistoryItem, TranslationMode } from './types';
import { translateText, translateAudio, synthesizeSpeech } from './services/gemini';
import { blobToBase64, getMimeType, decodeBase64, decodeAudioData } from './utils/audio';

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [mode, setMode] = useState<TranslationMode>(TranslationMode.TEXT);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize AudioContext on first user interaction or when needed
  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    return audioContextRef.current;
  };

  // Dynamic textarea resizing
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('translation_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('translation_history', JSON.stringify(history));
  }, [history]);

  const addToHistory = (item: TranslationResult) => {
    const newItem: HistoryItem = {
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    };
    setHistory(prev => [newItem, ...prev].slice(0, 10)); // Keep last 10
  };

  const handleTranslate = useCallback(async () => {
    if (!input.trim()) return;
    setIsProcessing(true);
    setResult(null);
    try {
      const translation = await translateText(input);
      setResult(translation);
      addToHistory(translation);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  }, [input]);

  const handleAudioComplete = useCallback(async (blob: Blob) => {
    setIsProcessing(true);
    setResult(null);
    try {
      const base64 = await blobToBase64(blob);
      const mimeType = getMimeType(blob);
      const translation = await translateAudio(base64, mimeType);
      setResult(translation);
      addToHistory(translation);
      setInput(translation.original);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleSpeak = async () => {
    if (!result?.translated || isSynthesizing) return;
    
    setIsSynthesizing(true);
    try {
      const base64Audio = await synthesizeSpeech(result.translated);
      if (base64Audio) {
        const ctx = getAudioContext();
        const bytes = decodeBase64(base64Audio);
        const audioBuffer = await decodeAudioData(bytes, ctx, 24000, 1);
        
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.start();
        
        source.onended = () => setIsSynthesizing(false);
      } else {
        setIsSynthesizing(false);
      }
    } catch (err) {
      console.error("Speech synthesis failed", err);
      setIsSynthesizing(false);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('translation_history');
  };

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-700">
        {/* Mode Selector */}
        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 max-w-sm mx-auto">
          <button
            onClick={() => setMode(TranslationMode.TEXT)}
            className={`flex-1 py-3 px-6 rounded-xl text-sm font-bold transition-all duration-300 ${
              mode === TranslationMode.TEXT 
                ? 'bg-slate-900 text-white shadow-lg scale-[1.02]' 
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            Text Mode
          </button>
          <button
            onClick={() => setMode(TranslationMode.VOICE)}
            className={`flex-1 py-3 px-6 rounded-xl text-sm font-bold transition-all duration-300 ${
              mode === TranslationMode.VOICE 
                ? 'bg-slate-900 text-white shadow-lg scale-[1.02]' 
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            Voice Expert
          </button>
        </div>

        {/* Translation Area */}
        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-slate-100 transition-all">
          {mode === TranslationMode.TEXT ? (
            <div className="space-y-6">
              <div className="relative group">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter Gujarati text or phrase..."
                  className="w-full min-h-[160px] bg-slate-50 rounded-3xl p-6 text-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-slate-200 transition-all resize-none shadow-inner overflow-hidden"
                />
                <div className="absolute bottom-4 right-4 text-[10px] uppercase font-bold text-slate-400 tracking-tighter opacity-50 group-hover:opacity-100 transition-opacity">
                  Gujarati Input
                </div>
              </div>
              <button
                onClick={handleTranslate}
                disabled={isProcessing || !input.trim()}
                className={`w-full py-5 rounded-2xl text-white font-bold text-lg shadow-lg transform active:scale-[0.98] transition-all flex items-center justify-center gap-3
                  ${isProcessing || !input.trim() 
                    ? 'bg-slate-300 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:shadow-orange-200 hover:shadow-2xl hover:-translate-y-0.5'
                  }
                `}
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Expert Reasoning...
                  </>
                ) : (
                  <>
                    Translate to English
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          ) : (
            <AudioRecorder 
              onRecordingComplete={handleAudioComplete} 
              isProcessing={isProcessing} 
            />
          )}

          {/* Result Display */}
          {(result || isProcessing) && (
            <div className="mt-12 pt-8 border-t border-slate-100 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Expert Translation</h3>
                </div>
                {result && (
                  <button 
                    onClick={handleSpeak}
                    disabled={isSynthesizing}
                    className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-bold text-xs uppercase tracking-widest transition-colors disabled:opacity-50"
                  >
                    {isSynthesizing ? (
                      <span className="flex items-center gap-1"><div className="w-1 h-3 bg-orange-600 animate-[bounce_1s_infinite]"></div><div className="w-1 h-3 bg-orange-600 animate-[bounce_1s_infinite_0.1s]"></div><div className="w-1 h-3 bg-orange-600 animate-[bounce_1s_infinite_0.2s]"></div></span>
                    ) : (
                      <>
                        Listen
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 14.828a1 1 0 01-1.414-1.414 5 5 0 000-7.072 1 1 0 011.414-1.414 7 7 0 010 9.9z" clipRule="evenodd" />
                        </svg>
                      </>
                    )}
                  </button>
                )}
              </div>
              
              <div className={`rounded-3xl p-8 transition-all duration-500 ${isProcessing ? 'bg-slate-50 opacity-60' : 'bg-slate-900 text-white shadow-2xl scale-[1.01]'}`}>
                {isProcessing ? (
                  <div className="space-y-4">
                    <div className="h-8 bg-slate-200 rounded w-3/4 animate-pulse"></div>
                    <div className="h-5 bg-slate-200 rounded w-1/2 animate-pulse"></div>
                  </div>
                ) : result && (
                  <div className="space-y-4">
                    <p className="text-2xl font-medium leading-relaxed tracking-tight">{result.translated}</p>
                    <div className="flex flex-wrap gap-3 mt-6">
                      {result.pronunciation && (
                        <span className="bg-white/10 text-slate-300 px-4 py-1.5 rounded-full text-xs font-mono border border-white/5">
                          {result.pronunciation}
                        </span>
                      )}
                      <span className="bg-orange-500/20 text-orange-400 px-4 py-1.5 rounded-full text-xs font-bold border border-orange-500/30">
                        100% Precision
                      </span>
                    </div>
                    {result.context && (
                      <div className="mt-6 p-5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                        <p className="text-sm text-slate-400 leading-relaxed">
                          <span className="text-orange-500 font-bold text-xs uppercase tracking-tighter mr-2">Expert Nuance:</span> 
                          <span className="italic opacity-90">{result.context}</span>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Translation Guidelines / Tips */}
        {!result && !isProcessing && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center animate-in fade-in zoom-in-95 duration-1000 delay-300">
            {[
              { title: "Nuance Aware", desc: "Expert understanding of Gujarati regional dialects and proverbs." },
              { title: "Voice Capture", desc: "Advanced acoustic processing for precise speech-to-text conversion." },
              { title: "Native Flow", desc: "Translations that sound natural to native English speakers." }
            ].map((feature, i) => (
              <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-orange-200 transition-colors group">
                <h4 className="font-bold text-slate-800 mb-1 group-hover:text-orange-600 transition-colors">{feature.title}</h4>
                <p className="text-sm text-slate-500 leading-snug">{feature.desc}</p>
              </div>
            ))}
          </div>
        )}

        <HistoryList history={history} onClear={clearHistory} />
      </div>
    </Layout>
  );
};

export default App;
