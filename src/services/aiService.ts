
export async function testGeminiConnection(apiKey: string): Promise<{ success: boolean; message: string }> {
  if (!apiKey || apiKey.trim() === '') {
    return { success: false, message: 'La clave no puede estar vacia' };
  }
  console.log('Probando Gemini con clave:', apiKey.substring(0, 8) + '...');
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey.trim()}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Responde solo con la palabra: conectado' }] }]
        })
      }
    );
    const data = await response.json();
    console.log('Respuesta de Gemini:', JSON.stringify(data));
    console.log('Evaluando condicion:', !!data.candidates, !!data.candidates?.[0], !!data.candidates?.[0]?.content);
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return { success: true, message: 'Verificada' };
    } else if (data.error) {
      return { success: false, message: data.error.message };
    } else {
      return { success: false, message: JSON.stringify(data) };
    }
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

export async function testClaudeConnection(apiKey: string): Promise<boolean> {
  const model = "claude-opus-4-5-20251101";
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 20,
        messages: [{ role: "user", content: "Di solo la palabra: conectado" }]
      })
    });

    const data = await response.json();
    
    if (response.ok && data.content && data.content[0]) {
      return data.content[0].text.toLowerCase().includes("conectado");
    } else {
      throw new Error(`Error con ${model}: ${data.error?.message || JSON.stringify(data.error || data)}`);
    }
  } catch (error: any) {
    throw new Error(`Fallo de conexión con Claude (${model}): ${error.message}`);
  }
}

export async function callClaude(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const model = "claude-opus-4-5-20251101";
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 120s timeout

  try {
    const body: any = {
      model: model,
      max_tokens: 8192,
      messages: [{ role: "user", content: userPrompt }]
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
      body: JSON.stringify(body),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const data = await response.json();
    
    if (response.ok && data.content && data.content[0]) {
      return data.content[0].text;
    } else {
      throw new Error(`Error con ${model}: ${data.error?.message || JSON.stringify(data.error || data)}`);
    }
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Timeout (120s) con ${model}`);
    }
    throw new Error(`Fallo en la llamada a Claude (${model}): ${error.message}`);
  }
}

export async function callGemini(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const maxRetries = 2;
  let lastError: any;

  for (let i = 0; i <= maxRetries; i++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    try {
      const body: any = {
        contents: [
          {
            parts: [{ text: userPrompt }]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
        },
      };

      if (systemPrompt) {
        body.systemInstruction = {
          parts: [{ text: systemPrompt }]
        };
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey.trim()}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const data = await response.json();
      
      if (response.ok && data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      } else {
        const errorMsg = data.error?.message || JSON.stringify(data.error || data);
        throw new Error(`Error de la API: ${errorMsg}`);
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      lastError = error;
      
      if (error.name === 'AbortError') {
        throw new Error("La llamada a Gemini ha excedido el tiempo de espera (60s).");
      }

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
