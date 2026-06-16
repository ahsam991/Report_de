"use client";

import { useState, useEffect, useRef } from "react";
import {
  Upload,
  FileText,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Play,
  Copy,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  Database,
  Calendar,
  Hash,
  Eye,
  EyeOff,
  Settings2,
  Sparkles,
} from "lucide-react";
import { getTemplates, addHistoryEntry, getSettings, Template } from "@/utils/storage";
import { parseExcelFile, parseCsvFile } from "@/utils/excel-parser";
import confetti from "canvas-confetti";

// ─────────────────────────────────────────────
//  Column field definitions for each report type
// ─────────────────────────────────────────────
interface ColumnDef {
  key: string;
  label: string;
  sqlExpr: string;
  defaultOn: boolean;
}

const DAILY_RAW_COLUMNS: ColumnDef[] = [
  { key: "contact_id",       label: "Contact ID",           sqlExpr: `q.contact_id`,                                                                    defaultOn: true  },
  { key: "region",           label: "Region",               sqlExpr: `l."region"`,                                                                       defaultOn: true  },
  { key: "area",             label: "Area",                 sqlExpr: `l."area"`,                                                                         defaultOn: true  },
  { key: "territory",        label: "Territory",            sqlExpr: `l."territory"`,                                                                    defaultOn: true  },
  { key: "dist_point",       label: "Distributors Point",   sqlExpr: `l."point"`,                                                                        defaultOn: true  },
  { key: "route",            label: "Routes",               sqlExpr: `l."route"`,                                                                        defaultOn: true  },
  { key: "cluster",          label: "Cluster Name",         sqlExpr: `l."cluster"`,                                                                      defaultOn: true  },
  { key: "outlet",           label: "Outlet Name",          sqlExpr: `l."outlet"`,                                                                       defaultOn: true  },
  { key: "username",         label: "User Name",            sqlExpr: `br.username`,                                                                      defaultOn: true  },
  { key: "full_name",        label: "BR Name",              sqlExpr: `ui.full_name`,                                                                     defaultOn: true  },
  { key: "uid",              label: "BR Code",              sqlExpr: `br.uid`,                                                                           defaultOn: true  },
  { key: "agency",           label: "Agency",               sqlExpr: `CASE WHEN l."region" IN ('Dhaka South','Sylhet') THEN 'Asiatic Trade Marketing Services Limited' WHEN l."region" IN ('Khulna','Barishal','Rajshahi') THEN 'Integrated Marketing Service Ltd.' ELSE 'IMSL' END`, defaultOn: true  },
  { key: "campaign_name",    label: "Campaign Name",        sqlExpr: `cam."name"`,                                                                       defaultOn: true  },
  { key: "contact_date",     label: "Contact Date",         sqlExpr: `q.contact_date`,                                                                   defaultOn: true  },
  { key: "contact_no",       label: "Consumer Number",      sqlExpr: `q.contact_no`,                                                                     defaultOn: true  },
  { key: "consumer_name",    label: "Consumers Name",       sqlExpr: `COALESCE(q."5")`,                                                                  defaultOn: true  },
  { key: "consumer_age",     label: "Consumer Age",         sqlExpr: `age(q.contact_date, q."4"::date)::VARCHAR`,                                        defaultOn: true  },
  { key: "consumer_addr",    label: "Consumer Address",     sqlExpr: `COALESCE(q."7")`,                                                                  defaultOn: false },
  { key: "occupation",       label: "Consumer Occupation",  sqlExpr: `q."57"`,                                                                           defaultOn: false },
  { key: "primary_brand",    label: "Primary Brand",        sqlExpr: `q.primary_brand`,                                                                  defaultOn: true  },
  { key: "secondary_brand",  label: "Secondary Brand",      sqlExpr: `q.secondary_brand`,                                                                defaultOn: true  },
  { key: "prev_brand",       label: "Previous Brand",       sqlExpr: `pb.sku_name`,                                                                      defaultOn: true  },
  { key: "ptr",              label: "PTR",                  sqlExpr: `CASE WHEN q.ptr IS NULL THEN 'None' ELSE q.ptr END`,                               defaultOn: true  },
  { key: "contact_start",    label: "Contact Start",        sqlExpr: `(q.start_time)::VARCHAR`,                                                          defaultOn: true  },
  { key: "contact_end",      label: "Contact End",          sqlExpr: `(q.end_time)::VARCHAR`,                                                            defaultOn: true  },
  { key: "duration",         label: "Contact Duration",     sqlExpr: `((q.end_time - q.start_time)::TIME)::VARCHAR`,                                     defaultOn: true  },
  { key: "cluster_type",     label: "Cluster Type",         sqlExpr: `NULL::VARCHAR`,                                                                    defaultOn: false },
];

