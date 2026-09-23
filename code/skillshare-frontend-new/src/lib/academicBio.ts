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

const ACADEMIC_TAG_REGEX = /^\[Academic:\s*([^|\]]*?)\s*\|\s*([^\]]*?)\]\s*\n?/;

export function parseAcademicBio(rawBio?: string | null): AcademicProfile {
  if (!rawBio) {
    return { university: "", major: "", cleanBio: "" };
  }
  const match = rawBio.match(ACADEMIC_TAG_REGEX);
  if (match) {
    return {
      university: match[1].trim(),
      major: match[2].trim(),
      cleanBio: rawBio.slice(match[0].length).trim(),
    };
  }
  return {
    university: "",
    major: "",
    cleanBio: rawBio.trim(),
  };
}

export function formatAcademicBio(cleanBio: string, university?: string, major?: string): string {
  const u = university?.trim() || "";
  const m = major?.trim() || "";
  const b = cleanBio.trim();

  if (!u && !m) {
    return b;
  }
  return `[Academic: ${u} | ${m}]\n${b}`;
}
