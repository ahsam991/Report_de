"use client";

import { useState, useEffect, useRef, useCallback, DragEvent, ChangeEvent } from "react";
import {
  Upload, FileText, ArrowRight, ArrowLeft, CheckCircle, AlertTriangle,
  Play, Copy, Download, Search, Database, Calendar, Hash, Eye,
  Settings2, Sparkles, Link2, X, FileSpreadsheet, Layers
} from "lucide-react";
import { addHistoryEntry } from "@/utils/storage";
import { parseExcelFile, parseCsvFile } from "@/utils/excel-parser";
import confetti from "canvas-confetti";

// ══════════════════════════════════════════════════════
//  TYPES
// ══════════════════════════════════════════════════════
interface ColumnDef {
  key: string;
  label: string;
  sqlExpr: string;
  defaultOn: boolean;
}

interface DynamicQuestion {
  id: string;
  alias: string;
}

// ══════════════════════════════════════════════════════
//  OUTPUT COLUMN DEFINITIONS  (ecrm style)
// ══════════════════════════════════════════════════════
const DAILY_RAW_COLUMNS: ColumnDef[] = [
  { key: "contact_id",      label: "Contact ID",          sqlExpr: `q.contact_id`,                                                                                           defaultOn: true  },
  { key: "region",          label: "Region",              sqlExpr: `l."region"`,                                                                                              defaultOn: true  },
  { key: "area",            label: "Area",                sqlExpr: `l."area"`,                                                                                               defaultOn: true  },
  { key: "territory",       label: "Territory",           sqlExpr: `l."territory"`,                                                                                          defaultOn: true  },
  { key: "dist_point",      label: "Distributorspoint",   sqlExpr: `l."point"`,                                                                                              defaultOn: true  },
  { key: "route",           label: "Routes",              sqlExpr: `l."route"`,                                                                                              defaultOn: true  },
  { key: "cluster",         label: "Cluster Name",        sqlExpr: `l."cluster"`,                                                                                            defaultOn: true  },
  { key: "outlet",          label: "Outlet Name",         sqlExpr: `l."outlet"`,                                                                                             defaultOn: true  },
  { key: "username",        label: "User Name",           sqlExpr: `br.username`,                                                                                            defaultOn: true  },
  { key: "full_name",       label: "BR name",             sqlExpr: `ui.full_name`,                                                                                           defaultOn: true  },
  { key: "uid",             label: "BR code",             sqlExpr: `br.uid`,                                                                                                 defaultOn: true  },
  { key: "agency",          label: "Agency",              sqlExpr: `CASE WHEN l."region" IN ('Dhaka South', 'Sylhet') THEN 'Asiatic Trade Marketing Services Limited' WHEN l."region" IN ('Khulna', 'Barishal', 'Rajshahi') THEN 'Integrated Marketing Service Ltd.' ELSE 'IMSL' END`, defaultOn: true  },
  { key: "campaign_name",   label: "Campaign Name",       sqlExpr: `cam."name"`,                                                                                             defaultOn: true  },
  { key: "contact_date",    label: "Contact Date",        sqlExpr: `q.contact_date`,                                                                                         defaultOn: true  },
  { key: "contact_no",      label: "Consumer Number",     sqlExpr: `q.contact_no`,                                                                                           defaultOn: true  },
  { key: "consumer_name",   label: "Consumers Name",      sqlExpr: `COALESCE(q."5")`,                                                                                        defaultOn: true  },
  { key: "consumer_age",    label: "Consumer Age",        sqlExpr: `age(q.contact_date , q."4"::date)::VARCHAR`,                                                             defaultOn: true  },
  { key: "consumer_addr",   label: "Consumer Address",    sqlExpr: `COALESCE(q."7")`,                                                                                        defaultOn: false },
  { key: "occupation",      label: "Consumer Occupation", sqlExpr: `q."57"`,                                                                                                 defaultOn: false },
  { key: "primary_brand",   label: "Primary Brand",       sqlExpr: `q.primary_brand`,                                                                                        defaultOn: true  },
  { key: "secondary_brand", label: "Secondary Brand",     sqlExpr: `q.secondary_brand`,                                                                                      defaultOn: true  },
  { key: "prev_brand",      label: "Previous Brand",      sqlExpr: `pb.sku_name`,                                                                                            defaultOn: true  },
  { key: "ptr",             label: "PTR",                 sqlExpr: `CASE WHEN q.ptr IS NULL THEN 'None' ELSE q.ptr END`,                                                     defaultOn: true  },
  { key: "contact_start",   label: "Contact Start",       sqlExpr: `(q.start_time)::VARCHAR`,                                                                                defaultOn: true  },
  { key: "contact_end",     label: "Contact End",         sqlExpr: `(q.end_time)::VARCHAR`,                                                                                  defaultOn: true  },
  { key: "duration",        label: "Contact Duration",    sqlExpr: `((q.end_time - q.start_time)::TIME)::VARCHAR`,                                                           defaultOn: true  },
  { key: "cluster_type",    label: "Cluster Type",        sqlExpr: `NULL::VARCHAR`,                                                                                          defaultOn: false },
];

