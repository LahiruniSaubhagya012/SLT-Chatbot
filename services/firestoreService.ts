import { Message, IncidentReport } from "../types";

export const saveChatHistory = async (userEmail: string, message: Message) => {
  try {
    const response = await fetch("/api/firestore/chat_history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userEmail,
        role: message.role,
        text: message.text,
        timestamp: message.timestamp,
        ticketId: message.ticketId || "",
      }),
    });
    return await response.json();
  } catch (error) {
    console.error("Error saving chat history:", error);
  }
};

export const saveFeedback = async (userEmail: string, messageId: string, feedbackType: 'positive' | 'negative') => {
  try {
    const response = await fetch("/api/firestore/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userEmail,
        messageId,
        feedbackType,
        timestamp: new Date(),
      }),
    });
    return await response.json();
  } catch (error) {
    console.error("Error saving feedback:", error);
  }
};

export const saveReport = async (report: IncidentReport) => {
  try {
    const response = await fetch("/api/firestore/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...report,
        timestamp: new Date(),
      }),
    });
    return await response.json();
  } catch (error) {
    console.error("Error saving report:", error);
  }
};
