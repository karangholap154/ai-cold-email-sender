/**
 * Generates industry-standard corporate email address permutations for outreach.
 */

export interface EmailPermutation {
  email: string;
  pattern: string;
  label: string;
  popularity: "Very High" | "High" | "Medium" | "Low";
}

export function cleanDomain(raw: string): string {
  let cleaned = raw.trim().toLowerCase();
  // Strip protocol
  cleaned = cleaned.replace(/^https?:\/\//i, "");
  // Strip path or query
  cleaned = cleaned.split("/")[0].split("?")[0].split("#")[0];
  // Strip @ if user pasted @company.com
  cleaned = cleaned.replace(/^@+/, "");
  return cleaned;
}

export function cleanNamePart(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function generateEmailPermutations(
  firstName: string,
  lastName: string,
  companyDomain: string,
  middleName?: string
): EmailPermutation[] {
  const f = cleanNamePart(firstName);
  const l = cleanNamePart(lastName);
  const m = middleName ? cleanNamePart(middleName) : "";
  const d = cleanDomain(companyDomain);

  if (!d) return [];

  const list: EmailPermutation[] = [];

  if (f && l) {
    // 1. first.last@
    list.push({
      email: `${f}.${l}@${d}`,
      pattern: "{first}.{last}",
      label: "First . Last (Most Common at Tech Enterprises)",
      popularity: "Very High",
    });

    // 2. first@
    list.push({
      email: `${f}@${d}`,
      pattern: "{first}",
      label: "First Name Only (Standard at Startups & Early Teams)",
      popularity: "Very High",
    });

    // 3. flast@
    list.push({
      email: `${f[0]}${l}@${d}`,
      pattern: "{f}{last}",
      label: "First Initial + Last Name (Common at Fortune 500)",
      popularity: "High",
    });

    // 4. firstl@
    list.push({
      email: `${f}${l[0]}@${d}`,
      pattern: "{first}{l}",
      label: "First Name + Last Initial",
      popularity: "High",
    });

    // 5. firstlast@
    list.push({
      email: `${f}${l}@${d}`,
      pattern: "{first}{last}",
      label: "First + Last Name (No separator)",
      popularity: "Medium",
    });

    // 6. f.last@
    list.push({
      email: `${f[0]}.${l}@${d}`,
      pattern: "{f}.{last}",
      label: "Initial . Last",
      popularity: "Medium",
    });

    // 7. first_last@
    list.push({
      email: `${f}_${l}@${d}`,
      pattern: "{first}_{last}",
      label: "First _ Last (Underscore)",
      popularity: "Medium",
    });

    // 8. last.first@
    list.push({
      email: `${l}.${f}@${d}`,
      pattern: "{last}.{first}",
      label: "Last . First (Standard in European/Academic Orgs)",
      popularity: "Medium",
    });

    // 9. last@
    list.push({
      email: `${l}@${d}`,
      pattern: "{last}",
      label: "Last Name Only",
      popularity: "Low",
    });

    // 10. lfirst@
    list.push({
      email: `${l[0]}${f}@${d}`,
      pattern: "{l}{first}",
      label: "Last Initial + First Name",
      popularity: "Low",
    });

    // 11. first-last@
    list.push({
      email: `${f}-${l}@${d}`,
      pattern: "{first}-{last}",
      label: "First - Last (Hyphen)",
      popularity: "Low",
    });
  } else if (f) {
    // Only first name available
    list.push({
      email: `${f}@${d}`,
      pattern: "{first}",
      label: "First Name Only",
      popularity: "Very High",
    });
  } else if (l) {
    // Only last name available
    list.push({
      email: `${l}@${d}`,
      pattern: "{last}",
      label: "Last Name Only",
      popularity: "Medium",
    });
  }

  if (f && m && l) {
    list.push({
      email: `${f}.${m}.${l}@${d}`,
      pattern: "{first}.{m}.{last}",
      label: "First . Middle . Last",
      popularity: "Low",
    });
    list.push({
      email: `${f}${m[0]}${l}@${d}`,
      pattern: "{first}{m}{last}",
      label: "First + Middle Initial + Last",
      popularity: "Low",
    });
  }

  return list;
}
