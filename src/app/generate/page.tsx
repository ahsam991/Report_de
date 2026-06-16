"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Upload, 
  FileText, 
  ArrowRight, 
  ArrowLeft, 
  Settings as SettingsIcon,
  CheckCircle,
  AlertTriangle,
  Play,
  Copy,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  Database,
  Calendar
} from "lucide-react";
import { getTemplates, addHistoryEntry, saveMapping, getSavedMappings, getSettings, Template } from "@/utils/storage";
import { parseExcelFile, parseCsvFile } from "@/utils/excel-parser";
import { extractPlaceholders, renderQuery } from "@/utils/template-engine";
import confetti from "canvas-confetti";

export default function GenerateReport() {
  // Wizard state
  const [step, setStep] = useState(1);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [reportDate, setReportDate] = useState("");
  
  // File state
  const [file, setFile] = useState<File | null>(null);
  const [fileMetadata, setFileMetadata] = useState<{ name: string; size: string } | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [sheets, setSheets] = useState<{ [name: string]: any[][] }>({});
  const [selectedSheet, setSelectedSheet] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<any[][]>([]);
  
  // Mapping state
  const [templateVars, setTemplateVars] = useState<string[]>([]);
  const [mappings, setMappings] = useState<{ [variable: string]: string }>({});
  
  // Output state
  const [generatedQueries, setGeneratedQueries] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load configs on mount
  useEffect(() => {
    const activeTemplates = getTemplates();
    setTemplates(activeTemplates);
    if (activeTemplates.length > 0) {
      setSelectedTemplateId(activeTemplates[0].id);
    }
    // Set default date to today
    setReportDate(new Date().toISOString().split("T")[0]);
  }, []);

  // Update variables when template changes
  useEffect(() => {
    const tmpl = templates.find((t) => t.id === selectedTemplateId);
    if (tmpl) {
      const vars = extractPlaceholders(tmpl.sql);
      setTemplateVars(vars);
      
      // Auto mapping attempt when headers or template variables change
      if (headers.length > 0) {
        attemptAutoMapping(vars, headers);
      }
    }
  }, [selectedTemplateId, templates, headers]);

  // Attempt auto-mapping
  const attemptAutoMapping = (variables: string[], sheetHeaders: string[]) => {
    const newMappings: { [variable: string]: string } = {};
    
    variables.forEach((variable) => {
      // Look for custom rules or direct matches
      const varLower = variable.toLowerCase();
      
      // Check saved mappings first if any
      const saved = getSavedMappings();
      if (file && saved[file.name] && saved[file.name][variable]) {
        newMappings[variable] = saved[file.name][variable];
        return;
      }
      
      // Standard matching rules
      const match = sheetHeaders.find((header) => {
        const hLower = header.toLowerCase().replace(/[^a-z0-9]/g, "");
        const vLowerClean = varLower.replace(/[^a-z0-9]/g, "");
        return (
          hLower === vLowerClean || 
          hLower.includes(vLowerClean) || 
          vLowerClean.includes(hLower) ||
          (vLowerClean === "id" && hLower.includes("id")) ||
          (vLowerClean === "alias" && hLower.includes("alias")) ||
          (vLowerClean === "slug" && hLower.includes("slug"))
        );
      });
      
      newMappings[variable] = match || "";
    });
    
    setMappings(newMappings);
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = async (selectedFile: File) => {
    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext || "")) {
      alert("Unsupported file format. Please upload an Excel or CSV file.");
      return;
    }

    setFile(selectedFile);
    setFileMetadata({
      name: selectedFile.name,
      size: `${(selectedFile.size / 1024).toFixed(1)} KB`
    });

    try {
      if (ext === "csv") {
        const csvData = await parseCsvFile(selectedFile);
        if (csvData.length > 0) {
          setSheets({ "CSV Data": csvData });
          setSelectedSheet("CSV Data");
          setHeaders(csvData[0]);
          setRows(csvData.slice(1));
        } else {
          alert("The CSV file seems to be empty.");
        }
      } else {
        const excelSheets = await parseExcelFile(selectedFile);
        setSheets(excelSheets);
        const firstSheet = Object.keys(excelSheets)[0];
        if (firstSheet) {
          setSelectedSheet(firstSheet);
          const sheetData = excelSheets[firstSheet];
          if (sheetData && sheetData.length > 0) {
            setHeaders(sheetData[0]);
            setRows(sheetData.slice(1));
          }
        }
      }
    } catch (err) {
      console.error(err);
      alert("Error reading file. Please verify that the file is not corrupted.");
    }
  };

  // Change active Excel sheet
  const handleSheetChange = (sheetName: string) => {
    setSelectedSheet(sheetName);
    const sheetData = sheets[sheetName];
    if (sheetData && sheetData.length > 0) {
      setHeaders(sheetData[0]);
      setRows(sheetData.slice(1));
    }
  };

  const handleMappingChange = (variable: string, header: string) => {
    setMappings((prev) => ({
      ...prev,
      [variable]: header
    }));
  };

  // Main generator trigger
  const handleGenerate = () => {
    const tmpl = templates.find((t) => t.id === selectedTemplateId);
    if (!tmpl || rows.length === 0) return;

    // Check if mappings are valid
    const unmapped = templateVars.filter((v) => v !== "date" && !mappings[v]);
    if (unmapped.length > 0) {
      alert(`Please map all placeholders before generating: ${unmapped.join(", ")}`);
      return;
    }

    // Save mappings in storage
    if (file) {
      saveMapping(file.name, mappings);
    }

    const queries: string[] = [];
    
    rows.forEach((row) => {
      // Build row value dictionary
      const rowDictionary: { [variable: string]: any } = {};
      
      templateVars.forEach((variable) => {
        if (variable === "date") {
          rowDictionary["date"] = reportDate;
        } else {
          const mappedHeader = mappings[variable];
          const colIndex = headers.indexOf(mappedHeader);
          rowDictionary[variable] = colIndex !== -1 ? row[colIndex] : "";
        }
      });
      
      const query = renderQuery(tmpl.sql, rowDictionary);
      queries.push(query);
    });

    setGeneratedQueries(queries);
    setCurrentPage(1);

    // Save history entry
    addHistoryEntry({
      fileName: file?.name || "unnamed_file",
      rowCount: rows.length,
      templateName: tmpl.name,
      queriesCount: queries.length
    });

    // Check settings for auto-copy
    const settings = getSettings();
    if (settings.autoCopyGenerated) {
      navigator.clipboard.writeText(queries.join("\n\n"));
    }

    // Success celebration
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 },
      colors: ["#8b5cf6", "#6366f1", "#3b82f6"]
    });

    setStep(3);
  };

  // Copy and download helpers
  const handleCopyAll = () => {
    navigator.clipboard.writeText(generatedQueries.join("\n\n"));
    alert("All generated queries successfully copied to clipboard.");
  };

  const handleDownloadSql = () => {
    const tmpl = templates.find((t) => t.id === selectedTemplateId);
    const blob = new Blob([generatedQueries.join("\n\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${tmpl?.name.toLowerCase().replace(/\s+/g, "_") || "queries"}_${reportDate}.sql`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Filtering for preview
  const filteredQueries = generatedQueries.filter((q) =>
    q.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredQueries.length / itemsPerPage);
  const paginatedQueries = filteredQueries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      {/* Page Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider uppercase flex items-center gap-2">
            <Database className="w-6 h-6 text-primary" />
            Report Generator
          </h1>
          <p className="text-muted-foreground text-xs mt-1">
            Follow the wizard to generate your report query script files.
          </p>
        </div>
        
        {/* Step Indicators */}
        <div className="flex items-center gap-2 select-none">
          {[1, 2, 3].map((s) => (
            <div 
              key={s}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all border ${
                step === s 
                  ? "bg-primary text-white border-primary shadow-lg shadow-primary/25"
                  : step > s 
                    ? "bg-primary/20 text-primary border-primary/30" 
                    : "bg-white/5 text-muted-foreground border-white/5"
              }`}
            >
              {s}
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1: UPLOAD & CONFIGURATION */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-3xl space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Upload Source Spreadsheet
            </h2>
            
            {/* File Drag Box */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-4 ${
                isDragActive 
                  ? "border-primary bg-primary/5" 
                  : file 
                    ? "border-white/20 bg-white/5" 
                    : "border-white/10 hover:border-primary/50 hover:bg-white/5"
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx,.xls,.csv"
                className="hidden"
              />
              
              <div className="bg-primary/10 p-4 rounded-full border border-primary/20 text-primary">
                <FileText className="w-8 h-8" />
              </div>
              
              {file ? (
                <div className="space-y-1">
                  <p className="font-bold text-white text-sm">{fileMetadata?.name}</p>
                  <p className="text-xs text-muted-foreground">{fileMetadata?.size}</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="font-semibold text-white text-sm">Drag & drop your file here, or click to browse</p>
                  <p className="text-xs text-muted-foreground">Supports Excel (.xlsx, .xls) and CSV (.csv)</p>
                </div>
              )}
            </div>

            {/* Config inputs */}
            <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-white/5">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Report Target Date
                </label>
                <input 
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
                  <SettingsIcon className="w-3.5 h-3.5" />
                  SQL Report Template
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id} className="bg-zinc-950">
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={!file}
              className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold transition-all ${
                file 
                  ? "bg-primary hover:bg-primary/95 text-white hover:scale-[1.02] shadow-lg shadow-primary/25"
                  : "bg-white/5 text-muted-foreground cursor-not-allowed border border-white/5"
              }`}
            >
              Continue to Mapping
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: COLUMN MAPPING */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-3xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-primary" />
                Map Spreadsheet Columns
              </h2>
              
              {/* Sheet selector (visible only for Excel with multiple sheets) */}
              {Object.keys(sheets).length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-medium">Sheet:</span>
                  <select
                    value={selectedSheet}
                    onChange={(e) => handleSheetChange(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-primary"
                  >
                    {Object.keys(sheets).map((sheetName) => (
                      <option key={sheetName} value={sheetName} className="bg-zinc-950">
                        {sheetName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Verify the mappings below. The platform auto-matched columns with template variables, but you can override them using the dropdowns.
            </p>

            <div className="space-y-4 pt-2">
              {templateVars.map((variable) => {
                if (variable === "date") {
                  return (
                    <div key={variable} className="grid grid-cols-2 gap-4 items-center p-3 rounded-2xl bg-white/5 border border-white/5">
                      <div>
                        <span className="font-mono text-xs font-bold text-primary">date</span>
                        <p className="text-[10px] text-muted-foreground/75 mt-0.5">Automated from the report date selector.</p>
                      </div>
                      <div className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl text-center">
                        {reportDate}
                      </div>
                    </div>
                  );
                }

                const currentMap = mappings[variable] || "";
                return (
                  <div key={variable} className="grid grid-cols-2 gap-4 items-center p-3.5 rounded-2xl bg-white/5 border border-white/5">
                    <div>
                      <span className="font-mono text-sm font-bold text-white">
                        {`{{${variable}}}`}
                      </span>
                    </div>
                    <select
                      value={currentMap}
                      onChange={(e) => handleMappingChange(variable, e.target.value)}
                      className={`w-full bg-white/5 border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary transition-colors ${
                        currentMap ? "border-white/10" : "border-amber-500/40 bg-amber-500/5 text-amber-300"
                      }`}
                    >
                      <option value="" className="bg-zinc-950">Select spreadsheet column...</option>
                      {headers.map((h) => (
                        <option key={h} value={h} className="bg-zinc-950">
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>

            {/* Verification Alert */}
            {templateVars.filter(v => v !== "date" && !mappings[v]).length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3 text-amber-400">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold">Unmapped Variables Found</p>
                  <p className="text-[11px] text-amber-400/80 leading-normal">
                    Some template variables are not mapped to any spreadsheet column. You must complete mapping to generate queries.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-6 py-3.5 rounded-2xl transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={handleGenerate}
              disabled={templateVars.filter(v => v !== "date" && !mappings[v]).length > 0}
              className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold transition-all ${
                templateVars.filter(v => v !== "date" && !mappings[v]).length === 0
                  ? "bg-primary hover:bg-primary/95 text-white hover:scale-[1.02] shadow-lg shadow-primary/25"
                  : "bg-white/5 text-muted-foreground cursor-not-allowed border border-white/5"
              }`}
            >
              <Play className="w-4 h-4 fill-white" />
              Generate SQL Queries
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: PREVIEW & EXPORT */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-3xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  Queries Generated Successfully
                </h2>
                <p className="text-xs text-muted-foreground">
                  Generated <span className="font-semibold text-white">{generatedQueries.length}</span> queries from <span className="font-semibold text-white">{rows.length}</span> parsed dataset rows.
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={handleCopyAll}
                  className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all hover:scale-[1.02]"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy All
                </button>
                <button
                  onClick={handleDownloadSql}
                  className="inline-flex items-center gap-2 bg-primary hover:bg-primary/95 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all hover:scale-[1.02] shadow-md shadow-primary/20"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download .sql File
                </button>
              </div>
            </div>

            {/* Query Preview Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-bold text-muted-foreground tracking-wider uppercase">SQL Output Preview</span>
                
                {/* Search query input */}
                <div className="relative max-w-xs w-full">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search queries..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Paginated queries visual codeblock list */}
              {paginatedQueries.length === 0 ? (
                <div className="py-12 border border-dashed border-white/10 rounded-2xl text-center text-xs text-muted-foreground">
                  No matching queries found.
                </div>
              ) : (
                <div className="space-y-4">
                  {paginatedQueries.map((query, index) => {
                    const globalIdx = (currentPage - 1) * itemsPerPage + index + 1;
                    return (
                      <div key={index} className="rounded-2xl border border-white/5 overflow-hidden bg-black/40">
                        <div className="bg-white/5 px-4 py-2 flex items-center justify-between text-[10px] text-muted-foreground border-b border-white/5">
                          <span className="font-mono">Row #{globalIdx}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(query);
                              alert(`Query for row #${globalIdx} copied.`);
                            }}
                            className="hover:text-white transition-colors"
                          >
                            Copy Row SQL
                          </button>
                        </div>
                        <pre className="p-4 overflow-x-auto text-[11px] font-mono text-zinc-300 leading-relaxed text-left whitespace-pre">
                          {query}
                        </pre>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <span className="text-[11px] text-muted-foreground">
                    Showing <span className="font-medium text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
                    <span className="font-medium text-white">
                      {Math.min(currentPage * itemsPerPage, filteredQueries.length)}
                    </span>{" "}
                    of <span className="font-medium text-white">{filteredQueries.length}</span> queries
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <span className="text-xs font-bold text-white px-2.5">
                      Page {currentPage} of {totalPages}
                    </span>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-6 py-3.5 rounded-2xl transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Adjust Mapping
            </button>
            <button
              onClick={() => {
                setFile(null);
                setFileMetadata(null);
                setSheets({});
                setRows([]);
                setHeaders([]);
                setGeneratedQueries([]);
                setStep(1);
              }}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/95 text-white font-bold px-6 py-3.5 rounded-2xl transition-all hover:scale-[1.02] shadow-lg shadow-primary/25"
            >
              Start New Generation
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
