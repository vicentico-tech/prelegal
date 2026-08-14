export interface PartyInfo {
  legalName: string;
  address: string;
  signatoryName: string;
  signatoryTitle: string;
  signatureDate: string;
}

export interface NdaFormData {
  partyA: PartyInfo;
  partyB: PartyInfo;
  effectiveDate: string;
  purpose: string;
  mndaTerm: string;
  termOfConfidentiality: string;
  governingLaw: string;
  jurisdiction: string;
}

export function emptyParty(): PartyInfo {
  return {
    legalName: "",
    address: "",
    signatoryName: "",
    signatoryTitle: "",
    signatureDate: "",
  };
}

export function emptyNdaFormData(): NdaFormData {
  return {
    partyA: emptyParty(),
    partyB: emptyParty(),
    effectiveDate: "",
    purpose: "",
    mndaTerm: "",
    termOfConfidentiality: "",
    governingLaw: "",
    jurisdiction: "",
  };
}

export type PartialPartyInfo = Partial<PartyInfo>;

export interface PartialNdaFormData extends Partial<Omit<NdaFormData, "partyA" | "partyB">> {
  partyA?: PartialPartyInfo | null;
  partyB?: PartialPartyInfo | null;
}

function mergeParty(current: PartyInfo, incoming: PartialPartyInfo | null | undefined): PartyInfo {
  if (!incoming) return current;
  const merged = { ...current };
  for (const key of Object.keys(incoming) as (keyof PartyInfo)[]) {
    const value = incoming[key];
    if (value !== undefined && value !== null && value.trim() !== "") {
      merged[key] = value;
    }
  }
  return merged;
}

/**
 * Merges an AI-extracted partial update into the current form data. A field only
 * overwrites the existing value when it's a non-empty string - the model returns
 * null/omitted for anything not mentioned this turn, and free-tier models aren't
 * always reliable about that, so blank strings are treated the same as "no update".
 */
export function mergeNdaFormData(current: NdaFormData, incoming: PartialNdaFormData): NdaFormData {
  const merged = { ...current };
  for (const key of Object.keys(incoming) as (keyof PartialNdaFormData)[]) {
    if (key === "partyA" || key === "partyB") continue;
    const value = incoming[key];
    if (value !== undefined && value !== null && value.trim() !== "") {
      merged[key] = value;
    }
  }
  merged.partyA = mergeParty(current.partyA, incoming.partyA);
  merged.partyB = mergeParty(current.partyB, incoming.partyB);
  return merged;
}
