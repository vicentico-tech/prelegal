import type { NdaFormData } from "./ndaTypes";

const COVERPAGE_LINK_RE = /<span class="coverpage_link">([^<]+)<\/span>/g;
const MARKDOWN_SPECIAL_CHARS_RE = /[\\`*_{}[\]()#+\-.!|>~]/g;

/**
 * Cover page values are plain text collected from a form, but they get spliced
 * into the Standard Terms markdown before it's parsed. Without escaping, a value
 * containing e.g. a blank line + "#" or stray "*"/"_" would be interpreted as
 * real Markdown structure and corrupt the surrounding legal text.
 */
function escapeForMarkdown(value: string): string {
  return value.replace(/\r\n|\r|\n/g, " ").replace(MARKDOWN_SPECIAL_CHARS_RE, "\\$&");
}

function fieldValue(label: string, data: NdaFormData): string {
  switch (label) {
    case "Purpose":
      return data.purpose;
    case "Effective Date":
      return data.effectiveDate;
    case "MNDA Term":
      return data.mndaTerm;
    case "Term of Confidentiality":
      return data.termOfConfidentiality;
    case "Governing Law":
      return data.governingLaw;
    case "Jurisdiction":
      return data.jurisdiction;
    default:
      return "";
  }
}

/**
 * Replaces each `<span class="coverpage_link">Label</span>` occurrence in the
 * Standard Terms markdown with the matching cover page value, falling back to
 * a bracketed placeholder while the field is still empty.
 */
export function fillTemplate(template: string, data: NdaFormData): string {
  return template.replace(COVERPAGE_LINK_RE, (_match, label: string) => {
    const value = fieldValue(label.trim(), data).trim();
    return value ? escapeForMarkdown(value) : `*[${label.trim()}]*`;
  });
}
