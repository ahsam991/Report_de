"use client";

import { useState, useEffect } from "react";
import { 
  FileCode2, 
  Plus, 
  Trash2, 
  Save, 
  RotateCcw,
  Sparkles,
  Info,
  CheckCircle,
  Database
} from "lucide-react";
import { getTemplates, saveTemplates, Template } from "@/utils/storage";
import { extractPlaceholders } from "@/utils/template-engine";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  
  // Editor form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sql, setSql] = useState("");
  const [isNew, setIsNew] = useState(false);
  const [detectedVars, setDetectedVars] = useState<string[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const list = getTemplates();
    setTemplates(list);
    if (list.length > 0) {
      selectTemplate(list[0]);
    }
  }, []);

  useEffect(() => {
    setDetectedVars(extractPlaceholders(sql));
  }, [sql]);

  const selectTemplate = (t: Template) => {
    setSelectedTemplateId(t.id);
    setName(t.name);
    setDescription(t.description);
    setSql(t.sql);
    setIsNew(false);
  };

  const handleCreateNew = () => {
    setSelectedTemplateId("");
    setName("");
    setDescription("");
    setSql("SELECT\n       c.id                        AS \"Contact ID\"\nFROM ecrm.contacts c\nWHERE c.campaign_id = {{campaign_id}};");
    setIsNew(true);
  };

  const handleSave = () => {
    if (!name.trim() || !sql.trim()) {
      alert("Name and SQL query are required.");
      return;
    }

    let updatedList: Template[];

    if (isNew) {
      const newTmpl: Template = {
        id: Math.random().toString(36).substring(2, 9),
        name: name.trim(),
        description: description.trim(),
        sql: sql.trim(),
        isDefault: false
      };
      updatedList = [...templates, newTmpl];
      setTemplates(updatedList);
      selectTemplate(newTmpl);
    } else {
      updatedList = templates.map((t) => 
        t.id === selectedTemplateId 
          ? { ...t, name: name.trim(), description: description.trim(), sql: sql.trim() } 
          : t
      );
      setTemplates(updatedList);
    }

    saveTemplates(updatedList);
    
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this template?")) {
      const updatedList = templates.filter((t) => t.id !== selectedTemplateId);
      setTemplates(updatedList);
      saveTemplates(updatedList);
      
      if (updatedList.length > 0) {
        selectTemplate(updatedList[0]);
      } else {
        handleCreateNew();
      }
    }
  };

  const handleResetDefaults = () => {
    if (confirm("Resetting will revert all custom edits on default templates. Proceed?")) {
      localStorage.removeItem("reportde_templates");
      const list = getTemplates();
      setTemplates(list);
      if (list.length > 0) {
        selectTemplate(list[0]);
      }
    }
  };

  const currentTemplate = templates.find((t) => t.id === selectedTemplateId);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider uppercase flex items-center gap-2">
            <FileCode2 className="w-6 h-6 text-primary" />
            Report Templates
          </h1>
          <p className="text-muted-foreground text-xs mt-1">
            Manage your report SQL layouts, configure mapped variables, and edit code formatting.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-muted-foreground hover:text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/95 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all hover:scale-[1.02] shadow-md shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            Create Template
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {/* Templates Sidebar Selection */}
        <div className="md:col-span-1 glass-card rounded-3xl p-4 space-y-2.5 h-[fit-content]">
          <h3 className="text-xs font-bold text-muted-foreground tracking-wider uppercase px-2 mb-3">Saved Reports</h3>
          
          <div className="space-y-1.5">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => selectTemplate(t)}
                className={`w-full text-left px-3 py-3 rounded-xl transition-all flex items-center justify-between group ${
                  selectedTemplateId === t.id
                    ? "bg-primary/10 border border-primary/30 text-primary font-bold"
                    : "text-muted-foreground hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                <span className="truncate text-xs">{t.name}</span>
                {t.isDefault && (
                  <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                    Core
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Editor workspace */}
        <div className="md:col-span-3 glass-card rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h2 className="text-md font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" />
              {isNew ? "New Report Template" : `Edit Template: ${currentTemplate?.name || ""}`}
            </h2>

            <div className="flex items-center gap-2">
              {!isNew && !currentTemplate?.isDefault && (
                <button
                  onClick={handleDelete}
                  className="p-2.5 rounded-xl border border-white/5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleSave}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/95 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-primary/20"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>

          {saveSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl p-4 flex gap-3 text-xs">
              <CheckCircle className="w-4 h-4 shrink-0" />
              Template saved successfully.
            </div>
          )}

          {/* Form Fields */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Template Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Daily Raw Report"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Description</label>
              <input 
                type="text" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of query contents"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase flex items-center justify-between">
              <span>SQL Query Structure</span>
              <span className="text-[10px] lowercase text-muted-foreground font-normal">Use {"{{variable}}"} syntax for placeholders</span>
            </label>
            <textarea
              rows={12}
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 font-mono text-[11px] leading-relaxed text-zinc-300 focus:outline-none focus:border-primary transition-all whitespace-pre"
            />
          </div>

          {/* Variables Metadata Info panel */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Sparkles className="w-4 h-4 text-primary" />
              Detected Query Placeholders
            </div>
            
            {detectedVars.length === 0 ? (
              <p className="text-[11px] text-muted-foreground leading-normal">
                No variables detected. Add double curly braces placeholders like <code className="bg-white/5 text-primary px-1 py-0.5 rounded font-mono">{"{{campaign_id}}"}</code> to map excel data.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {detectedVars.map((v) => (
                  <span 
                    key={v}
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      v === "date" 
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        : "bg-primary/10 border-primary/20 text-primary"
                    }`}
                  >
                    {`{{${v}}}`}
                  </span>
                ))}
              </div>
            )}
            
            <div className="flex gap-2 items-start text-[10px] text-muted-foreground/80 mt-2">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                The <code className="text-emerald-400 font-mono">{"{{date}}"}</code> variable is automatically mapped from the report date calendar selector. Other custom tags will match excel headers during file uploads.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