const LIVE_OBS_COLUMNS: ColumnDef[] = [
  { key: "contact_id",       label: "Contact ID",          sqlExpr: `jc.id`,                      defaultOn: true  },
  { key: "region",           label: "Region",              sqlExpr: `re."name"`,                  defaultOn: true  },
  { key: "area",             label: "Area",                sqlExpr: `ar."name"`,                  defaultOn: true  },
  { key: "territory",        label: "Territory",           sqlExpr: `ter."name"`,                 defaultOn: true  },
  { key: "dist_point",       label: "Distributors Point",  sqlExpr: `po."name"`,                  defaultOn: true  },
  { key: "campaign_name",    label: "Campaign Name",       sqlExpr: `cm."name"`,                  defaultOn: true  },
  { key: "sup_id",           label: "Sup ID",              sqlExpr: `sup.username`,               defaultOn: true  },
  { key: "sup_name",         label: "Sup Name",            sqlExpr: `sup_i.full_name`,            defaultOn: true  },
  { key: "br_id",            label: "BR ID",               sqlExpr: `br.username`,                defaultOn: true  },
  { key: "br_name",          label: "BR Name",             sqlExpr: `br_i.full_name`,             defaultOn: true  },
  { key: "contact_date",     label: "Contact Date",        sqlExpr: `jc.contact_date`,            defaultOn: true  },
  { key: "q1",               label: "ra_correct_cluster",  sqlExpr: `q."1"`,                      defaultOn: true  },
  { key: "q2",               label: "ra_correct_attire",   sqlExpr: `q."2"`,                      defaultOn: true  },
  { key: "q3",               label: "shop_owner_permission",sqlExpr: `q."3"`,                     defaultOn: true  },
  { key: "q4",               label: "exists_third_part_app",sqlExpr: `q."4"`,                     defaultOn: false },
  { key: "q5",               label: "correct_consumer_profile",sqlExpr: `q."5"`,                  defaultOn: true  },
  { key: "q6",               label: "telling_about_variant",sqlExpr: `q."6"`,                     defaultOn: true  },
  { key: "q7",               label: "telling_about_luckies",sqlExpr: `q."7"`,                     defaultOn: true  },
  { key: "q8",               label: "showing_av",          sqlExpr: `q."8"`,                      defaultOn: true  },
  { key: "q9",               label: "asking_about_trial",  sqlExpr: `q."9"`,                      defaultOn: true  },
  { key: "q10",              label: "telling_about_ptr",   sqlExpr: `q."10"`,                     defaultOn: true  },
  { key: "q11",              label: "availability",        sqlExpr: `q."11"`,                     defaultOn: true  },
];

