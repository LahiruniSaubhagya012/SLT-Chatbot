
import { GoogleGenAI, Chat, FunctionDeclaration, Type, Part, GenerateContentResponse } from "@google/genai";
import { IncidentReport, KnowledgeSource, WebResource, Message, AgentType } from "../types";

const SYSTEM_INSTRUCTION = `
# PERSONA: MobiCare AI
You are an advanced agentic support assistant exclusively for SLTMOBITEL Sri Lanka.

# PRIMARY OBJECTIVE: VERIFIABLE ACCURACY & SUPPORT
Provide helpful, accurate support. **Whenever you make a factual claim or provide news, you MUST provide references or cite your sources.**

# GROUNDING & CITATION RULES
1. **Search Grounding**: Use Google Search for SLTMobitel news, financial performance, outages, or tech trends.
2. **References**: Always point the user to official sources if available.
3. **Internal Data**: Use the provided knowledge base context for technical specifications.

# STRICT DOMAIN LIMITATION
- **ONLY ANSWER SLTMOBITEL RELATED QUESTIONS**. If a question is unrelated, politely refuse.

# VISUAL CAPABILITIES
- **Visual Diagnostics**: Analyze user-provided photos (bills, router lights) to troubleshoot.
- **Visual Aid**: If the user asks for a visual, describe it clearly or generate a response that helps them visualize the solution.
`;

const AGENT_INSTRUCTIONS: Record<AgentType, string> = {
  main: `You are the Main Routing Agent. Greet the user and identify their needs. 
  If they want a new connection or pricing, switch to 'sales'. 
  If they are an existing customer wanting to change plans or upgrades, switch to 'existing'. 
  If they have technical issues or faults, switch to 'support'.
  Use 'switch_agent' tool to move the user to the correct specialist.`,
  
  sales: `You are the Sales & Growth Agent. Focus on new connections, fiber packages, and mobile plans. 
  Highlight features, speeds, and competitive pricing. 
  If the user is interested in a specific package, use 'suggest_bill_calculator' to help them estimate costs.
  If they are ready to proceed, use 'collect_sales_lead' to gather their contact details.`,
  
  existing: `You are the Customer Success Agent (My Service). Focus on plan upgrades, data add-ons, and Value Added Services (VAS). 
  Help existing users get more from their current connection.
  If they want to change their plan or add a service, use 'request_service_change' to initiate the process.`,
  
  support: `You are the Technical Support Agent. Focus on troubleshooting, diagnostics, and fault reporting. 
  Ask about router lights, connection status, and location. 
  If a fault is confirmed, use 'submitIncidentReport' to lodge a formal report.`
};

const switchAgentTool: FunctionDeclaration = {
  name: "switch_agent",
  description: "Switches the conversation to a specialized agent based on the user's intent.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      targetAgent: { 
        type: Type.STRING, 
        enum: ["main", "sales", "existing", "support"],
        description: "The agent to switch to."
      },
      reason: { type: Type.STRING, description: "The reason for switching." }
    },
    required: ["targetAgent", "reason"]
  }
};

const suggestBillCalculatorTool: FunctionDeclaration = {
  name: "suggest_bill_calculator",
  description: "Suggests the user to use the Bill Calculator tool to estimate their monthly costs.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      reason: { type: Type.STRING, description: "Why the calculator is being suggested." }
    },
    required: ["reason"]
  }
};

const collectSalesLeadTool: FunctionDeclaration = {
  name: "collect_sales_lead",
  description: "Collects contact information for a potential new SLTMobitel customer.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      phone: { type: Type.STRING },
      interestedService: { type: Type.STRING, description: "Fiber, Mobile, etc." },
      location: { type: Type.STRING }
    },
    required: ["name", "phone", "interestedService"]
  }
};

const requestServiceChangeTool: FunctionDeclaration = {
  name: "request_service_change",
  description: "Initiates a request to change or upgrade an existing SLTMobitel service.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      accountNumber: { type: Type.STRING },
      requestedChange: { type: Type.STRING, description: "e.g. Upgrade to Fiber Unlimited 100" },
      contactPhone: { type: Type.STRING }
    },
    required: ["accountNumber", "requestedChange", "contactPhone"]
  }
};

const submitIncidentReportTool: FunctionDeclaration = {
  name: "submitIncidentReport",
  description: "Submits a technical incident report and sends an email summary to the user.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      report: {
        type: Type.OBJECT,
        properties: {
          customerName: { type: Type.STRING },
          email: { type: Type.STRING },
          serviceType: { type: Type.STRING },
          location: { type: Type.STRING },
          issueDescription: { type: Type.STRING }
        },
        required: ["customerName", "email", "serviceType", "location", "issueDescription"]
      }
    },
    required: ["report"]
  }
};

const functions: Record<string, Function> = {
  submitIncidentReport: ({ report }: { report: IncidentReport }) => {
    const ticketId = `SLT-REF-${Math.floor(100000 + Math.random() * 900000)}`;
    return { 
      success: true, 
      ticketId: ticketId,
      emailConfirmed: true,
      summarySentTo: report.email,
      message: `A summary has been sent to ${report.email}. Our team will contact you shortly.`
    };
  },
  suggest_bill_calculator: ({ reason }: { reason: string }) => {
    return { 
      action: "trigger_ui", 
      component: "BillCalculator",
      message: `I've suggested the Bill Calculator because: ${reason}. You can find the button in the header.`
    };
  },
  collect_sales_lead: (args: any) => {
    return { 
      success: true, 
      message: "Your interest has been recorded. A sales representative will contact you within 24 hours.",
      leadId: `LEAD-${Math.floor(1000 + Math.random() * 9000)}`
    };
  },
  request_service_change: (args: any) => {
    return { 
      success: true, 
      message: "Service change request submitted. You will receive an SMS confirmation once processed.",
      requestId: `REQ-${Math.floor(1000 + Math.random() * 9000)}`
    };
  }
};