const LIVE_OBS_COLUMNS: ColumnDef[] = [
  { key: "contact_id",    label: "Contact ID",              sqlExpr: `jc.id`,            defaultOn: true  },
  { key: "region",        label: "Region",                  sqlExpr: `re."name"`,        defaultOn: true  },
  { key: "area",          label: "Area",                    sqlExpr: `ar."name"`,        defaultOn: true  },
  { key: "territory",     label: "Territory",               sqlExpr: `ter."name"`,       defaultOn: true  },
  { key: "dist_point",    label: "Distributorspoint",       sqlExpr: `po."name"`,        defaultOn: true  },
  { key: "campaign_name", label: "Campaign Name",           sqlExpr: `cm."name"`,        defaultOn: true  },
  { key: "sup_id",        label: "Sup ID",                  sqlExpr: `sup.username`,     defaultOn: true  },
  { key: "sup_name",      label: "Sup Name",                sqlExpr: `sup_i.full_name`,  defaultOn: true  },
  { key: "br_id",         label: "BR ID",                   sqlExpr: `br.username`,      defaultOn: true  },
  { key: "br_name",       label: "BR Name",                 sqlExpr: `br_i.full_name`,   defaultOn: true  },
  { key: "contact_date",  label: "Contact Date",            sqlExpr: `jc.contact_date`,  defaultOn: true  },
];

const CALL_CHECKBACK_COLUMNS: ColumnDef[] = [
  { key: "contact_id",    label: "Contact id",              sqlExpr: `sc.id`,                 defaultOn: true  },
  { key: "sup_id",        label: "FFSup id",                sqlExpr: `sup.username`,           defaultOn: true  },
  { key: "sup_name",      label: "FFSup Name",              sqlExpr: `sup_i.full_name`,        defaultOn: true  },
  { key: "verified_date", label: "Verified Date",           sqlExpr: `sc.contact_date`,        defaultOn: true  },
  { key: "region",        label: "Region",                  sqlExpr: `re.name`,                defaultOn: true  },
  { key: "area",          label: "Area",                    sqlExpr: `ar.name`,                defaultOn: true  },
  { key: "dist_house",    label: "Distribution House",      sqlExpr: `co.name`,                defaultOn: true  },
  { key: "territory",     label: "Territory",               sqlExpr: `ter.name`,               defaultOn: true  },
  { key: "dist_point",    label: "Distributors Point",      sqlExpr: `po.name`,                defaultOn: true  },
  { key: "br_id",         label: "BR id",                   sqlExpr: `br.username`,            defaultOn: true  },
  { key: "br_type",       label: "BR Type",                 sqlExpr: `_cats.display_label`,    defaultOn: false },
  { key: "br_name",       label: "BR Name",                 sqlExpr: `br_i.full_name`,         defaultOn: true  },
  { key: "campaign_name", label: "Campaign Name",           sqlExpr: `cm.name`,                defaultOn: true  },
];

const REPORT_TYPES = [
  { id: "daily_raw",      label: "Daily Raw Report",        columns: DAILY_RAW_COLUMNS,       defaultQuestions: ["1","2","22","3","4","5","7","57"] },
  { id: "live_obs",       label: "Live Observation Report", columns: LIVE_OBS_COLUMNS,        defaultQuestions: [] },
  { id: "call_checkback", label: "Call Checkback Report",   columns: CALL_CHECKBACK_COLUMNS,  defaultQuestions: [] },
];

