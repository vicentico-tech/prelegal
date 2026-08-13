import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { fillTemplate } from "@/lib/fillTemplate";
import type { NdaFormData, PartyInfo } from "@/lib/ndaTypes";
import styles from "./NdaDocument.module.css";

interface NdaDocumentProps {
  data: NdaFormData;
  templateSource: string;
}

export default function NdaDocument({ data, templateSource }: NdaDocumentProps) {
  const filledTerms = fillTemplate(templateSource, data);

  return (
    <article className={styles.document}>
      <h1 className={styles.title}>Mutual Non-Disclosure Agreement</h1>

      <section className={styles.coverPage}>
        <h2>Cover Page</h2>

        <dl className={styles.summary}>
          <SummaryRow label="Purpose" value={data.purpose} />
          <SummaryRow label="Effective Date" value={data.effectiveDate} />
          <SummaryRow label="MNDA Term" value={data.mndaTerm} />
          <SummaryRow label="Term of Confidentiality" value={data.termOfConfidentiality} />
          <SummaryRow label="Governing Law" value={data.governingLaw} />
          <SummaryRow label="Jurisdiction" value={data.jurisdiction} />
        </dl>

        <div className={styles.parties}>
          <PartyBlock label="Party 1" party={data.partyA} />
          <PartyBlock label="Party 2" party={data.partyB} />
        </div>
      </section>

      <section className={styles.terms}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{filledTerms}</ReactMarkdown>
      </section>

      <footer className={styles.footer}>
        <p>
          This document is a filled-in version of the{" "}
          <a href="https://commonpaper.com/standards/mutual-nda/1.0/">
            Common Paper Mutual Non-Disclosure Agreement, Version 1.0
          </a>
          , adapted with user-supplied values and free to use under{" "}
          <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>.
        </p>
      </footer>
    </article>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.summaryRow}>
      <dt>{label}</dt>
      <dd>{withPlaceholder(value, label)}</dd>
    </div>
  );
}

function PartyBlock({ label, party }: { label: string; party: PartyInfo }) {
  return (
    <div className={styles.party}>
      <h3>{label}</h3>
      <p>
        {withPlaceholder(party.legalName, "Legal Name")}
        <br />
        {withPlaceholder(party.address, "Address")}
      </p>
      <div className={styles.signature}>
        <div className={styles.signatureLine}>Signature: {withPlaceholder(party.signatoryName, "Signatory Name")}</div>
        <div className={styles.signatureLine}>Name: {withPlaceholder(party.signatoryName, "Signatory Name")}</div>
        <div className={styles.signatureLine}>Title: {withPlaceholder(party.signatoryTitle, "Signatory Title")}</div>
        <div className={styles.signatureLine}>Date: {withPlaceholder(party.signatureDate, "Date")}</div>
      </div>
    </div>
  );
}

function withPlaceholder(value: string, label: string) {
  return value.trim() ? value : <span className={styles.placeholder}>[{label}]</span>;
}