const CALL_CHECKBACK_COLUMNS: ColumnDef[] = [
  { key: "contact_id",       label: "Contact ID",           sqlExpr: `sc.id`,                     defaultOn: true  },
  { key: "sup_id",           label: "FFSup ID",             sqlExpr: `sup.username`,              defaultOn: true  },
  { key: "sup_name",         label: "FFSup Name",           sqlExpr: `sup_i.full_name`,           defaultOn: true  },
  { key: "verified_date",    label: "Verified Date",        sqlExpr: `sc.contact_date`,           defaultOn: true  },
  { key: "region",           label: "Region",               sqlExpr: `re.name`,                   defaultOn: true  },
  { key: "area",             label: "Area",                 sqlExpr: `ar.name`,                   defaultOn: true  },
  { key: "dist_house",       label: "Distribution House",   sqlExpr: `co.name`,                   defaultOn: true  },
  { key: "territory",        label: "Territory",            sqlExpr: `ter.name`,                  defaultOn: true  },
  { key: "dist_point",       label: "Distributors Point",   sqlExpr: `po.name`,                   defaultOn: true  },
  { key: "br_id",            label: "BR ID",                sqlExpr: `br.username`,               defaultOn: true  },
  { key: "br_type",          label: "BR Type",              sqlExpr: `_cats.display_label`,       defaultOn: false },
  { key: "br_name",          label: "BR Name",              sqlExpr: `br_i.full_name`,            defaultOn: true  },
  { key: "campaign_name",    label: "Campaign Name",        sqlExpr: `cm.name`,                   defaultOn: true  },
  { key: "q1",               label: "receive_call",         sqlExpr: `q."1"`,                     defaultOn: true  },
  { key: "q2",               label: "continue_conversation",sqlExpr: `q."2"`,                     defaultOn: true  },
  { key: "q3",               label: "correct_consumer_name",sqlExpr: `q."3"`,                     defaultOn: true  },
  { key: "q4",               label: "correct_consumer_age", sqlExpr: `q."4"`,                     defaultOn: true  },
  { key: "q5",               label: "correct_primary_brand",sqlExpr: `q."5"`,                     defaultOn: true  },
  { key: "q6",               label: "contacted_by_ra",      sqlExpr: `q."6"`,                     defaultOn: true  },
  { key: "q7",               label: "telling_about_luckies",sqlExpr: `q."7"`,                     defaultOn: true  },
  { key: "q8",               label: "showing_av",           sqlExpr: `q."8"`,                     defaultOn: true  },
  { key: "q9",               label: "showing_pack",         sqlExpr: `q."9"`,                     defaultOn: false },
  { key: "q10",              label: "asking_about_trial",   sqlExpr: `q."10"`,                    defaultOn: true  },
  { key: "q11",              label: "telling_about_ptr",    sqlExpr: `q."11"`,                    defaultOn: true  },
  { key: "q12",              label: "accepted_ptr_offer",   sqlExpr: `q."12"`,                    defaultOn: false },
];

// ─────────────────────────────────────────────
//  SQL Builders — exact ecrm style
// ─────────────────────────────────────────────
function buildDailyRawSQL(campaignId: string, date: string, enabledKeys: Set<string>, questionIds: string[]): string {
  const qIdList = questionIds.join(",");
  const qValues = questionIds.map(q => `\t\t('${q}')`).join(",\n");
  const qCols = questionIds.map(q => `\t\t\t"${q}" VARCHAR`).join(",\n");

  const selectCols = DAILY_RAW_COLUMNS
    .filter(c => enabledKeys.has(c.key))
    .map(c => `    ${c.sqlExpr.padEnd(52)} AS "${c.label}"`)
    .join(",\n");

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
${selectCols}
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
        10839, 21878, 21879, 28195, 21880, 21881, 21882, 21883,
        24135, 24693, 24698, 24701, 25059, 25060, 25061, 25063,
        25065, 25412, 25456, 25062, 28195, 25064)
    AND q.campaign_id = cam.id
;`;
}

function buildLiveObsSQL(campaignId: string, date: string, enabledKeys: Set<string>, questionIds: string[]): string {
  const qValues = questionIds.map(q => `            ('${q}')`).join(",\n");
  const qCols = questionIds.map(q => `                   "${q}" VARCHAR`).join(",\n");

  const selectCols = LIVE_OBS_COLUMNS
    .filter(c => enabledKeys.has(c.key))
    .map(c => `        ${c.sqlExpr.padEnd(32)} "${c.label}"`)
    .join(",\n");

  const groupByCols = LIVE_OBS_COLUMNS
    .filter(c => enabledKeys.has(c.key))
    .map(c => `        ${c.sqlExpr}`)
    .join(",\n");

  return `--live observation
