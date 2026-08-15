"use client";

import { useState } from "react";
import { ApiError, sendChatMessage, type ChatMessage } from "@/lib/api";
import { mergeNdaFormData, type NdaFormData } from "@/lib/ndaTypes";
import styles from "./NdaChat.module.css";

const INITIAL_ASSISTANT_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I can help you put together a Mutual Non-Disclosure Agreement. " +
    "To start, what's the purpose of the agreement — why are the two parties sharing confidential information?",
};

interface NdaChatProps {
  fields: NdaFormData;
  onFieldsChange: (data: NdaFormData) => void;
}

export default function NdaChat({ fields, onFieldsChange }: NdaChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_ASSISTANT_MESSAGE]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    const nextMessages = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setIsSending(true);

    try {
      const result = await sendChatMessage(nextMessages, fields);
      setMessages([...nextMessages, { role: "assistant", content: result.reply }]);
      onFieldsChange(mergeNdaFormData(fields, result.fields));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className={styles.chat}>
      <div className={styles.messages}>
        {messages.map((message, index) => (
          <div
            key={index}
            className={`${styles.message} ${message.role === "user" ? styles.userMessage : styles.assistantMessage}`}
          >
            {message.content}
          </div>
        ))}
        {isSending && <div className={`${styles.message} ${styles.assistantMessage}`}>Thinking&hellip;</div>}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <form className={styles.inputRow} onSubmit={handleSend}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your answer..."
          disabled={isSending}
        />
        <button type="submit" disabled={isSending || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
