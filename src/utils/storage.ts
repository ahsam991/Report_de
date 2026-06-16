/**
 * Local Storage Persistence Layer and Default Data Configs
 */

export interface Template {
  id: string;
  name: string;
  sql: string;
  description: string;
  isDefault?: boolean;
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  fileName: string;
  rowCount: number;
  templateName: string;
  queriesCount: number;
}

export interface Settings {
  defaultDateFormat: string;
  maxPreviewRows: number;
  autoCopyGenerated: boolean;
}

const DEFAULT_TEMPLATES: Template[] = [
  {
    id: "daily_raw",
    name: "Daily Raw Report",
    description: "Generates daily records filtered by campaign ID, campaign slug, and report date.",
    sql: `SELECT\n       c.id                        AS "Contact ID",\n       c.contact_no                AS "Contact Number",\n       c.contact_date              AS "Contact Date",\n       c.campaign_id               AS "Campaign ID",\n       c.user_id                   AS "User ID",\n       c.contact_status            AS "Contact Status",\n       c.product                   AS "Product"\n\nFROM ecrm.contacts c\n\nWHERE c.campaign_id = {{campaign_id}}\n  AND c.contact_date = '{{date}}'\n  AND c.is_deleted = false\n\nORDER BY\n       c.contact_date DESC,\n       c.id;`,
    isDefault: true,
  },
  {
    id: "live_observation",
    name: "Live Observation Report",
    description: "Extracts real-time evaluations for specific agent aliases and campaigns.",
    sql: `SELECT\n       lo.id                       AS "Observation ID",\n       lo.agent_alias              AS "Agent Alias",\n       lo.campaign_id              AS "Campaign ID",\n       lo.observer_name            AS "Observer Name",\n       lo.evaluation_score         AS "Evaluation Score",\n       lo.observation_time         AS "Observation Time"\n\nFROM ecrm.live_observations lo\n\nWHERE lo.campaign_id = {{campaign_id}}\n  AND lo.agent_alias = '{{agent_alias}}'\n  AND lo.observation_date = '{{date}}'\n\nORDER BY\n       lo.observation_time DESC;`,
    isDefault: true,
  },
  {
    id: "call_checkback",
    name: "Call Checkback Report",
    description: "Generates list of call backs scheduled for pending validation checkbacks.",
    sql: `SELECT\n       cc.id                       AS "Checkback ID",\n       cc.campaign_id              AS "Campaign ID",\n       cc.phone_number             AS "Phone Number",\n       cc.agent_alias              AS "Agent Alias",\n       cc.callback_status          AS "Callback Status",\n       cc.scheduled_time           AS "Scheduled Time"\n\nFROM ecrm.call_checkbacks cc\n\nWHERE cc.campaign_id = {{campaign_id}}\n  AND cc.callback_status = 'PENDING'\n  AND cc.report_date = '{{date}}'\n\nORDER BY\n       cc.scheduled_time DESC;`,
    isDefault: true,
  },
];

const DEFAULT_SETTINGS: Settings = {
  defaultDateFormat: "YYYY-MM-DD",
  maxPreviewRows: 100,
  autoCopyGenerated: false,
};

export function getTemplates(): Template[] {
  if (typeof window === "undefined") return DEFAULT_TEMPLATES;
  try {
    const data = localStorage.getItem("reportde_templates");
    if (!data) {
      localStorage.setItem("reportde_templates", JSON.stringify(DEFAULT_TEMPLATES));
      return DEFAULT_TEMPLATES;
    }
    return JSON.parse(data);
  } catch {
    return DEFAULT_TEMPLATES;
  }
}

export function saveTemplates(templates: Template[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("reportde_templates", JSON.stringify(templates));
}

export function getHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem("reportde_history");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addHistoryEntry(entry: Omit<HistoryEntry, "id" | "timestamp">) {
  if (typeof window === "undefined") return;
  const history = getHistory();
  const newEntry: HistoryEntry = {
    ...entry,
    id: Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem("reportde_history", JSON.stringify([newEntry, ...history]));
}

export function clearHistory() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("reportde_history");
}

export function getSavedMappings(): { [key: string]: { [variable: string]: string } } {
  if (typeof window === "undefined") return {};
  try {
    const data = localStorage.getItem("reportde_mappings");
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export function saveMapping(fileName: string, mapping: { [variable: string]: string }) {
  if (typeof window === "undefined") return;
  const mappings = getSavedMappings();
  mappings[fileName] = mapping;
  localStorage.setItem("reportde_mappings", JSON.stringify(mappings));
}

export function getSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const data = localStorage.getItem("reportde_settings");
    if (!data) {
      localStorage.setItem("reportde_settings", JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    return JSON.parse(data);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings) {
  if (typeof window === "undefined") return;
  localStorage.setItem("reportde_settings", JSON.stringify(settings));
}
