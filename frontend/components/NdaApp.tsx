"use client";

import { useState } from "react";
import NdaChat from "./NdaChat";
import NdaDocument from "./NdaDocument";
import { emptyNdaFormData } from "@/lib/ndaTypes";
import styles from "./NdaApp.module.css";

export default function NdaApp({ templateSource }: { templateSource: string }) {
  const [data, setData] = useState(emptyNdaFormData());

  return (
    <div className={styles.layout}>
      <div className={`${styles.pane} ${styles.chatPane}`}>
        <h2 className={styles.paneHeading}>Chat with the assistant</h2>
        <NdaChat fields={data} onFieldsChange={setData} />
      </div>

      <div className={`${styles.pane} ${styles.documentPane}`}>
        <div className={styles.documentToolbar}>
          <button type="button" className={styles.downloadButton} onClick={() => window.print()}>
            Download PDF
          </button>
        </div>
        <div className={styles.documentScroll}>
          <NdaDocument data={data} templateSource={templateSource} />
        </div>
      </div>
    </div>
  );
}
