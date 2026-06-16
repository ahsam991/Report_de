"use client";

import { useState, useEffect, useRef, useCallback, DragEvent, ChangeEvent } from "react";
import {
  Upload, FileText, ArrowRight, ArrowLeft, CheckCircle, AlertTriangle,
  Play, Copy, Download, Search, Database, Calendar, Hash, Eye,
  Settings2, Sparkles, Table2, Link2, ChevronDown, X, Info,
  FileSpreadsheet, ToggleLeft, ToggleRight, Layers,
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

interface ParsedRow {
  [col: string]: string;
}

interface GeneratedQuery {
  label: string;   // alias or campaign id
  campaignId: string;
  sql: string;
}

// ══════════════════════════════════════════════════════
//  OUTPUT COLUMN DEFINITIONS  (ecrm style)
// ══════════════════════════════════════════════════════
const DAILY_RAW_COLUMNS: ColumnDef[] = [
  { key: "contact_id",      label: "Contact ID",          sqlExpr: `q.contact_id`,                                                                                           defaultOn: true  },
  { key: "region",          label: "Region",              sqlExpr: `l."region"`,                                                                                              defaultOn: true  },
  { key: "area",            label: "Area",                sqlExpr: `l."area"`,                                                                                               defaultOn: true  },
  { key: "territory",       label: "Territory",           sqlExpr: `l."territory"`,                                                                                          defaultOn: true  },
  { key: "dist_point",      label: "Distributorspoint",  sqlExpr: `l."point"`,                                                                                              defaultOn: true  },
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
  { key: "q1",            label: "ra_correct_cluster",      sqlExpr: `q."1"`,            defaultOn: true  },
  { key: "q2",            label: "ra_correct_attire",       sqlExpr: `q."2"`,            defaultOn: true  },
  { key: "q3",            label: "shop_owner_permission",   sqlExpr: `q."3"`,            defaultOn: true  },
  { key: "q4",            label: "exists_third_part_app",   sqlExpr: `q."4"`,            defaultOn: false },
  { key: "q5",            label: "correct_consumer_profile",sqlExpr: `q."5"`,            defaultOn: true  },
  { key: "q6",            label: "telling_about_variant",   sqlExpr: `q."6"`,            defaultOn: true  },
  { key: "q7",            label: "telling_about_luckies",   sqlExpr: `q."7"`,            defaultOn: true  },
  { key: "q8",            label: "showing_av",              sqlExpr: `q."8"`,            defaultOn: true  },
  { key: "q9",            label: "asking_about_trial",      sqlExpr: `q."9"`,            defaultOn: true  },
  { key: "q10",           label: "telling_about_ptr",       sqlExpr: `q."10"`,           defaultOn: true  },
  { key: "q11",           label: "availability",            sqlExpr: `q."11"`,           defaultOn: true  },
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
  { key: "q1",            label: "receive_call",            sqlExpr: `q."1"`,                  defaultOn: true  },
  { key: "q2",            label: "continue_conversation",   sqlExpr: `q."2"`,                  defaultOn: true  },
  { key: "q3",            label: "correct_consumer_name",   sqlExpr: `q."3"`,                  defaultOn: true  },
  { key: "q4",            label: "correct_consumer_age",    sqlExpr: `q."4"`,                  defaultOn: true  },
  { key: "q5",            label: "correct_primary_brand",   sqlExpr: `q."5"`,                  defaultOn: true  },
  { key: "q6",            label: "contacted_by_ra",         sqlExpr: `q."6"`,                  defaultOn: true  },
  { key: "q7",            label: "telling_about_luckies",   sqlExpr: `q."7"`,                  defaultOn: true  },
  { key: "q8",            label: "showing_av",              sqlExpr: `q."8"`,                  defaultOn: true  },
  { key: "q9",            label: "showing_pack",            sqlExpr: `q."9"`,                  defaultOn: false },
  { key: "q10",           label: "asking_about_trial",      sqlExpr: `q."10"`,                 defaultOn: true  },
  { key: "q11",           label: "telling_about_ptr",       sqlExpr: `q."11"`,                 defaultOn: true  },
  { key: "q12",           label: "accepted_ptr_offer",      sqlExpr: `q."12"`,                 defaultOn: false },
];

const REPORT_TYPES = [
  { id: "daily_raw",      label: "Daily Raw Report",        columns: DAILY_RAW_COLUMNS,       defaultQuestions: ["1","2","22","3","4","5","7","57","8","9","10","11","12","13","14","15","16","17"] },
  { id: "live_obs",       label: "Live Observation Report", columns: LIVE_OBS_COLUMNS,        defaultQuestions: ["1","2","3","4","5","6","7","8","9","10","11"] },
  { id: "call_checkback", label: "Call Checkback Report",   columns: CALL_CHECKBACK_COLUMNS,  defaultQuestions: ["1","2","20","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","19","21","22"] },
];

// ══════════════════════════════════════════════════════
//  SQL BUILDERS — exact ecrm style from source files
// ══════════════════════════════════════════════════════
function buildDailyRawSQL(campaignId: string, date: string, enabled: Set<string>, qIds: string[]): string {
  const qIdList = qIds.join(",");
  const qValues = qIds.map(q => `\t\t('${q}')`).join(",\n");
  const qCols   = qIds.map(q => `\t\t\t"${q}" VARCHAR`).join(",\n");
  const selCols = DAILY_RAW_COLUMNS.filter(c => enabled.has(c.key))
    .map(c => `    ${c.sqlExpr.padEnd(52)} AS "${c.label}"`).join(",\n");
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

function buildLiveObsSQL(campaignId: string, date: string, enabled: Set<string>, qIds: string[]): string {
  const qValues  = qIds.map(q => `            ('${q}')`).join(",\n");
  const qCols    = qIds.map(q => `                   "${q}" varchar`).join(",\n");
  const selCols  = LIVE_OBS_COLUMNS.filter(c => enabled.has(c.key))
    .map(c => `        ${c.sqlExpr.padEnd(32)} "${c.label}"`).join(",\n");
  const grpCols  = LIVE_OBS_COLUMNS.filter(c => enabled.has(c.key))
    .map(c => `        ${c.sqlExpr}`).join(",\n");
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
-- \tjc.contact_date = CURRENT_DATE
--  AND jc.contact_date = CURRENT_DATE-1
    AND po.source_id = dp.id
    AND dp.dsid = co.id
    AND jc.campaign_id = cm.id
    AND jc.campaign_id = ${campaignId}
GROUP BY
${grpCols}
;`;
}

function buildCallCheckbackSQL(campaignId: string, date: string, enabled: Set<string>, qIds: string[]): string {
  const qValues  = qIds.map(q => `            ('${q}')`).join(",\n");
  const qCols    = qIds.map(q => `            "${q}" varchar`).join(",\n");
  const selCols  = CALL_CHECKBACK_COLUMNS.filter(c => enabled.has(c.key))
    .map(c => `       ${c.sqlExpr.padEnd(36)} AS "${c.label}"`).join(",\n");
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
--  AND sc.contact_date = CURRENT_DATE
--  AND sc.contact_date = CURRENT_DATE-1
  ;`;
}

function buildSQL(typeId: string, campaignId: string, date: string, enabled: Set<string>, qIds: string[]): string {
  if (typeId === "daily_raw")      return buildDailyRawSQL(campaignId, date, enabled, qIds);
  if (typeId === "live_obs")       return buildLiveObsSQL(campaignId, date, enabled, qIds);
  if (typeId === "call_checkback") return buildCallCheckbackSQL(campaignId, date, enabled, qIds);
  return "";
}

// ══════════════════════════════════════════════════════
//  STEP INDICATOR
// ══════════════════════════════════════════════════════
const STEP_LABELS = ["Data Source", "Map & Configure", "Output Columns", "SQL Output"];

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
  // ── state ──
  const [step, setStep] = useState(1);

  // Step 1 — Data source
  const [mode, setMode] = useState<"manual" | "excel">("manual");
  const [manualCampaignId, setManualCampaignId] = useState("");
  const [manualAlias, setManualAlias] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [fileRows, setFileRows] = useState<string[][]>([]);
  const [fileError, setFileError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Excel mode — manual override inputs (shown after upload)
  const [excelManualId, setExcelManualId] = useState("");
  const [excelManualAlias, setExcelManualAlias] = useState("");

  // Step 2 — Mapping & Config
  const [campaignIdCol, setCampaignIdCol] = useState<string>("");
  const [aliasCol, setAliasCol] = useState<string>("");
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);
  const [reportTypeId, setReportTypeId] = useState("daily_raw");
  const [questionIds, setQuestionIds] = useState("");

  // Step 3 — Output column selector
  const [enabledKeys, setEnabledKeys] = useState<Set<string>>(new Set());

  // Step 4 — Results
  const [queries, setQueries] = useState<GeneratedQuery[]>([]);
  const [activeQueryIdx, setActiveQueryIdx] = useState(0);
  const [searchSQL, setSearchSQL] = useState("");
  const [copied, setCopied] = useState(false);

  const activeRT = REPORT_TYPES.find(r => r.id === reportTypeId)!;

  // Init defaults when report type changes
  useEffect(() => {
    setEnabledKeys(new Set(activeRT.columns.filter(c => c.defaultOn).map(c => c.key)));
    setQuestionIds(activeRT.defaultQuestions.join(", "));
  }, [reportTypeId]);

  // ── File handling ──
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
      // Auto-detect common column names
      const idGuess = headers.find(h => /campaign[_\s]?id/i.test(h) || h.toLowerCase() === "id") || "";
      const aliasGuess = headers.find(h => /alias|slug|name/i.test(h)) || "";
      setCampaignIdCol(idGuess);
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

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  };

  // ── Column selector helpers ──
  const toggleCol = (key: string) => setEnabledKeys(prev => {
    const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n;
  });
  const selectAll  = () => setEnabledKeys(new Set(activeRT.columns.map(c => c.key)));
  const selectNone = () => setEnabledKeys(new Set());

  // ── Step 1 → 2 validation ──
  // Excel mode: valid if file uploaded OR manual ID provided
  const step1Valid = mode === "manual"
    ? !!manualCampaignId.trim()
    : (!!file && fileHeaders.length > 0) || !!excelManualId.trim();

  // ── Step 2 → 3 validation ──
  // Excel mode: valid if manual ID provided OR campaignIdCol is mapped
  const step2Valid = mode === "manual"
    ? true
    : !!excelManualId.trim() || !!campaignIdCol;

  // ── Generate ──
  const handleGenerate = () => {
    const qIds = questionIds.split(",").map(q => q.trim()).filter(Boolean);
    let generated: GeneratedQuery[] = [];

    if (mode === "manual") {
      generated = [{
        label: manualAlias.trim() || `Campaign ${manualCampaignId}`,
        campaignId: manualCampaignId.trim(),
        sql: buildSQL(reportTypeId, manualCampaignId.trim(), reportDate, enabledKeys, qIds),
      }];
    } else if (excelManualId.trim()) {
      // Excel mode but user provided manual override ID → single query
      generated = [{
        label: excelManualAlias.trim() || `Campaign ${excelManualId.trim()}`,
        campaignId: excelManualId.trim(),
        sql: buildSQL(reportTypeId, excelManualId.trim(), reportDate, enabledKeys, qIds),
      }];
    } else {
      // Use Excel rows with column mapping
      const campaignIdIdx = fileHeaders.indexOf(campaignIdCol);
      const aliasIdx = aliasCol ? fileHeaders.indexOf(aliasCol) : -1;

      generated = fileRows
        .map(row => {
          const cId = row[campaignIdIdx]?.trim() ?? "";
          const al  = aliasIdx >= 0 ? (row[aliasIdx]?.trim() ?? "") : "";
          if (!cId) return null;
          return {
            label: al || `Campaign ${cId}`,
            campaignId: cId,
            sql: buildSQL(reportTypeId, cId, reportDate, enabledKeys, qIds),
          };
        })
        .filter(Boolean) as GeneratedQuery[];
    }

    setQueries(generated);
    setActiveQueryIdx(0);

    addHistoryEntry({
      fileName: file?.name ?? `Manual Campaign ${manualCampaignId}`,
      rowCount: generated.length,
      templateName: activeRT.label,
      queriesCount: generated.length,
    });

    confetti({ particleCount: 90, spread: 65, origin: { y: 0.8 }, colors: ["#8b5cf6","#6366f1","#3b82f6"] });
    setStep(4);
  };

  // ── Output helpers ──
  const activeQuery = queries[activeQueryIdx];
  const displaySQL  = searchSQL
    ? activeQuery?.sql.split("\n").filter(l => l.toLowerCase().includes(searchSQL.toLowerCase())).join("\n")
    : activeQuery?.sql ?? "";

  const copyActive = () => {
    navigator.clipboard.writeText(activeQuery?.sql ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };
  const copyAll = () => {
    navigator.clipboard.writeText(queries.map(q => `-- ${q.label}\n${q.sql}`).join("\n\n\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };
  const downloadAll = () => {
    const blob = new Blob([queries.map(q => `-- ${q.label}\n${q.sql}`).join("\n\n\n")], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${reportTypeId}_${reportDate}_all.sql`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const downloadActive = () => {
    const blob = new Blob([activeQuery?.sql ?? ""], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${reportTypeId}_${activeQuery?.campaignId}_${reportDate}.sql`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ══════════════════════════════════════════════════════
  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider uppercase flex items-center gap-2">
            <Database className="w-6 h-6 text-primary" />
            Report Generator
          </h1>
          <p className="text-muted-foreground text-xs mt-1">Upload Excel or enter Campaign ID → map columns → select output → generate ecrm SQL.</p>
        </div>
        <StepBar step={step} />
      </div>

      {/* ══════════ STEP 1: DATA SOURCE ══════════ */}
      {step === 1 && (
        <div className="space-y-5">
          {/* Mode toggle */}
          <div className="glass-card p-1.5 rounded-2xl flex gap-1.5">
            {[
              { id: "manual", icon: Hash, label: "Manual Campaign ID" },
              { id: "excel",  icon: FileSpreadsheet, label: "Upload Excel / CSV" },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setMode(m.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                  mode === m.id
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                }`}
              >
                <m.icon className="w-4 h-4" />
                {m.label}
              </button>
            ))}
          </div>

          {/* Manual mode */}
          {mode === "manual" && (
            <div className="glass-card p-6 rounded-3xl space-y-6">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20 text-primary"><Hash className="w-5 h-5" /></div>
                <div>
                  <p className="text-sm font-bold text-white">Enter Campaign Details</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Campaign ID is required. Alias is optional — used as the query label.</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-muted-foreground tracking-wider uppercase">Campaign ID *</label>
                  <input
                    type="number"
                    value={manualCampaignId}
                    onChange={e => setManualCampaignId(e.target.value)}
                    placeholder="e.g. 189"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-xl font-mono font-bold text-primary focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/30"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-muted-foreground tracking-wider uppercase">
                    Alias / Label <span className="font-normal text-white/30">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={manualAlias}
                    onChange={e => setManualAlias(e.target.value)}
                    placeholder="e.g. PJ Rebel Luckies"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/30"
                  />
                  <p className="text-[10px] text-muted-foreground">Used only as a label/comment in the generated SQL filename.</p>
                </div>
              </div>
            </div>
          )}

          {/* Excel mode */}
          {mode === "excel" && (
            <div className="glass-card p-6 rounded-3xl space-y-5">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20 text-primary"><FileSpreadsheet className="w-5 h-5" /></div>
                <div>
                  <p className="text-sm font-bold text-white">Upload Excel / CSV</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Campaign IDs and aliases will be extracted per row. One SQL query per row.</p>
                </div>
              </div>

              {/* Drop zone */}
              {!file ? (
                <div
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-all ${
                    isDragging
                      ? "border-primary bg-primary/5 scale-[1.01]"
                      : "border-white/10 hover:border-primary/40 hover:bg-white/3"
                  }`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${isDragging ? "bg-primary/15 border-primary/30 text-primary" : "bg-white/5 border-white/10 text-muted-foreground"}`}>
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-white">Drop your file here, or click to browse</p>
                    <p className="text-xs text-muted-foreground mt-1">Supports .xlsx, .xls, .csv files</p>
                  </div>
                  <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onFileChange} />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* File badge */}
                  <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                    <FileText className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{file.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {fileRows.length} data rows · {fileHeaders.length} columns detected
                      </p>
                    </div>
                    <button
                      onClick={() => { setFile(null); setFileHeaders([]); setFileRows([]); setCampaignIdCol(""); setAliasCol(""); setExcelManualId(""); setExcelManualAlias(""); }}
                      className="text-muted-foreground hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Preview table */}
                  {fileHeaders.length > 0 && (
                    <div className="rounded-xl border border-white/5 overflow-hidden">
                      <div className="bg-white/5 px-4 py-2 text-[10px] font-bold text-muted-foreground tracking-wider uppercase">
                        File Preview (first 3 rows)
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-[11px] text-white/80">
                          <thead>
                            <tr className="border-b border-white/5">
                              {fileHeaders.map((h, i) => (
                                <th key={i} className="px-3 py-2 text-left font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {fileRows.slice(0, 3).map((row, ri) => (
                              <tr key={ri} className="border-b border-white/5 last:border-0 hover:bg-white/3">
                                {fileHeaders.map((_, ci) => (
                                  <td key={ci} className="px-3 py-2 whitespace-nowrap font-mono">{row[ci] ?? ""}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* ── Manual override section (shown after file is loaded) ── */}
                  <div className="border border-dashed border-white/10 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <p className="text-xs font-bold text-white">Override with Manual ID</p>
                      <span className="text-[10px] text-muted-foreground ml-1">— enter a Campaign ID directly instead of using Excel rows</span>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
                          <Hash className="w-3 h-3 text-primary" /> Campaign ID
                        </label>
                        <input
                          type="number"
                          value={excelManualId}
                          onChange={e => setExcelManualId(e.target.value)}
                          placeholder="e.g. 186"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-lg font-mono font-bold text-primary focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/30"
                        />
                        <p className="text-[10px] text-muted-foreground">Overrides Excel column mapping — one SQL query generated.</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
                          <Layers className="w-3 h-3 text-primary" /> Alias / Label <span className="font-normal text-white/30 ml-1">(optional)</span>
                        </label>
                        <input
                          type="text"
                          value={excelManualAlias}
                          onChange={e => setExcelManualAlias(e.target.value)}
                          placeholder="e.g. PJ Frost Campaign"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/30"
                        />
                        <p className="text-[10px] text-muted-foreground">Used as label/comment in the SQL output and filename.</p>
                      </div>
                    </div>
                    {excelManualId.trim() && (
                      <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-3 py-2 text-[11px]">
                        <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="text-primary font-semibold">Manual override active</span>
                        <span className="text-muted-foreground">— Campaign <span className="font-mono font-bold text-white">{excelManualId}</span> will be used. Excel rows ignored.</span>
                        <button
                          onClick={() => { setExcelManualId(""); setExcelManualAlias(""); }}
                          className="ml-auto text-muted-foreground hover:text-white transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {parsing && (
                <div className="flex items-center gap-2 text-primary text-xs animate-pulse">
                  <div className="w-3 h-3 rounded-full bg-primary/60 animate-bounce" />
                  Parsing file…
                </div>
              )}
              {fileError && (
                <div className="flex items-center gap-2 text-amber-400 text-xs">
                  <AlertTriangle className="w-4 h-4" />{fileError}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={!step1Valid}
              className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all ${
                step1Valid
                  ? "bg-primary hover:bg-primary/95 text-white hover:scale-[1.02] shadow-lg shadow-primary/20"
                  : "bg-white/5 text-muted-foreground cursor-not-allowed border border-white/5"
              }`}
            >
              Map & Configure <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ══════════ STEP 2: MAP & CONFIGURE ══════════ */}
      {step === 2 && (
        <div className="space-y-5">

          {/* Column mapping — only for Excel mode */}
          {mode === "excel" && (
            <div className="glass-card p-6 rounded-3xl space-y-5">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20 text-primary"><Link2 className="w-5 h-5" /></div>
                <div>
                  <p className="text-sm font-bold text-white">Map Excel Columns</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {excelManualId.trim()
                      ? "Manual override is active — column mapping is skipped."
                      : "Tell the system which column in your file contains the Campaign ID and Alias."}
                  </p>
                </div>
              </div>

              {/* If manual override is set — show confirmation banner, hide dropdowns */}
              {excelManualId.trim() ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-3 bg-primary/10 border border-primary/20 rounded-2xl px-5 py-4">
                    <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-white">Manual Override Active</p>
                      <p className="text-[11px] text-muted-foreground">
                        Campaign ID <span className="font-mono font-bold text-primary text-sm">{excelManualId}</span>
                        {excelManualAlias.trim() && <> · Alias <span className="font-semibold text-white">{excelManualAlias}</span></>}
                        {" "}will be used. A single SQL query will be generated.
                      </p>
                    </div>
                    <button
                      onClick={() => { setExcelManualId(""); setExcelManualAlias(""); }}
                      className="ml-auto text-muted-foreground hover:text-white text-[11px] underline underline-offset-2 shrink-0"
                    >
                      Clear override
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground pl-1">To use Excel row data instead, clear the override and map the column below.</p>
                </div>
              ) : (
                <>

              <div className="grid sm:grid-cols-2 gap-5">
                {/* Campaign ID column */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-primary" /> Campaign ID Column *
                  </label>
                  <select
                    value={campaignIdCol}
                    onChange={e => setCampaignIdCol(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                  >
                    <option value="" className="bg-zinc-950 text-muted-foreground">— Select column —</option>
                    {fileHeaders.map(h => (
                      <option key={h} value={h} className="bg-zinc-950">{h}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-muted-foreground">Used as `campaign_id` in the SQL WHERE clause for each row.</p>
                </div>

                {/* Alias column */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-primary" /> Alias / Label Column <span className="font-normal text-white/30">(optional)</span>
                  </label>
                  <select
                    value={aliasCol}
                    onChange={e => setAliasCol(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                  >
                    <option value="" className="bg-zinc-950 text-muted-foreground">— None —</option>
                    {fileHeaders.map(h => (
                      <option key={h} value={h} className="bg-zinc-950">{h}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-muted-foreground">Used as the label/title for each generated SQL query block.</p>
                </div>
              </div>

              {/* Preview mapped values */}
              {campaignIdCol && (
                <div className="bg-black/30 rounded-xl p-4 space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">Mapped Preview (first 5 rows)</p>
                  <div className="space-y-1.5">
                    {fileRows.slice(0, 5).map((row, i) => {
                      const cId = row[fileHeaders.indexOf(campaignIdCol)] ?? "—";
                      const al  = aliasCol ? (row[fileHeaders.indexOf(aliasCol)] ?? "—") : null;
                      return (
                        <div key={i} className="flex items-center gap-3 text-xs">
                          <span className="text-muted-foreground w-5 shrink-0">{i + 1}.</span>
                          <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">ID: {cId}</span>
                          {al && <span className="text-white/70 bg-white/5 px-2 py-0.5 rounded truncate max-w-xs">{al}</span>}
                        </div>
                      );
                    })}
                    {fileRows.length > 5 && (
                      <p className="text-[10px] text-muted-foreground pl-8">+ {fileRows.length - 5} more rows → {fileRows.length} total SQL queries will be generated</p>
                    )}
                  </div>
                </div>
              )}
              </> )}
            </div>
          )}


          {/* Report Config */}
          <div className="glass-card p-6 rounded-3xl space-y-5">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20 text-primary"><Settings2 className="w-5 h-5" /></div>
              <div>
                <p className="text-sm font-bold text-white">Report Configuration</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Set report type, date, and CROSSTAB question IDs.</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-5">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" /> Report Type
                </label>
                <select
                  value={reportTypeId}
                  onChange={e => setReportTypeId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                >
                  {REPORT_TYPES.map(r => (
                    <option key={r.id} value={r.id} className="bg-zinc-950">{r.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary" /> Report Date
                </label>
                <input
                  type="date"
                  value={reportDate}
                  onChange={e => setReportDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-primary" /> Question IDs (CROSSTAB)
                </label>
                <input
                  type="text"
                  value={questionIds}
                  onChange={e => setQuestionIds(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">Question IDs are auto-populated per report type. Edit to add/remove pivot columns (e.g. <code className="font-mono text-primary/80">1, 2, 3, 57</code>).</p>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-6 py-3.5 rounded-2xl text-sm transition-all">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!step2Valid}
              className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all ${
                step2Valid
                  ? "bg-primary hover:bg-primary/95 text-white hover:scale-[1.02] shadow-lg shadow-primary/20"
                  : "bg-white/5 text-muted-foreground cursor-not-allowed border border-white/5"
              }`}
            >
              Select Output Columns <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ══════════ STEP 3: OUTPUT COLUMNS ══════════ */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="glass-card p-6 rounded-3xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-4 flex-wrap gap-3">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" /> Select Output Columns
                </h2>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Choose which columns appear in the SQL SELECT clause. These mirror the <code className="font-mono text-primary/80">AS "Label"</code> aliases.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={selectAll}  className="text-[11px] font-semibold text-primary hover:underline px-2 py-1">Select All</button>
                <span className="text-white/20">|</span>
                <button onClick={selectNone} className="text-[11px] font-semibold text-muted-foreground hover:text-white px-2 py-1">Select None</button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {activeRT.columns.map(col => {
                const on = enabledKeys.has(col.key);
                return (
                  <button
                    key={col.key}
                    onClick={() => toggleCol(col.key)}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all border group ${
                      on ? "bg-primary/10 border-primary/30 text-white" : "bg-white/5 border-white/5 text-muted-foreground hover:border-white/15 hover:text-white"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-md shrink-0 flex items-center justify-center border transition-all ${
                      on ? "bg-primary border-primary" : "border-white/20 group-hover:border-white/40"
                    }`}>
                      {on && (
                        <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{col.label}</p>
                      <p className="text-[9px] font-mono text-muted-foreground/60 truncate mt-0.5">{col.sqlExpr.slice(0, 38)}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                <span className="font-bold text-white">{enabledKeys.size}</span> of <span className="font-bold text-white">{activeRT.columns.length}</span> columns selected
              </p>
              {enabledKeys.size === 0 && (
                <div className="flex items-center gap-2 text-amber-400 text-xs">
                  <AlertTriangle className="w-4 h-4" /> Select at least one column.
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(2)} className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-6 py-3.5 rounded-2xl text-sm transition-all">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={handleGenerate}
              disabled={enabledKeys.size === 0}
              className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all ${
                enabledKeys.size > 0
                  ? "bg-primary hover:bg-primary/95 text-white hover:scale-[1.02] shadow-lg shadow-primary/20"
                  : "bg-white/5 text-muted-foreground cursor-not-allowed border border-white/5"
              }`}
            >
              <Play className="w-4 h-4 fill-white" /> Generate SQL
            </button>
          </div>
        </div>
      )}

      {/* ══════════ STEP 4: SQL OUTPUT ══════════ */}
      {step === 4 && queries.length > 0 && (
        <div className="space-y-5">
          <div className="glass-card p-6 rounded-3xl space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-white/5 pb-5">
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" /> SQL Generated Successfully
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  {queries.length} {queries.length === 1 ? "query" : "queries"} · {activeRT.label} · Date <span className="text-white font-bold">{reportDate}</span> · <span className="text-white font-bold">{enabledKeys.size}</span> columns
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button onClick={copyActive}
                  className={`inline-flex items-center gap-2 border text-xs font-semibold px-4 py-2.5 rounded-xl transition-all hover:scale-[1.02] ${
                    copied ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-white/5 border-white/10 hover:bg-white/10 text-white"
                  }`}>
                  {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied!" : "Copy This"}
                </button>
                {queries.length > 1 && (
                  <button onClick={copyAll} className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all hover:scale-[1.02]">
                    <Copy className="w-3.5 h-3.5" /> Copy All ({queries.length})
                  </button>
                )}
                <button onClick={downloadActive} className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all hover:scale-[1.02]">
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
                {queries.length > 1 && (
                  <button onClick={downloadAll} className="inline-flex items-center gap-2 bg-primary hover:bg-primary/95 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all hover:scale-[1.02] shadow-md shadow-primary/20">
                    <Download className="w-3.5 h-3.5" /> Download All
                  </button>
                )}
              </div>
            </div>

            {/* Query tabs — if multiple */}
            {queries.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {queries.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveQueryIdx(i)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all border ${
                      activeQueryIdx === i
                        ? "bg-primary/15 border-primary/30 text-primary"
                        : "bg-white/5 border-white/5 text-muted-foreground hover:border-white/15 hover:text-white"
                    }`}
                  >
                    <span className="font-mono text-primary/80 mr-1.5">{q.campaignId}</span>
                    <span className="truncate max-w-[120px] inline-block align-bottom">{q.label !== `Campaign ${q.campaignId}` ? q.label : ""}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Search */}
            <div className="relative max-w-sm">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search within SQL…"
                value={searchSQL}
                onChange={e => setSearchSQL(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>

            {/* Code block */}
            <div className="rounded-2xl border border-white/5 overflow-hidden bg-black/50">
              <div className="bg-white/5 px-4 py-2 flex items-center gap-3 border-b border-white/5">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {reportTypeId}_campaign_{activeQuery?.campaignId}_{reportDate}.sql
                </span>
              </div>
              <pre className="p-5 overflow-x-auto text-[11.5px] font-mono text-zinc-300 leading-relaxed whitespace-pre max-h-[58vh] overflow-y-auto">
                {displaySQL}
              </pre>
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(3)} className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm px-6 py-3.5 rounded-2xl transition-all">
              <ArrowLeft className="w-4 h-4" /> Adjust Columns
            </button>
            <button
              onClick={() => { setFile(null); setFileHeaders([]); setFileRows([]); setManualCampaignId(""); setManualAlias(""); setQueries([]); setStep(1); }}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/95 text-white font-bold text-sm px-6 py-3.5 rounded-2xl transition-all hover:scale-[1.02] shadow-lg shadow-primary/20"
            >
              New Report <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