WITH qu_ans AS
  (SELECT *
   FROM crosstab($$
       select
	       jcsm.joint_call_id,
	       jcsm.question_id,
		   jcsm.answer
       FROM     ecrm.joint_calls jc
       JOIN     ecrm.joint_calls_survey_data_maps jcsm
       ON       jc.id = jcsm.joint_call_id
       WHERE    jc.campaign_id = ${campaignId}
       ORDER BY jcsm.joint_call_id, jcsm.question_id
	$$,
    $$
    values
${qValues}
    $$) AS ct (joint_call_id int,
${qCols}
))
SELECT
${selectCols}
FROM qu_ans q
LEFT JOIN ecrm.joint_calls jc ON q.joint_call_id = jc.id
LEFT JOIN ecrm.locations ou ON jc.location_id = ou.id
LEFT JOIN ecrm.locations cl ON ou.parent = cl.id
LEFT JOIN ecrm.locations ro ON cl.parent = ro.id
LEFT JOIN ecrm.locations po ON ro.parent = po.id
LEFT JOIN ecrm.locations ter ON po.parent = ter.id
LEFT JOIN ecrm.locations ar ON ter.parent = ar.id
LEFT JOIN ecrm.locations re ON ar.parent = re.id
LEFT JOIN ecrm.users br ON jc.ff_id = br.id
LEFT JOIN ecrm.user_infos br_i ON br.id = br_i.user_id
LEFT JOIN ecrm.users sup ON jc.user_id = sup.id
LEFT JOIN ecrm.user_infos sup_i ON sup.id = sup_i.user_id,apsis_data.distributorspoint dp,apsis_data.company co,ecrm.campaigns cm
WHERE
	jc.contact_date = '${date}'
    AND po.source_id = dp.id
    AND dp.dsid = co.id
    AND jc.campaign_id = cm.id
    AND jc.campaign_id = ${campaignId}
GROUP BY
${groupByCols}
;`;
}

function buildCallCheckbackSQL(campaignId: string, date: string, enabledKeys: Set<string>, questionIds: string[]): string {
  const qValues = questionIds.map(q => `            ('${q}')`).join(",\n");
  const qCols = questionIds.map(q => `            "${q}" varchar`).join(",\n");

  const selectCols = CALL_CHECKBACK_COLUMNS
    .filter(c => enabledKeys.has(c.key))
    .map(c => `       ${c.sqlExpr.padEnd(36)} AS "${c.label}"`)
    .join(",\n");

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
${selectCols}

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
    AND sc.contact_date = '${date}'
  ;`;
}

// ─────────────────────────────────────────────
//  Report type config
// ─────────────────────────────────────────────
const REPORT_TYPES = [
  { id: "daily_raw",      label: "Daily Raw Report",       columns: DAILY_RAW_COLUMNS,      defaultQuestions: ["1","2","22","3","4","5","7","57","8","9","10","11","12","13","14","15","16","17"] },
  { id: "live_obs",       label: "Live Observation Report", columns: LIVE_OBS_COLUMNS,       defaultQuestions: ["1","2","3","4","5","6","7","8","9","10","11"] },
  { id: "call_checkback", label: "Call Checkback Report",   columns: CALL_CHECKBACK_COLUMNS, defaultQuestions: ["1","2","20","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","19","21","22"] },
];