// ══════════════════════════════════════════════════════
//  SQL BUILDERS
// ══════════════════════════════════════════════════════
function buildDailyRawSQL(campaignId: string, date: string, stdCols: ColumnDef[], dynCols: DynamicQuestion[], qIds: string[]): string {
  const qIdList = qIds.join(",");
  const qValues = qIds.map(q => `\t\t('${q}')`).join(",\n");
  const qCols   = qIds.map(q => `\t\t\t"${q}" VARCHAR`).join(",\n");
  
  const selCols = [
    ...stdCols.map(c => `    ${c.sqlExpr.padEnd(52)} AS "${c.label}"`),
    ...dynCols.map(c => `    COALESCE(q."${c.id}")`.padEnd(56) + ` AS "${c.alias}"`)
  ].join(",\n");

  return `---daily raw report
WITH qu_ans AS (
    SELECT
        *
    FROM
        CROSSTAB(
            $$
            SELECT
                c.id contact_id,
                c.contact_date,
                c.location_id,
                c.campaign_id,
                c.contact_no,
                c.user_id,
                c.otp,
                c."start",
                c."end",
                si.sku_name,
                spms.sku_name,
                mt."name" AS ptr,
                csdm.question_id,
                csdm.answer
            FROM
                ecrm.contacts c
                JOIN ecrm.contact_survey_data_maps csdm ON c.id = csdm.contact_id
                LEFT JOIN ecrm.materials mt ON mt.id = c.giveable AND mt.is_deleted IS FALSE
                LEFT JOIN ecrm.sku_items si ON si.id = c.product
                LEFT JOIN ecrm.sku_items spms ON spms.id = c.secondary_brand
            WHERE
                c.campaign_id = ${campaignId}
                --------Date Filter-----------
                AND c.contact_date = '${date}'
                AND csdm.question_id IN (${qIdList})
            ORDER BY
                c.id, csdm.question_id
            $$,
            $$VALUES
${qValues}
            $$
        ) AS ct (
            contact_id INT,
            contact_date DATE,
            location_id INT,
            campaign_id INT,
            contact_no INT,
            user_id INT,
            otp VARCHAR,
            start_time TIME,
            end_time TIME,
            primary_brand VARCHAR,
            secondary_brand VARCHAR,
            ptr VARCHAR,
${qCols}
        )
)
SELECT
${selCols}
FROM
    qu_ans q
    LEFT JOIN ecrm.all_locations_region_to_outlet l ON q.location_id = l.outlet_id
    LEFT JOIN ecrm.sku_items pb ON q."22"::INT = pb.id
   ,ecrm.user_infos ui
   ,ecrm.users br
   ,ecrm.campaigns cam
WHERE
    q.user_id = br.id
    AND ui.user_id = br.id
    AND br.id NOT IN (
        10839, 21878, 21879, 28195, 21880, 21881, 21882, 21883,24135, 24693, 24698, 24701, 25059, 25060, 25061, 25063, 25065, 25412, 25456, 25062, 28195,25064)
    AND q.campaign_id = cam.id
;`;
}

