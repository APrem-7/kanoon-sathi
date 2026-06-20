import React from 'react';
import { FileText } from 'lucide-react';

export default function AISummary({ data }) {
  if (!data) return null;

  return (
    <div className="glass rounded-xl p-6 shadow-lg mb-6">
      <div className="flex items-center gap-3 mb-4 border-b border-white/10 pb-4">
        <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
          <FileText size={24} />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">AI Executive Summary</h2>
          <p className="text-sm text-indigo-300">Document Type: {data.document_type || 'Unknown'}</p>
        </div>
      </div>
      
      <div className="text-slate-200 leading-relaxed text-lg">
        {data.summary || 'No summary available.'}
      </div>
      
      {data.saleAmount && (
        <div className="mt-6 inline-flex items-center gap-2 bg-amber-500/10 text-amber-400 px-4 py-2 rounded-lg border border-amber-500/20">
          <span className="text-sm font-medium uppercase tracking-wider">Consideration Amount:</span>
          <span className="font-bold text-lg">{data.saleAmount}</span>
        </div>
      )}
    </div>
  );
}