// ─────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────
export default function GenerateReport() {
  const [step, setStep] = useState(1);

  // Step 1 state
  const [campaignId, setCampaignId] = useState("");
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);
  const [reportTypeId, setReportTypeId] = useState("daily_raw");

  // Step 2 – column selector state
  const [enabledKeys, setEnabledKeys] = useState<Set<string>>(new Set());
  const [questionIds, setQuestionIds] = useState<string>("");

  // Step 3 – output state
  const [generatedSQL, setGeneratedSQL] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);

  const activeReportType = REPORT_TYPES.find(r => r.id === reportTypeId)!;

  // Init enabled keys from defaults when report type changes
  useEffect(() => {
    const defaults = new Set(activeReportType.columns.filter(c => c.defaultOn).map(c => c.key));
    setEnabledKeys(defaults);
    setQuestionIds(activeReportType.defaultQuestions.join(", "));
  }, [reportTypeId]);

  const toggleColumn = (key: string) => {
    setEnabledKeys(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const selectAll = () => setEnabledKeys(new Set(activeReportType.columns.map(c => c.key)));
  const selectNone = () => setEnabledKeys(new Set());

  const handleGenerate = () => {
    const qIds = questionIds.split(",").map(q => q.trim()).filter(Boolean);
    let sql = "";

    if (reportTypeId === "daily_raw") {
      sql = buildDailyRawSQL(campaignId, reportDate, enabledKeys, qIds);
    } else if (reportTypeId === "live_obs") {
      sql = buildLiveObsSQL(campaignId, reportDate, enabledKeys, qIds);
    } else if (reportTypeId === "call_checkback") {
      sql = buildCallCheckbackSQL(campaignId, reportDate, enabledKeys, qIds);
    }

    setGeneratedSQL(sql);

    addHistoryEntry({
      fileName: `Campaign ${campaignId}`,
      rowCount: enabledKeys.size,
      templateName: activeReportType.label,
      queriesCount: 1,
    });

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 },
      colors: ["#8b5cf6", "#6366f1", "#3b82f6"],
    });

    setStep(3);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedSQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedSQL], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${reportTypeId}_campaign_${campaignId}_${reportDate}.sql`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredSQL = searchQuery
    ? generatedSQL.split("\n").filter(l => l.toLowerCase().includes(searchQuery.toLowerCase())).join("\n")
    : generatedSQL;

  // ─────────────────────────────────────────────
  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider uppercase flex items-center gap-2">
            <Database className="w-6 h-6 text-primary" />
            Report Generator
          </h1>
          <p className="text-muted-foreground text-xs mt-1">
            Enter campaign ID, configure columns, generate production-ready SQL.
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 select-none">
          {["Configure", "Columns", "Output"].map((label, i) => {
            const s = i + 1;
            return (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                  step === s
                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/25"
                    : step > s
                    ? "bg-primary/20 text-primary border-primary/30"
                    : "bg-white/5 text-muted-foreground border-white/5"
                }`}>
                  <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[10px]">{s}</span>
                  {label}
                </div>
                {i < 2 && <div className="w-6 h-px bg-white/10" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── STEP 1: Configure ─── */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="glass-card p-6 md:p-8 rounded-3xl space-y-8">
            <div className="flex items-center gap-3 border-b border-white/5 pb-5">
              <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20 text-primary">
                <Settings2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Report Configuration</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">Set the campaign ID, date, and report type to generate the correct query.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Campaign ID */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-primary" />
                  Campaign ID
                </label>
                <input
                  type="number"
                  value={campaignId}
                  onChange={e => setCampaignId(e.target.value)}
                  placeholder="e.g. 189"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-lg font-mono font-bold text-primary focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/40"
                />
                <p className="text-[10px] text-muted-foreground">Enter the numeric campaign ID manually.</p>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  Report Date
                </label>
                <input
                  type="date"
                  value={reportDate}
                  onChange={e => setReportDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                />
                <p className="text-[10px] text-muted-foreground">Date filter injected into the SQL WHERE clause.</p>
              </div>

              {/* Report Type */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  Report Type
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
                <p className="text-[10px] text-muted-foreground">Determines the SQL structure and table joins used.</p>
              </div>
            </div>

            {/* Question IDs */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <label className="text-xs font-bold text-muted-foreground tracking-wider uppercase">
                Survey Question IDs (CROSSTAB)
              </label>
              <input
                type="text"
                value={questionIds}
                onChange={e => setQuestionIds(e.target.value)}
                placeholder="e.g. 1, 2, 3, 4, 5, 7, 57"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-primary transition-colors"
              />
              <p className="text-[10px] text-muted-foreground">Comma-separated question IDs for the CROSSTAB pivot — auto-populated per report type. Edit as needed.</p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={!campaignId.trim()}
              className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold transition-all ${
                campaignId.trim()
                  ? "bg-primary hover:bg-primary/95 text-white hover:scale-[1.02] shadow-lg shadow-primary/25"
                  : "bg-white/5 text-muted-foreground cursor-not-allowed border border-white/5"
              }`}
            >
              Configure Output Columns
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 2: Column Selector ─── */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-3xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" />
                  Select Output Columns
                </h2>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Choose which columns appear in the generated SQL SELECT clause. Columns are ordered as shown.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={selectAll} className="text-[11px] font-semibold text-primary hover:underline px-2 py-1">Select All</button>
                <span className="text-white/20">|</span>
                <button onClick={selectNone} className="text-[11px] font-semibold text-muted-foreground hover:text-white px-2 py-1">Select None</button>
              </div>
            </div>

            {/* Column grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {activeReportType.columns.map(col => {
                const enabled = enabledKeys.has(col.key);
                return (
                  <button
                    key={col.key}
                    onClick={() => toggleColumn(col.key)}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all border group ${
                      enabled
                        ? "bg-primary/10 border-primary/30 text-white"
                        : "bg-white/5 border-white/5 text-muted-foreground hover:border-white/15 hover:text-white"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-md shrink-0 flex items-center justify-center border transition-all ${
                      enabled
                        ? "bg-primary border-primary"
                        : "border-white/20 group-hover:border-white/40"
                    }`}>
                      {enabled && (
                        <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{col.label}</p>
                      <p className="text-[9px] font-mono text-muted-foreground/70 truncate mt-0.5">{col.sqlExpr.slice(0, 36)}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Summary */}
            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                <span className="font-bold text-white">{enabledKeys.size}</span> of{" "}
                <span className="font-bold text-white">{activeReportType.columns.length}</span> columns selected
              </p>
              {enabledKeys.size === 0 && (
                <div className="flex items-center gap-2 text-amber-400 text-xs">
                  <AlertTriangle className="w-4 h-4" />
                  Select at least one column.
                </div>
              )}
            </div>
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
              disabled={enabledKeys.size === 0}
              className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold transition-all ${
                enabledKeys.size > 0
                  ? "bg-primary hover:bg-primary/95 text-white hover:scale-[1.02] shadow-lg shadow-primary/25"
                  : "bg-white/5 text-muted-foreground cursor-not-allowed border border-white/5"
              }`}
            >
              <Play className="w-4 h-4 fill-white" />
              Generate SQL Query
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 3: SQL Output ─── */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-3xl space-y-5">
            {/* Header row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  SQL Query Generated
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Campaign <span className="font-bold text-primary font-mono">{campaignId}</span> ·{" "}
                  {activeReportType.label} · Date <span className="font-bold text-white">{reportDate}</span> ·{" "}
                  <span className="font-bold text-white">{enabledKeys.size}</span> columns selected
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={handleCopy}
                  className={`inline-flex items-center gap-2 border text-xs font-semibold px-4 py-2.5 rounded-xl transition-all hover:scale-[1.02] ${
                    copied
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      : "bg-white/5 hover:bg-white/10 border-white/10 text-white"
                  }`}
                >
                  {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied!" : "Copy SQL"}
                </button>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 bg-primary hover:bg-primary/95 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all hover:scale-[1.02] shadow-md shadow-primary/20"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download .sql
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search within SQL..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>

            {/* SQL block */}
            <div className="rounded-2xl border border-white/5 overflow-hidden bg-black/50">
              <div className="bg-white/5 px-4 py-2 flex items-center gap-3 border-b border-white/5">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {reportTypeId}_campaign_{campaignId}_{reportDate}.sql
                </span>
              </div>
              <pre className="p-5 overflow-x-auto text-[11.5px] font-mono text-zinc-300 leading-relaxed whitespace-pre max-h-[60vh] overflow-y-auto">
                {filteredSQL || generatedSQL}
              </pre>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-6 py-3.5 rounded-2xl transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Adjust Columns
            </button>
            <button
              onClick={() => {
                setCampaignId("");
                setGeneratedSQL("");
                setSearchQuery("");
                setStep(1);
              }}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/95 text-white font-bold px-6 py-3.5 rounded-2xl transition-all hover:scale-[1.02] shadow-lg shadow-primary/25"
            >
              New Report
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
