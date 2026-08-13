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
