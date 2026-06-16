"use client";

import { 
  Info, 
  HelpCircle, 
  ShieldCheck, 
  FileSpreadsheet, 
  Code2, 
  Settings as SettingsIcon,
  Sparkles
} from "lucide-react";

export default function AboutPage() {
  return (
    <div className="space-y-8 animate-fade-in max-w-3xl mx-auto">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-wider uppercase flex items-center gap-2">
          <Info className="w-6 h-6 text-primary" />
          About Report De
        </h1>
        <p className="text-muted-foreground text-xs mt-1">
          Learn about V2 Technologies (Report De) features, performance characteristics, and safety guidelines.
        </p>
      </div>

      {/* Main Info Card */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl space-y-4 relative overflow-hidden border border-white/5">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-primary">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          V2 Technologies Product Suite
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">Report Query Generator Platform</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Report De is an offline-capable browser utility developed to make report scripting accessible to operational and QA teams. By uploading flat spreadsheets, mapping columns directly, and selecting dates, teams can instantly generate precise SQL scripts ready to run on databases, eliminating manual copy-pasting errors.
        </p>
      </div>

      {/* User Guides & Instructions */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-3xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-4.5 h-4.5 text-primary" />
            File Handling & Excel Formats
          </h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Report De parses Excel (XLSX, XLS) and CSV files. In Excel files, headers are detected automatically from the first row of each sheet. In multi-sheet files, you can switch active sheets instantly in the mapping wizard.
          </p>
          <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5 text-[10px] text-muted-foreground leading-normal">
            <span className="font-bold text-white block mb-1">Header Matching Rules</span>
            Spaces are trimmed automatically. Exact name checks are executed. Column mappings default to local browser storage to prevent repetitive mapping.
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4.5 h-4.5 text-emerald-400" />
            Secure Architecture Model
          </h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            The platform executes all data parsing and query formatting client-side. The file never leaves your browser, meaning it is not uploaded to any remote server or third-party database.
          </p>
          <div className="bg-emerald-500/5 p-3.5 rounded-2xl border border-emerald-500/10 text-[10px] text-emerald-400 leading-normal">
            <span className="font-bold text-white block mb-1">Security Standard</span>
            No databases are contacted directly, ensuring no database injections can take place. Special character double quote escapes prevent simple query injection syntax crashes.
          </div>
        </div>
      </div>

      {/* FAQ Guide Accordion */}
      <div className="glass-card p-6 rounded-3xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <HelpCircle className="w-4.5 h-4.5 text-primary" />
          Frequently Asked Questions
        </h3>

        <div className="space-y-4 divide-y divide-white/5">
          {[
            {
              q: "How many spreadsheet rows can Report De handle?",
              a: "Report De has been stress-tested with over 5,000+ rows. The preview window is paginated to prevent memory leakage and browser freezes."
            },
            {
              q: "How do I add a new placeholder to my report?",
              a: "Navigate to the Templates tab, click Create Template, and write a query containing double curly brace placeholders (e.g. {{my_placeholder}}). It will instantly register and show up as a column mapping dropdown in the generation page."
            },
            {
              q: "Where is my data stored?",
              a: "Report templates, custom column mapping configurations, and query activity logs are stored entirely in your browser's local storage database."
            }
          ].map((item, idx) => (
            <div key={idx} className={`${idx > 0 ? "pt-4" : ""} space-y-1.5`}>
              <h4 className="text-xs font-bold text-white">{item.q}</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
