
import React from 'react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      <header className="w-full bg-white border-b border-slate-200 py-6 px-4 md:px-8 mb-8 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500 p-2 rounded-lg shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 11.37 9.198 15.343 6 18.09" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gujarati English <span className="text-orange-600">Expert</span></h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">High Precision Translation Tool</p>
            </div>
          </div>
          <div className="hidden md:block">
            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-semibold border border-orange-200">
              Gemini 3 Powered
            </span>
          </div>
        </div>
      </header>
      <main className="w-full max-w-4xl px-4 pb-20">
        {children}
      </main>
      <footer className="w-full py-8 border-t border-slate-200 bg-white text-center mt-auto">
        <p className="text-slate-400 text-sm">Professional Translation Suite &bull; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};
