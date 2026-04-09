export interface ParsedEntry {
  lineNumber: number;
  raw: string;
  label: string;
  domain?: string;
  username?: string;
  password: string;
  notes?: string;
  category?: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface UnmatchedLine {
  lineNumber: number;
  raw: string;
  reason: string;
}

export interface ParseResult {
  parsed: ParsedEntry[];
  unmatched: UnmatchedLine[];
  format: 'csv' | 'txt';
}

function isEmail(s: string): boolean {
  return s.includes('@') && s.includes('.') && !s.includes(' ');
}

function isDomain(s: string): boolean {
  return /\.(com|org|net|io|dev|app|es|co|uk|me|info)(\/|$)/i.test(s);
}

function isUrl(s: string): boolean {
  return s.startsWith('http://') || s.startsWith('https://');
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function detectCSVHeaders(headers: string[]): Record<string, string> {
  const headerMap: Record<string, string> = {};
  const normalized = headers.map((h) => h.toLowerCase().trim());

  const mappings: Record<string, string[]> = {
    label: ['name', 'title', 'label', 'entry', 'site', 'service'],
    domain: ['url', 'website', 'login_uri', 'uri', 'link'],
    username: ['username', 'login', 'email', 'user', 'login_username'],
    password: ['password', 'pass', 'pwd', 'secret'],
    notes: ['notes', 'extra', 'note', 'comment', 'comments'],
  };

  for (const [field, variants] of Object.entries(mappings)) {
    for (let i = 0; i < normalized.length; i++) {
      if (variants.some((v) => normalized[i].includes(v))) {
        headerMap[field] = headers[i];
        break;
      }
    }
  }

  return headerMap;
}

function extractHostname(url: string): string {
  try {
    if (isUrl(url)) {
      return new URL(url).hostname;
    }
    if (!url.startsWith('http')) {
      return new URL('https://' + url).hostname;
    }
    return url;
  } catch {
    return url;
  }
}

export function parseImportContent(content: string): ParseResult {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) {
    return { parsed: [], unmatched: [], format: 'txt' };
  }

  const firstLine = lines[0];
  const csvHeaders = firstLine.split(',').map((h) => h.trim().toLowerCase());
  const hasPasswordCol = csvHeaders.some((h) => ['password', 'pass', 'pwd', 'secret'].some((p) => h.includes(p)));

  if (hasPasswordCol || (firstLine.includes(',') && lines.length > 1)) {
    return parseCSV(content);
  }

  return parseTXT(content);
}

function parseCSV(content: string): ParseResult {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) {
    return {
      parsed: [],
      unmatched: [{ lineNumber: 1, raw: lines[0] || '', reason: 'No data rows found' }],
      format: 'csv',
    };
  }

  const headers = parseCSVLine(lines[0]);
  const headerMap = detectCSVHeaders(headers);

  if (!headerMap.password) {
    return {
      parsed: [],
      unmatched: lines.map((raw, i) => ({ lineNumber: i + 1, raw, reason: 'No password column detected' })),
      format: 'csv',
    };
  }

  const passwordIdx = headers.indexOf(headerMap.password);
  const labelIdx = headerMap.label ? headers.indexOf(headerMap.label) : -1;
  const domainIdx = headerMap.domain ? headers.indexOf(headerMap.domain) : -1;
  const usernameIdx = headerMap.username ? headers.indexOf(headerMap.username) : -1;
  const notesIdx = headerMap.notes ? headers.indexOf(headerMap.notes) : -1;

  const parsed: ParsedEntry[] = [];
  const unmatched: UnmatchedLine[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const password = cols[passwordIdx]?.trim();

    if (!password) {
      unmatched.push({ lineNumber: i + 1, raw: lines[i], reason: 'Empty password' });
      continue;
    }

    const domain = domainIdx >= 0 ? extractHostname(cols[domainIdx] || '') : undefined;
    const username = usernameIdx >= 0 ? cols[usernameIdx]?.trim() : undefined;
    const label = labelIdx >= 0 && cols[labelIdx]?.trim() ? cols[labelIdx].trim() : domain || username || 'Imported';

    parsed.push({
      lineNumber: i + 1,
      raw: lines[i],
      label,
      domain: domain || undefined,
      username: username || undefined,
      password,
      notes: notesIdx >= 0 ? cols[notesIdx]?.trim() : undefined,
      confidence: 'high',
    });
  }

  return { parsed, unmatched, format: 'csv' };
}

