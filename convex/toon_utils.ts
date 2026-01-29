// TOON Format Utilities
// Token-Oriented Object Notation - saves ~40% tokens vs JSON

/**
 * Convert an object or array to TOON format
 * - Arrays become tabular: [N]{fields}\nrow1\nrow2
 * - Objects use key:value with indentation
 */
export function toToon(data: any, indent: number = 0): string {
    if (data === null || data === undefined) {
        return "null";
    }

    if (Array.isArray(data)) {
        return arrayToToon(data, indent);
    }

    if (typeof data === "object") {
        return objectToToon(data, indent);
    }

    // Primitives
    if (typeof data === "string") {
        // Quote if contains special chars
        if (/[,\n\r\t{}[\]:]/.test(data) || data === "") {
            return `"${data.replace(/"/g, '\\"')}"`;
        }
        return data;
    }

    return String(data);
}

function objectToToon(obj: Record<string, any>, indent: number): string {
    const entries = Object.entries(obj);
    if (entries.length === 0) return "{}";

    const prefix = "  ".repeat(indent);
    const lines = entries.map(([key, value]) => {
        const valueStr = toToon(value, indent + 1);
        // If value is multiline, put on next line with indent
        if (valueStr.includes("\n")) {
            return `${prefix}${key}:\n${valueStr}`;
        }
        return `${prefix}${key}: ${valueStr}`;
    });

    return lines.join("\n");
}

function arrayToToon(arr: any[], indent: number): string {
    if (arr.length === 0) return "[0]";

    // Check if uniform array of objects (tabular)
    if (arr.every(item => typeof item === "object" && item !== null && !Array.isArray(item))) {
        return tabularArrayToToon(arr);
    }

    // Primitive array (inline)
    if (arr.every(item => typeof item !== "object" || item === null)) {
        const values = arr.map(item => toToon(item)).join(",");
        return `[${arr.length}]${values}`;
    }

    // Mixed array (list format)
    const prefix = "  ".repeat(indent);
    const lines = arr.map(item => `${prefix}- ${toToon(item, indent + 1)}`);
    return `[${arr.length}]\n${lines.join("\n")}`;
}

function tabularArrayToToon(arr: Record<string, any>[]): string {
    if (arr.length === 0) return "[0]";

    // Get all unique keys from first object
    const keys = Object.keys(arr[0]);
    const header = `[${arr.length}]{${keys.join(",")}}`;

    const rows = arr.map(obj => {
        return keys.map(key => {
            const value = obj[key];
            if (value === null || value === undefined) return "";
            if (typeof value === "string" && value.includes(",")) {
                return `"${value}"`;
            }
            return String(value);
        }).join(",");
    });

    return `${header}\n${rows.join("\n")}`;
}

/**
 * Parse TOON format back to object/array
 * Note: This is a simplified parser for common cases
 */
export function fromToon(toon: string): any {
    const trimmed = toon.trim();

    // Empty array
    if (trimmed === "[0]") return [];

    // Empty object  
    if (trimmed === "{}") return {};

    // Null
    if (trimmed === "null") return null;

    // Boolean
    if (trimmed === "true") return true;
    if (trimmed === "false") return false;

    // Number
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
        return parseFloat(trimmed);
    }

    // Quoted string
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
        return trimmed.slice(1, -1).replace(/\\"/g, '"');
    }

    // Tabular array: [N]{fields}\nrow1\nrow2
    const tabularMatch = trimmed.match(/^\[(\d+)\]\{([^}]+)\}\n([\s\S]+)$/);
    if (tabularMatch) {
        const count = parseInt(tabularMatch[1]);
        const fields = tabularMatch[2].split(",");
        const rows = tabularMatch[3].split("\n");

        return rows.slice(0, count).map(row => {
            const values = parseCSVRow(row);
            const obj: Record<string, any> = {};
            fields.forEach((field, i) => {
                obj[field] = values[i] ?? null;
            });
            return obj;
        });
    }

    // Inline primitive array: [N]val1,val2,val3
    const inlineArrayMatch = trimmed.match(/^\[(\d+)\](.+)$/);
    if (inlineArrayMatch) {
        const values = inlineArrayMatch[2].split(",");
        return values.map(v => fromToon(v.trim()));
    }

    // Object with key: value pairs
    if (trimmed.includes(":")) {
        const obj: Record<string, any> = {};
        const lines = trimmed.split("\n");
        let currentKey = "";
        let currentValue = "";

        for (const line of lines) {
            const match = line.match(/^(\w+):\s*(.*)$/);
            if (match) {
                if (currentKey) {
                    obj[currentKey] = fromToon(currentValue.trim());
                }
                currentKey = match[1];
                currentValue = match[2];
            } else if (currentKey) {
                currentValue += "\n" + line;
            }
        }

        if (currentKey) {
            obj[currentKey] = fromToon(currentValue.trim());
        }

        return obj;
    }

    // Plain string
    return trimmed;
}

function parseCSVRow(row: string): string[] {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
        const char = row[i];

        if (char === '"' && !inQuotes) {
            inQuotes = true;
        } else if (char === '"' && inQuotes) {
            inQuotes = false;
        } else if (char === "," && !inQuotes) {
            values.push(current);
            current = "";
        } else {
            current += char;
        }
    }

    values.push(current);
    return values;
}

/**
 * Estimate token savings compared to JSON
 */
export function estimateTokenSavings(data: any): { jsonTokens: number; toonTokens: number; saved: number; percentage: number } {
    const jsonStr = JSON.stringify(data);
    const toonStr = toToon(data);

    const jsonTokens = Math.ceil(jsonStr.length / 4);
    const toonTokens = Math.ceil(toonStr.length / 4);
    const saved = jsonTokens - toonTokens;
    const percentage = Math.round((saved / jsonTokens) * 100);

    return { jsonTokens, toonTokens, saved, percentage };
}