export const sendMessageToGemini = async (
  message: string | Part[], 
  history: Message[] = [],
  knowledgeSources: KnowledgeSource[] = [], 
  webResources: WebResource[] = [],
  image?: string,
  language: 'si' | 'en' = 'si',
  agent: AgentType = 'main'
): Promise<{ 
  text: string, 
  links?: any[], 
  image?: string, 
  ticketId?: string, 
  switchAgent?: { target: AgentType, reason: string },
  triggerBillCalc?: boolean
}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const dynamicSystemInstruction = `${SYSTEM_INSTRUCTION}
# AGENT CONTEXT
${AGENT_INSTRUCTIONS[agent]}

# LANGUAGE REQUIREMENT
- **SPEAK AND RESPOND ONLY IN ${language === 'si' ? 'SINHALA' : 'ENGLISH'}**.
- If the user speaks a different language, politely ask them to switch or continue in ${language === 'si' ? 'Sinhala' : 'English'}.
`;
  
  const contents: any[] = history.map(m => ({
    role: m.role,
    parts: [
      { text: m.text },
      ...(m.image ? [{ inlineData: { data: m.image.split(',')[1] || m.image, mimeType: 'image/jpeg' } }] : [])
    ]
  }));

  if (contents.length === 0) {
    contents.push({ role: 'user', parts: [{ text: "System Boot: Act as MobiCare AI. Ground all factual answers in search results and provide references." }] });
    contents.push({ role: 'model', parts: [{ text: "MobiCare AI online. I will provide referenced support for all SLTMobitel queries." }] });
  }

  let userParts: Part[] = [];
  let userText = "";
  if (typeof message === 'string') {
    userText = message;
    userParts.push({ text: message });
  } else if (Array.isArray(message)) {
    userText = message.map(p => p.text || "").join(" ");
    userParts = message;
  }

  if (image) {
    userParts.push({
      inlineData: {
        data: image.split(',')[1] || image,
        mimeType: 'image/jpeg' 
      }
    });
  }

  const contextText = `
    Knowledge Base: ${knowledgeSources.map(s => s.name).join(', ')}
    Web Resources: ${webResources.map(r => r.title).join(', ')}
  `;
  userParts.push({ text: `[Context: ${contextText}]` });
  contents.push({ role: 'user', parts: userParts });

  const allTools = [
    submitIncidentReportTool, 
    switchAgentTool, 
    suggestBillCalculatorTool, 
    collectSalesLeadTool, 
    requestServiceChangeTool
  ];

  const tools = [{ googleSearch: {} }, { functionDeclarations: allTools }];

  let capturedTicketId: string | undefined;
  let capturedSwitchAgent: { target: AgentType, reason: string } | undefined;
  let capturedTriggerBillCalc = false;

  try {
    let result = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents,
      config: {
        systemInstruction: dynamicSystemInstruction,
        tools: tools,
      },
    });

    while (result.candidates?.[0]?.content?.parts?.some(p => p.functionCall)) {
      const functionCalls = result.candidates[0].content.parts
        .filter(p => p.functionCall)
        .map(p => p.functionCall!);
      const toolResponses: Part[] = [];

      for (const call of functionCalls) {
        const handler = functions[call.name];
        const res = handler ? handler(call.args) : { error: "Function missing" };
        
        if (call.name === 'submitIncidentReport' && res.ticketId) {
          capturedTicketId = res.ticketId;
        }

        if (call.name === 'switch_agent') {
          capturedSwitchAgent = { 
            target: call.args.targetAgent as AgentType, 
            reason: call.args.reason as string 
          };
        }

        if (call.name === 'suggest_bill_calculator') {
          capturedTriggerBillCalc = true;
        }

        toolResponses.push({
          functionResponse: { name: call.name, response: { result: res }, id: call.id }
        });
      }
      
      contents.push(result.candidates[0].content);
      contents.push({ role: 'user', parts: toolResponses });

        result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: contents,
        config: {
          systemInstruction: dynamicSystemInstruction,
          tools: [{ functionDeclarations: allTools }],
        },
      });
    }

    // Using the direct .text property as recommended by @google/genai guidelines
    const textContent = result.text || "I've analyzed your request.";

    const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const links = groundingChunks
      .filter((c: any) => c.web)
      .map((c: any) => ({
        title: c.web.title || "External Source",
        uri: c.web.uri
      }));

    return { 
      text: textContent, 
      links: links.length > 0 ? links : undefined,
      ticketId: capturedTicketId,
      switchAgent: capturedSwitchAgent,
      triggerBillCalc: capturedTriggerBillCalc
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const analyzeConversationHistory = async (allMessages: Message[]): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const transcript = allMessages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `You are the Lead Support Analyst for SLTMobitel. 
    Analyze the following conversation transcript from the MobiCare AI Support portal. 
    Provide a professional, structured executive report including:
    1. **Summary of Interaction**: What was the primary goal?
    2. **Sentiment Analysis**: Evaluate the user's emotional state and satisfaction.
    3. **Technical Diagnostics**: What issues were identified? (Fiber, Mobile, Billing, etc.)
    4. **Resolution Status**: Was the issue resolved or escalated (Ticket ID generated)?
    5. **Executive Recommendations**: Suggest 3 specific actions for the SLT management team to improve service based on this interaction.
    
    TRANSCRIPT:
    ${transcript}`,
    config: {
      temperature: 0.2,
      thinkingConfig: { thinkingBudget: 2000 }
    }
  });

  // Extracting text directly from GenerateContentResponse as per best practices
  return response.text || "Analysis unavailable.";
};

export const resetSession = () => {};
