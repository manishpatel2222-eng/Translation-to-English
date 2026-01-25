
import React from 'react';
import { HistoryItem } from '../types';

interface Props {
  history: HistoryItem[];
  onClear: () => void;
}

export const HistoryList: React.FC<Props> = ({ history, onClear }) => {
  if (history.length === 0) return null;

  return (
    <div className="mt-12 bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-slate-800">Recent History</h2>
        <button 
          onClick={onClear}
          className="text-slate-400 hover:text-red-500 text-sm font-medium transition-colors"
        >
          Clear History
        </button>
      </div>
      <div className="space-y-4">
        {history.map((item) => (
          <div key={item.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-orange-200 transition-all">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Gujarati</span>
                <p className="text-slate-800 font-medium">{item.original}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-orange-400 block mb-1">English</span>
                <p className="text-slate-900 font-semibold">{item.translated}</p>
              </div>
            </div>
            {item.context && (
              <p className="mt-3 text-xs text-slate-500 italic border-t border-slate-200 pt-2">
                Note: {item.context}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
