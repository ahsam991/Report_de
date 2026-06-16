"use client";

import { useState, useEffect } from "react";
import { 
  History, 
  Trash2, 
  Calendar, 
  FileText, 
  Database,
  ArrowUpDown
} from "lucide-react";
import { getHistory, clearHistory, HistoryEntry } from "@/utils/storage";

export default function HistoryPage() {
  const [historyList, setHistoryList] = useState<HistoryEntry[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setHistoryList(getHistory());
  }, []);

  const handleClear = () => {
    if (confirm("Are you sure you want to permanently clear all generation history?")) {
      clearHistory();
      setHistoryList([]);
    }
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider uppercase flex items-center gap-2">
            <History className="w-6 h-6 text-primary" />
            Activity History
          </h1>
          <p className="text-muted-foreground text-xs mt-1">
            Browse through previous generation runs, review metadata, and check processed row counts.
          </p>
        </div>

        {historyList.length > 0 && (
          <button
            onClick={handleClear}
            className="inline-flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear History
          </button>
        )}
      </div>

      {historyList.length === 0 ? (
        <div className="glass-card py-20 text-center text-muted-foreground flex flex-col items-center justify-center space-y-4 rounded-3xl">
          <div className="bg-white/5 p-5 rounded-full border border-white/5">
            <History className="w-8 h-8 text-muted-foreground/75" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-white text-sm">No report history found</p>
            <p className="text-xs max-w-xs text-muted-foreground/75 mx-auto leading-normal">
              Any report queries generated in the platform will be logged locally here.
            </p>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-3xl overflow-hidden border border-white/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-white/5 border-b border-white/5 text-muted-foreground font-semibold">
                  <th className="p-4 uppercase tracking-wider">Date / Time</th>
                  <th className="p-4 uppercase tracking-wider">Source File</th>
                  <th className="p-4 uppercase tracking-wider">Template</th>
                  <th className="p-4 uppercase tracking-wider text-right">Rows</th>
                  <th className="p-4 uppercase tracking-wider text-right">Queries</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {historyList.map((entry) => (
                  <tr 
                    key={entry.id} 
                    className="hover:bg-white/[0.02] text-zinc-300 transition-colors"
                  >
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="font-medium">
                          {new Date(entry.timestamp).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(entry.timestamp).toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-white truncate max-w-xs">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{entry.fileName}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="bg-primary/10 border border-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full font-semibold">
                        {entry.templateName}
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono font-medium">{entry.rowCount}</td>
                    <td className="p-4 text-right font-mono font-bold text-emerald-400">{entry.queriesCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
