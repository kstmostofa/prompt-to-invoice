import { SelectOption } from "@/types/global";

/**
 * ISO 3166-1 alpha-2 codes. Names are derived at render time with
 * Intl.DisplayNames rather than hard-coded, so the list stays a set of codes —
 * the only part that is actually stable — and the label always matches the
 * viewer's locale conventions instead of a stale English string we typed once.
 */
const COUNTRY_CODES = [
  "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR", "AS", "AT", "AU", "AW", "AX", "AZ",
  "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ", "BR", "BS",
  "BT", "BV", "BW", "BY", "BZ", "CA", "CC", "CD", "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN",
  "CO", "CR", "CU", "CV", "CW", "CX", "CY", "CZ", "DE", "DJ", "DK", "DM", "DO", "DZ", "EC", "EE",
  "EG", "EH", "ER", "ES", "ET", "FI", "FJ", "FK", "FM", "FO", "FR", "GA", "GB", "GD", "GE", "GF",
  "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS", "GT", "GU", "GW", "GY", "HK", "HM",
  "HN", "HR", "HT", "HU", "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR", "IS", "IT", "JE", "JM",
  "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN", "KP", "KR", "KW", "KY", "KZ", "LA", "LB", "LC",
  "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY", "MA", "MC", "MD", "ME", "MF", "MG", "MH", "MK",
  "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS", "MT", "MU", "MV", "MW", "MX", "MY", "MZ", "NA",
  "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR", "NU", "NZ", "OM", "PA", "PE", "PF", "PG",
  "PH", "PK", "PL", "PM", "PN", "PR", "PS", "PT", "PW", "PY", "QA", "RE", "RO", "RS", "RU", "RW",
  "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS",
  "ST", "SV", "SX", "SY", "SZ", "TC", "TD", "TF", "TG", "TH", "TJ", "TK", "TL", "TM", "TN", "TO",
  "TR", "TT", "TV", "TW", "TZ", "UA", "UG", "UM", "US", "UY", "UZ", "VA", "VC", "VE", "VG", "VI",
  "VN", "VU", "WF", "WS", "YE", "YT", "ZA", "ZM", "ZW",
] as const;

export interface Country {
  code: string;
  name: string;
}

/**
 * Codes paired with display names, sorted by name.
 *
 * Sorted with localeCompare, not `<`: plain string comparison puts "Åland"
 * after "Zimbabwe" because it sorts on code points, which is exactly the kind
 * of thing nobody notices until a user from Åland does.
 */
/** An ISO code expanded to its display name; the code itself if unknown. */
export function countryName(code: string, locale = "en"): string {
  if (typeof Intl === "undefined" || !("DisplayNames" in Intl)) return code;

  return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
}

export function countries(locale = "en"): Country[] {
  const display =
    typeof Intl !== "undefined" && "DisplayNames" in Intl
      ? new Intl.DisplayNames([locale], { type: "region" })
      : null;

  return COUNTRY_CODES.map((code) => ({
    code,
    name: display?.of(code) ?? code,
  })).sort((a, b) => a.name.localeCompare(b.name, locale));
}

/**
 * Countries as searchable combobox options. The ISO code rides along as a
 * keyword rather than in the label: people type "UAE" or "US" as readily as
 * the full name, but nobody wants to read 249 rows of codes to find theirs.
 */
export function countryOptions(locale = "en"): SelectOption[] {
  return countries(locale).map(({ code, name }) => ({
    value: code,
    label: name,
    keywords: [code],
  }));
}
