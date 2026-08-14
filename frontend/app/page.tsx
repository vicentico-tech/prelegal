import fs from "node:fs";
import path from "node:path";
import NdaApp from "@/components/NdaApp";
import styles from "./page.module.css";

function readNdaTemplate(): string {
  const templatePath = path.join(process.cwd(), "..", "templates", "Mutual-NDA.md");
  try {
    return fs.readFileSync(templatePath, "utf-8");
  } catch (cause) {
    throw new Error(
      `Could not read the Mutual NDA template at ${templatePath}. This app expects to run with its working ` +
        `directory set to frontend/, alongside a sibling templates/ directory at the repo root.`,
      { cause },
    );
  }
}

export default function Home() {
  const templateSource = readNdaTemplate();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Mutual NDA Creator</h1>
        <p>Chat with the assistant to generate a ready-to-sign Mutual Non-Disclosure Agreement.</p>
      </header>
      <NdaApp templateSource={templateSource} />
    </div>
  );
}
