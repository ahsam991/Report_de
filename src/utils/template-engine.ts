/**
 * SQL Template Engine Utility
 */

/**
 * Extracts all unique placeholder variables from a SQL template string.
 * Example: "SELECT * FROM t WHERE id = '{{campaign_id}}'" -> ["campaign_id"]
 */
export function extractPlaceholders(template: string): string[] {
  if (!template) return [];
  const regex = /\{\{([a-zA-Z0-9_-]+)\}\}/g;
  const placeholders = new Set<string>();
  let match;
  while ((match = regex.exec(template)) !== null) {
    placeholders.add(match[1]);
  }
  return Array.from(placeholders);
}

/**
 * Sanitizes input values to prevent basic SQL syntax issues (like unescaped single quotes).
 */
export function sanitizeSqlValue(val: any): string {
  if (val === undefined || val === null) {
    return "NULL";
  }
  
  if (val instanceof Date) {
    // Format Date as YYYY-MM-DD
    return val.toISOString().split("T")[0];
  }
  
  const strVal = String(val);
  
  // Escape single quotes by doubling them (SQL Standard)
  return strVal.replace(/'/g, "''");
}

/**
 * Replaces placeholders in a SQL template with mapped values.
 */
export function renderQuery(
  template: string,
  rowMap: { [variable: string]: any }
): string {
  if (!template) return "";
  
  let result = template;
  
  Object.entries(rowMap).forEach(([variable, value]) => {
    const placeholder = `{{${variable}}}`;
    const sanitizedValue = sanitizeSqlValue(value);
    
    // Replace all occurrences of this placeholder
    result = result.replaceAll(placeholder, sanitizedValue);
  });
  
  return result;
}