function parseTXT(content: string): ParseResult {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  const parsed: ParsedEntry[] = [];
  const unmatched: UnmatchedLine[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineNum = i + 1;

    if (!line) continue;

    const colonParts = line.split(':');
    const pipeParts = line.split('|');

    if (colonParts.length >= 2) {
      const result = parseColonFormat(colonParts, line, lineNum);
      if (result) {
        parsed.push(result);
        continue;
      }
    }

    if (pipeParts.length >= 2) {
      const result = parsePipeFormat(pipeParts, line, lineNum);
      if (result) {
        parsed.push(result);
        continue;
      }
    }

    if (line.includes(' ') && !line.includes(':') && !line.includes('|')) {
      const spaceParts = line.split(/\s+/);
      if (spaceParts.length >= 2) {
        const first = spaceParts[0];
        const rest = spaceParts.slice(1).join(' ');

        if (isEmail(first) || isDomain(first)) {
          parsed.push({
            lineNumber: lineNum,
            raw: line,
            label: rest.length < 30 ? rest : 'Imported',
            domain: isDomain(first) ? first : undefined,
            username: isEmail(first) ? first : undefined,
            password: rest,
            confidence: 'medium',
          });
          continue;
        }
      }
    }

    if (i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      if (nextLine && !nextLine.includes(' ') && nextLine.length > 6) {
        parsed.push({
          lineNumber: lineNum,
          raw: line,
          label: line,
          password: nextLine,
          confidence: 'low',
        });
        i++;
        continue;
      }
    }

    unmatched.push({ lineNumber: lineNum, raw: line, reason: 'Unrecognized format' });
  }

  return { parsed, unmatched, format: 'txt' };
}

function parseColonFormat(parts: string[], raw: string, lineNum: number): ParsedEntry | null {
  if (parts.length === 2) {
    const [first, second] = parts;
    if (isEmail(first)) {
      return {
        lineNumber: lineNum,
        raw,
        label: second.length < 30 ? second : 'Imported',
        username: first,
        password: second,
        confidence: 'high',
      };
    }
    if (isDomain(first)) {
      return {
        lineNumber: lineNum,
        raw,
        label: second.length < 30 ? second : 'Imported',
        domain: first,
        password: second,
        confidence: 'high',
      };
    }
    return { lineNumber: lineNum, raw, label: first, password: second, confidence: 'medium' };
  }

  if (parts.length >= 3) {
    const first = parts[0];
    const second = parts[1];
    const rest = parts.slice(2).join(':');

    return {
      lineNumber: lineNum,
      raw,
      label: isDomain(first) || isEmail(first) ? rest : first,
      domain: isDomain(first) ? first : undefined,
      username: isEmail(first) ? first : isDomain(first) ? undefined : second,
      password: isDomain(first) || isEmail(first) ? second : rest,
      confidence: 'high',
    };
  }

  return null;
}

function parsePipeFormat(parts: string[], raw: string, lineNum: number): ParsedEntry | null {
  if (parts.length === 2) {
    const [first, second] = parts.map((p) => p.trim());
    if (isEmail(first)) {
      return {
        lineNumber: lineNum,
        raw,
        label: second.length < 30 ? second : 'Imported',
        username: first,
        password: second,
        confidence: 'high',
      };
    }
    if (isDomain(first)) {
      return {
        lineNumber: lineNum,
        raw,
        label: second.length < 30 ? second : 'Imported',
        domain: first,
        password: second,
        confidence: 'high',
      };
    }
    return { lineNumber: lineNum, raw, label: first, password: second, confidence: 'medium' };
  }

  if (parts.length >= 3) {
    const first = parts[0].trim();
    const second = parts[1].trim();
    const rest = parts.slice(2).join('|').trim();

    return {
      lineNumber: lineNum,
      raw,
      label: isDomain(first) || isEmail(first) ? rest : first,
      domain: isDomain(first) ? first : undefined,
      username: isEmail(first) ? first : isDomain(first) ? undefined : second,
      password: isDomain(first) || isEmail(first) ? second : rest,
      confidence: 'high',
    };
  }

  return null;
}
