"use client";

import type { NdaFormData, PartyInfo } from "@/lib/ndaTypes";
import styles from "./NdaForm.module.css";

interface NdaFormProps {
  data: NdaFormData;
  onChange: (data: NdaFormData) => void;
}

type PartyKey = "partyA" | "partyB";

export default function NdaForm({ data, onChange }: NdaFormProps) {
  function updateParty(key: PartyKey, field: keyof PartyInfo, value: string) {
    onChange({ ...data, [key]: { ...data[key], [field]: value } });
  }

  function updateField(field: keyof Omit<NdaFormData, "partyA" | "partyB">, value: string) {
    onChange({ ...data, [field]: value });
  }

  return (
    <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
      <PartyFieldset title="Party 1" partyKey="partyA" party={data.partyA} onChange={updateParty} />
      <PartyFieldset title="Party 2" partyKey="partyB" party={data.partyB} onChange={updateParty} />

      <fieldset className={styles.fieldset}>
        <legend>Agreement Terms</legend>

        <label className={styles.field}>
          Purpose
          <textarea
            rows={2}
            value={data.purpose}
            onChange={(e) => updateField("purpose", e.target.value)}
            placeholder="e.g. evaluating a potential business relationship"
          />
        </label>

        <label className={styles.field}>
          Effective Date
          <input
            type="date"
            value={data.effectiveDate}
            onChange={(e) => updateField("effectiveDate", e.target.value)}
          />
        </label>

        <label className={styles.field}>
          MNDA Term
          <input
            type="text"
            value={data.mndaTerm}
            onChange={(e) => updateField("mndaTerm", e.target.value)}
            placeholder="e.g. 2 years from the Effective Date"
          />
        </label>

        <label className={styles.field}>
          Term of Confidentiality
          <input
            type="text"
            value={data.termOfConfidentiality}
            onChange={(e) => updateField("termOfConfidentiality", e.target.value)}
            placeholder="e.g. 3 years after termination"
          />
        </label>

        <label className={styles.field}>
          Governing Law
          <input
            type="text"
            value={data.governingLaw}
            onChange={(e) => updateField("governingLaw", e.target.value)}
            placeholder="e.g. Delaware"
          />
        </label>

        <label className={styles.field}>
          Jurisdiction
          <input
            type="text"
            value={data.jurisdiction}
            onChange={(e) => updateField("jurisdiction", e.target.value)}
            placeholder="e.g. New Castle County, Delaware"
          />
        </label>
      </fieldset>
    </form>
  );
}

interface PartyFieldsetProps {
  title: string;
  partyKey: PartyKey;
  party: PartyInfo;
  onChange: (key: PartyKey, field: keyof PartyInfo, value: string) => void;
}

function PartyFieldset({ title, partyKey, party, onChange }: PartyFieldsetProps) {
  return (
    <fieldset className={styles.fieldset}>
      <legend>{title}</legend>

      <label className={styles.field}>
        Legal Name
        <input
          type="text"
          value={party.legalName}
          onChange={(e) => onChange(partyKey, "legalName", e.target.value)}
          placeholder="e.g. Acme Inc."
        />
      </label>

      <label className={styles.field}>
        Address
        <textarea
          rows={2}
          value={party.address}
          onChange={(e) => onChange(partyKey, "address", e.target.value)}
          placeholder="Street, city, state, zip"
        />
      </label>

      <label className={styles.field}>
        Signatory Name
        <input
          type="text"
          value={party.signatoryName}
          onChange={(e) => onChange(partyKey, "signatoryName", e.target.value)}
          placeholder="e.g. Jane Doe"
        />
      </label>

      <label className={styles.field}>
        Signatory Title
        <input
          type="text"
          value={party.signatoryTitle}
          onChange={(e) => onChange(partyKey, "signatoryTitle", e.target.value)}
          placeholder="e.g. CEO"
        />
      </label>

      <label className={styles.field}>
        Signature Date
        <input
          type="date"
          value={party.signatureDate}
          onChange={(e) => onChange(partyKey, "signatureDate", e.target.value)}
        />
      </label>
    </fieldset>
  );
}