function buildLiveObsSQL(campaignId: string, date: string, stdCols: ColumnDef[], dynCols: DynamicQuestion[], qIds: string[]): string {
  const qValues = qIds.map(q => `            ('${q}')`).join(",\n");
  const qCols   = qIds.map(q => `                   "${q}" varchar`).join(",\n");
  
  const selCols = [
    ...stdCols.map(c => `        ${c.sqlExpr.padEnd(32)} "${c.label}"`),
    ...dynCols.map(c => `        q."${c.id}"`.padEnd(40) + ` "${c.alias}"`)
  ].join(",\n");

  const grpCols = [
    ...stdCols.map(c => `        ${c.sqlExpr}`)
  ].join(",\n");

  return `--live observation
WITH qu_ans AS
  (SELECT *
   FROM crosstab($$
       select
\t       jcsm.joint_call_id,
\t       jcsm.question_id,
\t\t   jcsm.answer
       FROM     ecrm.joint_calls jc
       JOIN     ecrm.joint_calls_survey_data_maps jcsm
       ON       jc.id = jcsm.joint_call_id
       WHERE    jc.campaign_id = ${campaignId}
       ORDER BY jcsm.joint_call_id, jcsm.question_id
\t$$,
    $$
    values
${qValues}
    $$) AS ct (joint_call_id int,
${qCols}
))
SELECT
${selCols}
FROM qu_ans q
LEFT JOIN ecrm.joint_calls jc ON q.joint_call_id = jc.id
LEFT JOIN ecrm.locations ou ON jc.location_id = ou.id
LEFT JOIN ecrm.locations cl ON ou.parent = cl.id
LEFT JOIN ecrm.locations ro ON cl.parent = ro.id
LEFT JOIN ecrm.locations po ON ro.parent = po.id
LEFT JOIN ecrm.locations ter ON po.parent = ter.id
LEFT JOIN ecrm.locations ar ON ter.parent = ar.id
LEFT JOIN ecrm.locations re ON ar.parent = re.id
LEFT JOIN ecrm.users br ON jc .ff_id = br.id
LEFT JOIN ecrm.user_infos br_i ON br.id = br_i.user_id
LEFT JOIN ecrm.users sup ON jc.user_id = sup.id
LEFT JOIN ecrm.user_infos sup_i ON sup.id = sup_i.user_id,apsis_data.distributorspoint dp,apsis_data.company co,ecrm.campaigns cm
WHERE
\tjc.contact_date = '${date}'
    AND po.source_id = dp.id
    AND dp.dsid = co.id
    AND jc.campaign_id = cm.id
    AND jc.campaign_id = ${campaignId}
GROUP BY
${grpCols}
;`;
}

function buildCallCheckbackSQL(campaignId: string, date: string, stdCols: ColumnDef[], dynCols: DynamicQuestion[], qIds: string[]): string {
  const qValues = qIds.map(q => `            ('${q}')`).join(",\n");
  const qCols   = qIds.map(q => `            "${q}" varchar`).join(",\n");
  
  const selCols = [
    ...stdCols.map(c => `       ${c.sqlExpr.padEnd(36)} AS "${c.label}"`),
    ...dynCols.map(c => `       q."${c.id}"`.padEnd(43) + ` AS "${c.alias}"`)
  ].join(",\n");

  return `WITH qu_ans AS
  (SELECT *
   FROM CROSSTAB(
    $$
    SELECT
        scsdm.sup_contact_id,
        scsdm.question_id,
        scsdm.answer
    FROM ecrm.supervisor_contacts sc
    JOIN ecrm.supervisor_contact_survey_data_maps scsdm ON sc.id = scsdm.sup_contact_id
    WHERE
        sc.campaign_id = ${campaignId}
    ORDER BY
        scsdm.sup_contact_id,
        scsdm.question_id
    $$,
    $$
    VALUES
${qValues}
    $$)
    AS ct (sup_contact_id INT,
${qCols}
))
SELECT
${selCols}

FROM qu_ans q,
     ecrm.supervisor_contacts sc,
     ecrm.contacts c ,
     ecrm.locations ou,
     ecrm.locations cl,
     ecrm.locations ro,
     ecrm.locations po,
     ecrm.locations ter,
     ecrm.locations ar,
     ecrm.locations re,
     apsis_data.distributorspoint dp,
     apsis_data.company co,
     ecrm.users sup,
     ecrm.user_infos sup_i,
     ecrm.users br,
     ecrm.user_infos br_i,
     ecrm.campaigns cm,
     settings._cats
WHERE q.sup_contact_id = sc.id
    AND sc.br_id = br.id
    AND c.location_id = ou.id
    AND sc.user_id = sup.id
    AND sup_i.user_id = sup.id
    AND br_i.user_id = br.id
    AND sc.campaign_id = cm.id
    AND ou.parent = cl.id
    AND cl.parent = ro.id
    AND ro.parent = po.id
    AND po.source_id = dp.id
    AND dp.dsid = co.id
    AND po.parent = ter.id
    AND ter.parent = ar.id
    AND ar.parent = re.id
    AND sc.br_id = c.user_id
    AND sc.contact = c.contact_no
    AND sc.contact_date = c.contact_date
    AND sc.campaign_id = c.campaign_id
    AND br_i.employment_type = _cats.id
    AND cm.id = ${campaignId}
--------DATE FILTER-----------------
 \tand sc.contact_date = '${date}'
  ;`;
}

