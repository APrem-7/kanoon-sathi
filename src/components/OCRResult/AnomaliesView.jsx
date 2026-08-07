import React from 'react';
import { AlertTriangle, CheckCircle2, FileText, Info } from 'lucide-react';

export default function AnomaliesView({ anomalies }) {
  const data = anomalies || [];

  if (data.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg flex items-start gap-3">
        <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
        <div>
          <h3 className="text-lg font-semibold">All Clear</h3>
          <p className="mt-1">
            No outstanding financial encumbrances, loans, mortgages, or anomalies were detected for this property in the uploaded documents.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-6">
        <AlertTriangle className="w-5 h-5 text-amber-400" />
        <h3 className="text-lg font-semibold text-slate-200">Detected Financial Anomalies</h3>
      </div>
      
      <div className="grid gap-4">
        {data.map((anomaly, idx) => {
          return (
            <div key={idx} className="bg-red-50 border border-red-200 text-red-900 p-4 rounded-lg mb-4 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h4 className="text-md font-bold">{anomaly.type || 'Anomaly'}</h4>
                    <p className="mt-1">{anomaly.details}</p>
                    
                    {anomaly.mentionedInDeed && (
                      <div className="flex items-center space-x-2 mt-3 text-sm text-red-700">
                        <FileText className="w-4 h-4" />
                        <span>Source: {anomaly.mentionedInDeed}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {anomaly.status && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium border bg-red-100 border-red-200 text-red-800">
                    {anomaly.status}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
