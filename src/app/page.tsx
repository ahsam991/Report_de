"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  FileText, 
  FileCode2, 
  History, 
  Settings as SettingsIcon, 
  Play, 
  Sparkles, 
  TrendingUp, 
  CheckCircle,
  Database
} from "lucide-react";
import { getHistory, getTemplates, getSavedMappings, HistoryEntry } from "@/utils/storage";

export default function Dashboard() {
  const [stats, setStats] = useState({
    templates: 0,
    queries: 0,
    files: 0,
    mappings: 0
  });
  const [recentHistory, setRecentHistory] = useState<HistoryEntry[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const history = getHistory();
    const templates = getTemplates();
    const mappings = getSavedMappings();

    const totalQueries = history.reduce((acc, curr) => acc + curr.queriesCount, 0);
    const totalFiles = history.length;

    setStats({
      templates: templates.length,
      queries: totalQueries,
      files: totalFiles,
      mappings: Object.keys(mappings).length
    });

    setRecentHistory(history.slice(0, 5));
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Welcome Hero Panel */}
      <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-violet-600/10 via-transparent to-indigo-600/5 p-8 md:p-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-primary">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            MVP Web Query Tool Active
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white select-none">
            SQL Report Query Generator
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            Upload Excel, XLSX, XLS, and CSV files, map database columns instantly, and generate formatted report queries. Run complex SQL generation purely in your browser.
          </p>
          <div className="pt-2 flex flex-wrap gap-4">
            <Link 
              href="/generate" 
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/95 text-white font-bold px-6 py-3 rounded-2xl transition-all shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              Generate Report
            </Link>
            <Link 
              href="/templates" 
              className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-6 py-3 rounded-2xl transition-all hover:scale-[1.02] active:scale-95"
            >
              <FileCode2 className="w-4 h-4" />
              Manage Templates
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Templates", value: stats.templates, icon: FileCode2, color: "text-violet-400" },
          { label: "SQL Queries Generated", value: stats.queries, icon: Database, color: "text-indigo-400" },
          { label: "Files Processed", value: stats.files, icon: FileText, color: "text-blue-400" },
          { label: "Saved Mappings", value: stats.mappings, icon: SettingsIcon, color: "text-emerald-400" },
        ].map((item, index) => {
          const Icon = item.icon;
          return (
            <div 
              key={index}
              className="glass-card hover:border-white/10 p-6 rounded-2xl flex flex-col justify-between transition-all group hover:translate-y-[-2px]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">{item.label}</span>
                <Icon className={`w-5 h-5 ${item.color} group-hover:scale-110 transition-transform`} />
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white tracking-tight">{item.value}</span>
                {item.value > 0 && index === 1 && (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1 select-none">
                    <TrendingUp className="w-2.5 h-2.5" />
                    Live
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Grid: Dashboard Interactive Elements & History */}
      <div className="grid md:grid-cols-5 gap-6">
        {/* Recent Activity Timeline */}
        <div className="glass-card p-6 rounded-3xl md:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <History className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-white">Recent Activities</h2>
            </div>
            {recentHistory.length > 0 && (
              <Link href="/history" className="text-xs font-semibold text-primary hover:underline">
                View All
              </Link>
            )}
          </div>
          
          {recentHistory.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center space-y-3">
              <div className="bg-white/5 p-4 rounded-full border border-white/5">
                <History className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No activity history yet.</p>
              <p className="text-xs max-w-xs text-muted-foreground/75">Generated reports will appear here for fast re-downloading.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentHistory.map((item, idx) => (
                <div 
                  key={item.id}
                  className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all group"
                >
                  <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20 text-primary mt-0.5 shrink-0 group-hover:bg-primary group-hover:text-white transition-colors duration-200">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-white text-sm truncate">{item.fileName}</p>
                      <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                        {new Date(item.timestamp).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Generated <span className="font-semibold text-white">{item.queriesCount}</span> queries using <span className="font-semibold text-white">{item.templateName}</span> ({item.rowCount} rows)
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dashboard Visual Promo Card */}
        <div className="glass-card p-6 rounded-3xl md:col-span-2 bg-gradient-to-b from-indigo-950/20 to-transparent flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="space-y-4">
            <h3 className="text-md font-bold text-white">How it works</h3>
            
            <div className="space-y-3.5 mt-4 text-sm">
              {[
                { step: "01", title: "Select Template & Upload", desc: "Choose the target query structure and upload Excel/CSV." },
                { step: "02", title: "Map Spreadsheet Columns", desc: "Select which sheet columns map to template parameters." },
                { step: "03", title: "Review & Save SQL", desc: "Preview values in real-time and export queries instantly." },
              ].map((step, idx) => (
                <div key={idx} className="flex gap-3 items-start">
                  <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20 shrink-0">
                    {step.step}
                  </span>
                  <div>
                    <h4 className="font-semibold text-white text-xs">{step.title}</h4>
                    <p className="text-[11px] text-muted-foreground leading-normal mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="pt-6 border-t border-white/5 flex items-center justify-between text-xs text-muted-foreground">
            <span>Client Side Only</span>
            <span className="font-mono text-emerald-400 flex items-center gap-1 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              Secure Sandbox
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
