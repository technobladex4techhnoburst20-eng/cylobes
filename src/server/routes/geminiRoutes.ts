import { Router, Request, Response } from "express";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

export const geminiRouter = Router();

function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set in the server environment. Please configure your API key in Settings > Secrets."
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

interface ChatHistoryMessage {
  role: "user" | "model" | "assistant";
  text: string;
}

// Multi-turn Chat endpoint with role system instruction and tool grounding
geminiRouter.post("/chat", async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const {
      message,
      history = [] as ChatHistoryMessage[],
      role = "senior", // "senior" | "reunion" | "career" | "poet"
      model = "gemini-3.5-flash", // "gemini-3.1-pro-preview" | "gemini-3.5-flash" | "gemini-3.1-flash-lite"
      useSearch = false,
      useMaps = false,
      userLocation = null, // { latitude, longitude } optional for maps
    } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      res.status(400).json({ error: "Message is required." });
      return;
    }

    const ai = getGenAI();

    // Map roles to tailored campus system instructions
    const roleInstructions: Record<string, string> = {
      senior:
        "You are the wise, nostalgic, and enthusiastic Campus Senior Mentor for the graduating batch of 2025. You provide thoughtful, warm advice about college memories, transitions to life after university, staying in touch with friends, exam folklore, and timeless wisdom. You speak with a gentle Ghibli-esque appreciation for fleeting moments, sunsets on campus, and lifelong bonds.",
      reunion:
        "You are the Campus Reunion & Event Coordinator. Your goal is to help alumni and graduating seniors plan meetups, farewell banquets, road trips, cafe gatherings, and commemorative activities. Use maps and place recommendations to suggest real, scenic, and memorable meetup locations.",
      career:
        "You are the Batch Career & Industry Scout. You assist seniors transitioning into internships, tech startups, corporate roles, research, or higher education. Use live search grounding to give accurate, up-to-date 2026 industry hiring trends, technical skill insights, and interview strategies.",
      poet:
        "You are the College Yearbook Poet & Storyteller. You write heartfelt, poetic tributes, nostalgic farewell messages, humorous yearbook roasts, and commemorative verses inspired by Studio Ghibli aesthetics (warm winds, train rides, library lamps, and enduring youth).",
    };

    const systemInstruction =
      roleInstructions[role] || roleInstructions.senior;

    // Build multi-turn content history
    const contents: any[] = [];
    if (Array.isArray(history) && history.length > 0) {
      for (const item of history) {
        if (!item.text) continue;
        contents.push({
          role: item.role === "user" ? "user" : "model",
          parts: [{ text: item.text }],
        });
      }
    }
    // Append the new user turn
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    // Determine model to use
    // Model selection rule:
    // gemini-3.1-pro-preview for particularly complex tasks
    // gemini-3.5-flash for general tasks (and tools like googleSearch, googleMaps)
    // gemini-3.1-flash-lite for tasks that should happen fast
    let selectedModel = model;
    if (useSearch || useMaps) {
      // Grounding tools perform with gemini-3.5-flash
      selectedModel = "gemini-3.5-flash";
    }

    const config: any = {
      systemInstruction,
    };

    // Configure tools if requested
    const tools: any[] = [];
    if (useSearch) {
      tools.push({ googleSearch: {} });
    }
    if (useMaps) {
      tools.push({ googleMaps: {} });
    }
    if (tools.length > 0) {
      config.tools = tools;
    }

    // Configure thinking mode if 3.1 Pro Preview is selected
    if (
      selectedModel === "gemini-3.1-pro-preview" &&
      !useSearch &&
      !useMaps
    ) {
      config.thinkingConfig = {
        thinkingLevel: ThinkingLevel.HIGH,
      };
    }

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents,
      config,
    });

    const durationMs = Date.now() - startTime;

    // Extract text & thoughts
    let text = response.text || "";
    let thoughts = "";

    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      const thoughtParts: string[] = [];
      const textParts: string[] = [];
      for (const part of candidate.content.parts) {
        if ((part as any).thought) {
          thoughtParts.push(part.text || "");
        } else if (part.text) {
          textParts.push(part.text);
        }
      }
      if (thoughtParts.length > 0) {
        thoughts = thoughtParts.join("\n\n");
      }
      if (textParts.length > 0) {
        text = textParts.join("\n\n");
      }
    }

    // Extract Grounding Metadata (Search & Maps)
    const groundingMetadata = candidate?.groundingMetadata;
    const searchQueries = groundingMetadata?.webSearchQueries || [];
    const searchChunks = groundingMetadata?.groundingChunks || [];
    const searchEntryPoint = groundingMetadata?.searchEntryPoint?.renderedContent || null;

    res.json({
      success: true,
      text,
      thoughts,
      model: selectedModel,
      role,
      durationMs,
      grounding: {
        usedSearch: Boolean(useSearch),
        usedMaps: Boolean(useMaps),
        searchQueries,
        groundingChunks: searchChunks,
        searchEntryPoint,
      },
      usageMetadata: response.usageMetadata,
    });
  } catch (error: any) {
    console.error("Gemini Chat Error:", error);
    const durationMs = Date.now() - startTime;
    res.status(500).json({
      success: false,
      error: error.message || "Failed to process chat with Gemini",
      durationMs,
    });
  }
});

// Dedicated Google Search Grounding endpoint
geminiRouter.post("/search-grounding", async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const { prompt, context } = req.body;
    if (!prompt) {
      res.status(400).json({ error: "Prompt is required." });
      return;
    }

    const ai = getGenAI();
    const systemInstruction =
      "You are the Campus Live Information Scout. Answer the query using real-time Google Search data, providing citations and concise factual summaries.";

    const contentText = context
      ? `Context: ${context}\n\nQuery: ${prompt}`
      : prompt;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contentText,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
      },
    });

    const durationMs = Date.now() - startTime;
    const candidate = response.candidates?.[0];

    res.json({
      success: true,
      text: response.text || "",
      model: "gemini-3.5-flash",
      durationMs,
      grounding: {
        searchQueries: candidate?.groundingMetadata?.webSearchQueries || [],
        chunks: candidate?.groundingMetadata?.groundingChunks || [],
        searchEntryPoint:
          candidate?.groundingMetadata?.searchEntryPoint?.renderedContent || null,
      },
    });
  } catch (error: any) {
    console.error("Search Grounding Error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Search grounding failed",
    });
  }
});

// Dedicated Google Maps Grounding endpoint
geminiRouter.post("/maps-grounding", async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const { prompt, locationHint } = req.body;
    if (!prompt) {
      res.status(400).json({ error: "Location prompt is required." });
      return;
    }

    const ai = getGenAI();
    const systemInstruction =
      "You are the Campus Local Places & Reunion Guide. Recommend real venues, cafes, parks, and farewell dinner spots with addresses and vivid ambiance descriptions using Google Maps data.";

    const fullPrompt = locationHint
      ? `Location near: ${locationHint}\nRequest: ${prompt}`
      : prompt;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: fullPrompt,
      config: {
        systemInstruction,
        tools: [{ googleMaps: {} }],
      },
    });

    const durationMs = Date.now() - startTime;
    const candidate = response.candidates?.[0];

    res.json({
      success: true,
      text: response.text || "",
      model: "gemini-3.5-flash",
      durationMs,
      grounding: {
        chunks: candidate?.groundingMetadata?.groundingChunks || [],
      },
    });
  } catch (error: any) {
    console.error("Maps Grounding Error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Maps grounding failed",
    });
  }
});
