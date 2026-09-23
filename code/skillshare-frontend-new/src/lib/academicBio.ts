/**
 * Utilities to embed and extract academic info (University, Faculty/Major)
 * in the existing User.bio text field supported by the backend.
 *
 * This allows all users across devices and sessions to view academic info
 * fetched directly from the backend API without requiring database migrations.
 */

export interface AcademicProfile {
  university: string;
  major: string;
  cleanBio: string;
}

// Matches [Academic: University | Major] anywhere in the bio, case-insensitively, with optional surrounding quotes or whitespace
const ACADEMIC_TAG_REGEX = /\[Academic:\s*([^|\]]*?)\s*\|\s*([^\]]*?)\]/i;

// Natural fallback regexes for bios written like "University: Stanford", "Major: Computer Science", etc.
const NATURAL_UNIV_REGEX = /(?:university|institution|college|school)\s*:\s*([^\n,;|]+)/i;
const NATURAL_MAJOR_REGEX = /(?:faculty|major|department|degree|field of study)\s*:\s*([^\n,;|]+)/i;

export function parseAcademicBio(rawBio?: string | null): AcademicProfile {
  if (!rawBio) {
    return { university: "", major: "", cleanBio: "" };
  }

  // Strip JSON wrapping quotes if present: e.g. "\"[Academic: ... ]\""
  let text = String(rawBio).trim();
  if (text.startsWith('"') && text.endsWith('"') && text.length >= 2) {
    text = text.slice(1, -1).trim();
  }
  // Replace escaped newlines if any
  text = text.replace(/\\n/g, "\n").replace(/\\r/g, "");

  let university = "";
  let major = "";
  let cleanBio = text;

  // 1. Try structured tag [Academic: Univ | Major]
  const match = text.match(ACADEMIC_TAG_REGEX);
  if (match) {
    university = match[1]?.trim() || "";
    major = match[2]?.trim() || "";
    // Remove the tag from cleanBio
    cleanBio = text.replace(match[0], "").trim();
  }

  // 2. Smart fallback if university or major not found yet
  if (!university) {
    const univMatch = text.match(NATURAL_UNIV_REGEX);
    if (univMatch) {
      university = univMatch[1]?.trim() || "";
    }
  }
  if (!major) {
    const majorMatch = text.match(NATURAL_MAJOR_REGEX);
    if (majorMatch) {
      major = majorMatch[1]?.trim() || "";
    }
  }

  return {
    university,
    major,
    cleanBio: cleanBio.trim(),
  };
}

export function formatAcademicBio(cleanBio: string, university?: string, major?: string): string {
  const u = university?.trim() || "";
  const m = major?.trim() || "";
  const b = cleanBio.trim();

  if (!u && !m) {
    return b;
  }
  return b ? `[Academic: ${u} | ${m}]\n${b}` : `[Academic: ${u} | ${m}]`;
}