function buildSQL(typeId: string, campaignId: string, date: string, stdCols: ColumnDef[], dynCols: DynamicQuestion[], qIds: string[]): string {
  if (typeId === "daily_raw")      return buildDailyRawSQL(campaignId, date, stdCols, dynCols, qIds);
  if (typeId === "live_obs")       return buildLiveObsSQL(campaignId, date, stdCols, dynCols, qIds);
  if (typeId === "call_checkback") return buildCallCheckbackSQL(campaignId, date, stdCols, dynCols, qIds);
  return "";
}

// ══════════════════════════════════════════════════════
//  STEP INDICATOR
// ══════════════════════════════════════════════════════
const STEP_LABELS = ["Campaign Config", "Dynamic Questions", "Select Columns", "SQL Output"];

function StepBar({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-1 select-none flex-wrap">
      {STEP_LABELS.map((label, i) => {
        const s = i + 1;
        return (
          <div key={s} className="flex items-center gap-1">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border ${
              step === s
                ? "bg-primary text-white border-primary shadow-lg shadow-primary/25"
                : step > s
                ? "bg-primary/15 text-primary border-primary/25"
                : "bg-white/5 text-muted-foreground border-white/5"
            }`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${step > s ? "bg-primary/30" : "bg-white/10"}`}>{s}</span>
              <span className="hidden sm:inline">{label}</span>
            </div>
            {i < STEP_LABELS.length - 1 && <div className="w-4 h-px bg-white/10" />}
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════════════
export default function GenerateReport() {
  const [step, setStep] = useState(1);

  // Step 1 — Campaign Config
  const [campaignId, setCampaignId] = useState("");
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);
  const [reportTypeId, setReportTypeId] = useState("daily_raw");

  // Step 2 — Dynamic Questions (Excel)
  const [file, setFile] = useState<File | null>(null);
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [fileRows, setFileRows] = useState<string[][]>([]);
  const [fileError, setFileError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [qIdCol, setQIdCol] = useState<string>("");
  const [aliasCol, setAliasCol] = useState<string>("");
  const [parsedQuestions, setParsedQuestions] = useState<DynamicQuestion[]>([]);

  // Step 3 — Select Columns
  const [enabledStdKeys, setEnabledStdKeys] = useState<Set<string>>(new Set());
  const [enabledDynKeys, setEnabledDynKeys] = useState<Set<string>>(new Set());
  
  const activeRT = REPORT_TYPES.find(r => r.id === reportTypeId)!;

  // Step 4 — Output
  const [generatedSQL, setGeneratedSQL] = useState("");
  const [searchSQL, setSearchSQL] = useState("");
  const [copied, setCopied] = useState(false);

  // ── Init standard columns when report type changes
  useEffect(() => {
    setEnabledStdKeys(new Set(activeRT.columns.filter(c => c.defaultOn).map(c => c.key)));
  }, [reportTypeId]);

  // ── File handling
  const processFile = useCallback(async (f: File) => {
    setParsing(true);
    setFileError("");
    try {
      const ext = f.name.split(".").pop()?.toLowerCase();
      let rows: string[][] = [];
      if (ext === "csv") {
        const raw = await parseCsvFile(f);
        rows = raw.map(r => r.map(String));
      } else {
        const sheets = await parseExcelFile(f);
        const firstSheet = Object.values(sheets)[0];
        rows = firstSheet.map(r => r.map(String));
      }
      if (rows.length < 2) {
        setFileError("File is empty or has no data rows.");
        return;
      }
      const headers = rows[0];
      const dataRows = rows.slice(1).filter(r => r.some(c => c.trim()));
      setFileHeaders(headers);
      setFileRows(dataRows);
      setFile(f);
      
      // Auto-detect columns (e.g. id, slug, alias)
      const idGuess = headers.find(h => /^id$/i.test(h) || /question[_\s]?id/i.test(h)) || "";
      const aliasGuess = headers.find(h => /alias/i.test(h) || /name/i.test(h)) || "";
      setQIdCol(idGuess);
      setAliasCol(aliasGuess);
    } catch (e: any) {
      setFileError(e?.message || "Failed to parse file.");
    } finally {
      setParsing(false);
    }
  }, []);

  const onDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) processFile(dropped);
  }, [processFile]);

  // ── Update parsed dynamic questions when mapping changes
  useEffect(() => {
    if (!file || !qIdCol || !aliasCol) {
      setParsedQuestions([]);
      setEnabledDynKeys(new Set());
      return;
    }
    const qIdx = fileHeaders.indexOf(qIdCol);
    const aIdx = fileHeaders.indexOf(aliasCol);
    
    const qs: DynamicQuestion[] = [];
    fileRows.forEach(r => {
      const id = r[qIdx]?.trim();
      const alias = r[aIdx]?.trim();
      if (id && alias) qs.push({ id, alias });
    });
    setParsedQuestions(qs);
    // By default enable all dynamic columns
    setEnabledDynKeys(new Set(qs.map(q => q.id)));
  }, [qIdCol, aliasCol, fileRows, fileHeaders, file]);

  // ── Handlers
  const toggleStdCol = (key: string) => {
    setEnabledStdKeys(prev => {
      const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n;
    });
  };
  const toggleDynCol = (id: string) => {
    setEnabledDynKeys(prev => {
      const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
    });
  };

  const selectAll = () => {
    setEnabledStdKeys(new Set(activeRT.columns.map(c => c.key)));
    setEnabledDynKeys(new Set(parsedQuestions.map(q => q.id)));
  };
  const selectNone = () => {
    setEnabledStdKeys(new Set());
    setEnabledDynKeys(new Set());
  };

  const handleGenerate = () => {
    // Collect unique Question IDs for CROSSTAB VALUES
    const qIdsSet = new Set(activeRT.defaultQuestions);
    parsedQuestions.forEach(q => qIdsSet.add(q.id));
    const allQIds = Array.from(qIdsSet).sort((a,b) => parseInt(a) - parseInt(b));

    const selectedStdCols = activeRT.columns.filter(c => enabledStdKeys.has(c.key));
    const selectedDynCols = parsedQuestions.filter(q => enabledDynKeys.has(q.id));

    const sql = buildSQL(reportTypeId, campaignId.trim(), reportDate, selectedStdCols, selectedDynCols, allQIds);
    setGeneratedSQL(sql);

    addHistoryEntry({
      fileName: `Campaign ${campaignId}`,
      rowCount: 1,
      templateName: activeRT.label,
      queriesCount: 1,
    });

    confetti({ particleCount: 90, spread: 65, origin: { y: 0.8 }, colors: ["#8b5cf6","#6366f1","#3b82f6"] });
    setStep(4);
  };

  // ══════════════════════════════════════════════════════
  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider uppercase flex items-center gap-2">
            <Database className="w-6 h-6 text-primary" /> Report Generator
          </h1>
          <p className="text-muted-foreground text-xs mt-1">Generate multi-flow dynamic SQL queries using Survey Excel mappings.</p>
        </div>
        <StepBar step={step} />
      </div>

      {/* ─── STEP 1: CAMPAIGN CONFIG ─── */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="glass-card p-6 md:p-8 rounded-3xl space-y-8">
            <div className="flex items-center gap-3 border-b border-white/5 pb-5">
              <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20 text-primary">
                <Hash className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Campaign Details</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">Enter the Campaign ID and select the report date and type.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-primary" /> Campaign ID *
                </label>
                <input
                  type="number"
                  value={campaignId}
                  onChange={e => setCampaignId(e.target.value)}
                  placeholder="e.g. 180"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xl font-mono font-bold text-primary focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/30"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary" /> Report Date
                </label>
                <input
                  type="date"
                  value={reportDate}
                  onChange={e => setReportDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" /> Report Type
                </label>
                <select
                  value={reportTypeId}
                  onChange={e => setReportTypeId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                >
                  {REPORT_TYPES.map(r => (
                    <option key={r.id} value={r.id} className="bg-zinc-950">{r.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={!campaignId.trim()}
              className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold transition-all ${
                campaignId.trim()
                  ? "bg-primary hover:bg-primary/95 text-white hover:scale-[1.02] shadow-lg shadow-primary/20"
                  : "bg-white/5 text-muted-foreground cursor-not-allowed border border-white/5"
              }`}
            >
              Next: Dynamic Questions <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 2: DYNAMIC QUESTIONS (EXCEL) ─── */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="glass-card p-6 rounded-3xl space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20 text-primary">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Dynamic Questions Mapping (Optional)</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Upload a survey schema Excel file containing Question IDs and Aliases to generate dynamic columns.</p>
              </div>
            </div>

            {!file ? (
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-all ${
                  isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-white/10 hover:border-primary/40 hover:bg-white/3"
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${isDragging ? "bg-primary/15 border-primary/30 text-primary" : "bg-white/5 border-white/10 text-muted-foreground"}`}>
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-white">Drop Survey Excel here</p>
                  <p className="text-xs text-muted-foreground mt-1">Columns needed: Question ID, Alias</p>
                </div>
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => e.target.files?.[0] && processFile(e.target.files[0])} />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                  <FileText className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{file.name}</p>
                    <p className="text-[11px] text-emerald-400 mt-0.5">Loaded {fileRows.length} questions</p>
                  </div>
                  <button onClick={() => { setFile(null); setQIdCol(""); setAliasCol(""); setParsedQuestions([]); }} className="text-muted-foreground hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 gap-5 border border-white/10 rounded-2xl p-5 bg-black/20">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-muted-foreground tracking-wider uppercase">Question ID Column</label>
                    <select value={qIdCol} onChange={e => setQIdCol(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary">
                      <option value="">— Select —</option>
                      {fileHeaders.map(h => <option key={h} value={h} className="bg-zinc-950">{h}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-muted-foreground tracking-wider uppercase">Alias Column</label>
                    <select value={aliasCol} onChange={e => setAliasCol(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary">
                      <option value="">— Select —</option>
                      {fileHeaders.map(h => <option key={h} value={h} className="bg-zinc-950">{h}</option>)}
                    </select>
                  </div>
                </div>

                {parsedQuestions.length > 0 && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                    <p className="text-[10px] font-bold text-primary tracking-wider uppercase mb-2">Mapped Questions Preview</p>
                    <div className="space-y-1.5">
                      {parsedQuestions.slice(0, 5).map((q, i) => (
                        <div key={i} className="flex items-center gap-3 text-xs">
                          <span className="font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">ID: {q.id}</span>
                          <ArrowRight className="w-3 h-3 text-muted-foreground" />
                          <span className="text-white/80 font-mono">AS "{q.alias}"</span>
                        </div>
                      ))}
                      {parsedQuestions.length > 5 && <p className="text-[10px] text-muted-foreground pl-1 mt-2">+ {parsedQuestions.length - 5} more questions mapped</p>}
                    </div>
                  </div>
                )}
              </div>
            )}
            {fileError && <div className="text-amber-400 text-xs flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{fileError}</div>}
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm px-6 py-3.5 rounded-2xl transition-all">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={() => setStep(3)} className="inline-flex items-center gap-2 bg-primary hover:bg-primary/95 text-white font-bold text-sm px-6 py-3.5 rounded-2xl transition-all hover:scale-[1.02] shadow-lg shadow-primary/20">
              {file && parsedQuestions.length > 0 ? "Continue with Mappings" : "Skip Mapping"} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 3: SELECT OUTPUT COLUMNS ─── */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="glass-card p-6 rounded-3xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2"><Eye className="w-5 h-5 text-primary" /> Select Output Columns</h2>
                <p className="text-[11px] text-muted-foreground mt-1">Choose which columns to include in the final SQL query.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={selectAll} className="text-[11px] font-semibold text-primary hover:underline px-2 py-1">Select All</button>
                <button onClick={selectNone} className="text-[11px] font-semibold text-muted-foreground hover:text-white px-2 py-1">Select None</button>
              </div>
            </div>

            {/* Standard Columns */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">Standard Columns</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {activeRT.columns.map(col => {
                  const on = enabledStdKeys.has(col.key);
                  return (
                    <button key={col.key} onClick={() => toggleStdCol(col.key)} className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-left border group transition-all ${on ? "bg-primary/10 border-primary/30 text-white" : "bg-white/5 border-white/5 text-muted-foreground hover:border-white/15 hover:text-white"}`}>
                      <div className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all ${on ? "bg-primary border-primary" : "border-white/20"}`}>
                        {on && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">{col.label}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Columns */}
            {parsedQuestions.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-white/5">
                <p className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase">Dynamic Columns (From Excel)</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {parsedQuestions.map(q => {
                    const on = enabledDynKeys.has(q.id);
                    return (
                      <button key={q.id} onClick={() => toggleDynCol(q.id)} className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-left border group transition-all ${on ? "bg-emerald-500/10 border-emerald-500/30 text-white" : "bg-white/5 border-white/5 text-muted-foreground hover:border-white/15 hover:text-white"}`}>
                        <div className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all ${on ? "bg-emerald-500 border-emerald-500" : "border-white/20"}`}>
                          {on && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">{q.alias}</p>
                          <p className="text-[9px] font-mono text-muted-foreground/60 mt-0.5">ID: {q.id}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(2)} className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm px-6 py-3.5 rounded-2xl transition-all">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={handleGenerate} disabled={enabledStdKeys.size === 0 && enabledDynKeys.size === 0} className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all ${enabledStdKeys.size > 0 || enabledDynKeys.size > 0 ? "bg-primary hover:bg-primary/95 text-white shadow-lg shadow-primary/20 hover:scale-[1.02]" : "bg-white/5 text-muted-foreground border border-white/5"}`}>
              <Play className="w-4 h-4 fill-white" /> Generate SQL
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 4: SQL OUTPUT ─── */}
      {step === 4 && (
        <div className="space-y-5">
          <div className="glass-card p-6 rounded-3xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-white/5 pb-5">
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-white flex items-center gap-2"><CheckCircle className="w-5 h-5 text-emerald-400" /> SQL Generated Successfully</h2>
                <p className="text-[11px] text-muted-foreground">Campaign <span className="text-white font-mono">{campaignId}</span> · {activeRT.label} · <span className="text-white">{enabledStdKeys.size + enabledDynKeys.size}</span> columns</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { navigator.clipboard.writeText(generatedSQL); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className={`inline-flex items-center gap-2 border text-xs font-semibold px-4 py-2.5 rounded-xl transition-all ${copied ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-white/5 border-white/10 text-white"}`}>
                  {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? "Copied!" : "Copy SQL"}
                </button>
                <button onClick={() => { const url = URL.createObjectURL(new Blob([generatedSQL])); const a = document.createElement("a"); a.href = url; a.download = `Campaign_${campaignId}.sql`; a.click(); URL.revokeObjectURL(url); }} className="inline-flex items-center gap-2 bg-primary text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-primary/20">
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
              </div>
            </div>

            <div className="relative max-w-sm">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Search SQL..." value={searchSQL} onChange={e => setSearchSQL(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:border-primary" />
            </div>

            <div className="rounded-2xl border border-white/5 overflow-hidden bg-black/50">
              <div className="bg-white/5 px-4 py-2 flex items-center gap-3 border-b border-white/5">
                <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500/60" /><div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" /><div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" /></div>
                <span className="text-[10px] font-mono text-muted-foreground">Campaign_{campaignId}.sql</span>
              </div>
              <pre className="p-5 overflow-x-auto text-[11.5px] font-mono text-zinc-300 leading-relaxed whitespace-pre max-h-[58vh] overflow-y-auto">
                {searchSQL ? generatedSQL.split("\n").filter(l => l.toLowerCase().includes(searchSQL.toLowerCase())).join("\n") : generatedSQL}
              </pre>
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(3)} className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm px-6 py-3.5 rounded-2xl transition-all">
              <ArrowLeft className="w-4 h-4" /> Adjust Columns
            </button>
            <button onClick={() => { setFile(null); setParsedQuestions([]); setCampaignId(""); setStep(1); }} className="inline-flex items-center gap-2 bg-primary hover:bg-primary/95 text-white font-bold text-sm px-6 py-3.5 rounded-2xl transition-all hover:scale-[1.02] shadow-lg shadow-primary/20">
              New Report <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
