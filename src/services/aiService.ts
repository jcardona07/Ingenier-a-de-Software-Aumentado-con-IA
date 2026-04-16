import { GoogleGenAI } from "@google/genai";

export async function testGeminiConnection(apiKey: string): Promise<boolean> {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Hola, responde únicamente con la palabra conectado.",
    });
    const text = response.text || "";
    return text.toLowerCase().includes("conectado");
  } catch (error) {
    console.error("Gemini test failed:", error);
    throw error;
  }
}

export async function testClaudeConnection(apiKey: string): Promise<boolean> {
  try {
    // Usamos Haiku para la prueba de conexión por ser el modelo más básico y disponible
    const body: any = {
      model: "claude-3-haiku-20240307",
      max_tokens: 20,
      messages: [
        { role: "user", content: "Di solo la palabra: conectado" }
      ]
    };

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    
    if (response.ok && data.content && data.content[0]) {
      return data.content[0].text.toLowerCase().includes("conectado");
    } else {
      throw new Error(JSON.stringify(data.error || data));
    }
  } catch (error) {
    console.error("Claude test failed:", error);
    throw error;
  }
}

export async function callClaude(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const body: any = {
    model: "claude-3-haiku-20240307",
    max_tokens: 4096,
    messages: [
      { role: "user", content: userPrompt }
    ]
  };
  
  if (systemPrompt) {
    body.system = systemPrompt;
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify(body)
  });

  const data = await response.json();
  
  if (response.ok && data.content && data.content[0]) {
    return data.content[0].text;
  } else {
    throw new Error(JSON.stringify(data.error || data));
  }
}

export async function callGemini(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const maxRetries = 2;
  let lastError: any;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
        },
      });
      return response.text || "";
    } catch (error: any) {
      lastError = error;
      if (error.message?.includes("429") || error.message?.includes("RESOURCE_EXHAUSTED")) {
        if (i < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
      }
      throw error;
    }
  }
  throw lastError;
}
