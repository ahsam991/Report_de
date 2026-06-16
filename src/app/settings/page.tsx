"use client";

import { useState, useEffect } from "react";
import { 
  Settings as SettingsIcon, 
  Save, 
  Trash2, 
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  Database
} from "lucide-react";
import { getSettings, saveSettings, Settings } from "@/utils/storage";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  const handleSave = () => {
    if (!settings) return;
    saveSettings(settings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleClearAllData = () => {
    if (confirm("WARNING: This will wipe all templates, history, and column mappings from your browser. This action cannot be undone. Proceed?")) {
      localStorage.clear();
      setSettings(getSettings());
      setClearSuccess(true);
      setTimeout(() => setClearSuccess(false), 3000);
    }
  };

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-wider uppercase flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-primary" />
          Application Settings
        </h1>
        <p className="text-muted-foreground text-xs mt-1">
          Adjust generation parameters, configure default templates settings, and manage local database storage.
        </p>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl p-4 flex gap-3 text-xs">
          <CheckCircle className="w-4 h-4 shrink-0" />
          Settings updated successfully.
        </div>
      )}

      {clearSuccess && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl p-4 flex gap-3 text-xs">
          <CheckCircle className="w-4 h-4 shrink-0" />
          All local database data has been successfully wiped.
        </div>
      )}

      {/* Main Settings Panel */}
      <div className="glass-card rounded-3xl p-6 space-y-6">
        <h2 className="text-sm font-bold text-white tracking-wider uppercase border-b border-white/5 pb-4 flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" />
          Query Generation Rules
        </h2>

        {/* Setting items */}
        <div className="space-y-6">
          {/* Max Preview Rows */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-white">Maximum Row Preview Limit</label>
              <p className="text-[11px] text-muted-foreground leading-normal max-w-sm">
                Limits how many generated SQL queries are loaded in the browser preview list at a time to prevent performance bottlenecks.
              </p>
            </div>
            <input 
              type="number" 
              value={settings.maxPreviewRows}
              onChange={(e) => setSettings({ ...settings, maxPreviewRows: parseInt(e.target.value) || 10 })}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white w-24 text-center focus:outline-none focus:border-primary"
            />
          </div>

          {/* Auto Copy generated code */}
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-white">Auto-Copy to Clipboard</label>
              <p className="text-[11px] text-muted-foreground leading-normal max-w-sm">
                Automatically copies the entire set of generated SQL queries to your system clipboard once the generation wizard is complete.
              </p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, autoCopyGenerated: !settings.autoCopyGenerated })}
              className="text-primary hover:scale-105 transition-transform"
            >
              {settings.autoCopyGenerated ? (
                <ToggleRight className="w-10 h-10 text-primary" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-white/5 flex justify-end">
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/95 text-white text-xs font-bold px-5 py-3 rounded-2xl transition-all shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-95"
          >
            <Save className="w-4 h-4" />
            Save Settings
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass-card rounded-3xl p-6 border-red-500/15 bg-red-500/[0.02] space-y-4">
        <h2 className="text-xs font-bold text-red-400 tracking-wider uppercase border-b border-white/5 pb-4">
          Danger Zone
        </h2>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-bold text-white">Reset Local Database</p>
            <p className="text-[11px] text-muted-foreground leading-normal max-w-sm">
              Permanently wipe all custom SQL templates, recent activities history log, and saved excel column mappings.
            </p>
          </div>
          <button
            onClick={handleClearAllData}
            className="inline-flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Wipe All Storage
          </button>
        </div>
      </div>
    </div>
  );
}
