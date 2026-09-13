import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";
import { authRouter } from "./src/server/routes/authRoutes";
import { quotesRouter } from "./src/server/routes/quotesRoutes";
import { messagesRouter } from "./src/server/routes/messagesRoutes";
import { memoriesRouter } from "./src/server/routes/memoriesRoutes";
import { adminRouter } from "./src/server/routes/adminRoutes";
import { mediaRouter } from "./src/server/routes/mediaRoutes";
import { geminiRouter } from "./src/server/routes/geminiRoutes";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// RESTful API routes
app.use("/api/auth", authRouter);
app.use("/api/quotes", quotesRouter);
app.use("/api/messages", messagesRouter);
app.use("/api/memories", memoriesRouter);
app.use("/api/media", mediaRouter);
app.use("/api/admin", adminRouter);
app.use("/api/gemini", geminiRouter);


// Helper to initialize Gemini client lazily
function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in the server environment. Please configure your API key in Settings > Secrets.");
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

// Health check endpoint
app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    model: "gemini-3.1-pro-preview",
    thinkingLevel: "HIGH",
  });
});

// Presets and sample complex queries
app.get("/api/presets", (req: Request, res: Response) => {
  res.json([
    {
      id: "lock-free-queue",
      title: "Concurrent Lock-Free Queue",
      category: "Concurrency & Architecture",
      description: "Analyze and implement a lock-free queue with memory-ordering guarantees and ABA prevention.",
      prompt: "Design and implement a robust lock-free multi-producer multi-consumer (MPMC) queue in TypeScript or Rust. Provide in-depth reasoning about memory ordering (Acquire/Release vs Sequentially Consistent), ABA problem mitigation, and cache-line contention.",
      code: `// Flawed concurrent buffer attempt\nclass NaiveQueue<T> {\n  private head = 0;\n  private tail = 0;\n  private buffer: (T | undefined)[] = new Array(1024);\n\n  push(item: T): boolean {\n    if (this.tail - this.head >= 1024) return false;\n    this.buffer[this.tail % 1024] = item;\n    this.tail++;\n    return true;\n  }\n\n  pop(): T | undefined {\n    if (this.head === this.tail) return undefined;\n    const item = this.buffer[this.head % 1024];\n    this.head++;\n    return item;\n  }\n}`
    },
    {
      id: "distributed-consensus",
      title: "Raft Consensus Log Compaction & Split-Brain",
      category: "Distributed Systems",
      description: "Step-by-step reasoning on handling partition splits, log compaction with snapshotting, and term reconciliation.",
      prompt: "Deeply analyze edge cases in the Raft consensus algorithm: specifically when a network partition isolates 2 nodes from 3 nodes during log replication, followed by an immediate snapshot compaction. Detail the exact state machine transitions, term reconciliations, and proof of linearizability.",
      code: ""
    },
    {
      id: "full-stack-refactor",
      title: "Express + React State Optimization & Memory Leak Audit",
      category: "Full-Stack Performance",
      description: "Identify subtle closures, unhandled connection pool exhaustion, and React re-render cascades.",
      prompt: "Review the following full-stack code for subtle memory leaks, connection pool starvation, and unhandled async backpressure. Provide an architectural refactor with performance metrics.",
      code: `// Backend route with connection leak\napp.post('/api/records', async (req, res) => {\n  const client = await pool.connect();\n  const stream = client.query(new QueryStream('SELECT * FROM large_table'));\n  stream.pipe(res);\n  // Notice: no client.release() on stream error or finish!\n});`
    },
    {
      id: "type-level-parser",
      title: "Type-Level JSON Schema Parser",
      category: "Advanced TypeScript",
      description: "Construct a type-level compiler in TypeScript that transforms a JSON Schema definition into exact TypeScript types.",
      prompt: "Construct an advanced recursive TypeScript type that statically parses a JSON Schema AST definition and derives the exact typed interface without any runtime overhead. Demonstrate handling of nested objects, union types, and required vs optional properties.",
      code: `type JSONSchema = {\n  type: 'object' | 'string' | 'number' | 'array';\n  properties?: Record<string, JSONSchema>;\n  required?: string[];\n  items?: JSONSchema;\n};`
    }
  ]);
});

// Generate content with High Thinking Mode
app.post("/api/generate", async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const {
      prompt,
      code,
      systemInstruction,
      highThinking = true,
      model = "gemini-3.1-pro-preview",
    } = req.body;

    if (!prompt && !code) {
      res.status(400).json({ error: "Prompt or code input is required." });
      return;
    }

    const ai = getGenAI();

    // Combine prompt and code if provided
    let contentText = prompt || "";
    if (code && code.trim()) {
      contentText = `${contentText}\n\n\`\`\`\n${code}\n\`\`\``;
    }

    // Thinking configuration as required:
    // "You MUST add thinking mode to the app where relevant to handle users' most complex queries.
    // You MUST use the gemini-3.1-pro-preview model and set thinkingLevel to ThinkingLevel.HIGH.
    // Do not set maxOutputTokens."
    const config: any = {
      systemInstruction:
        systemInstruction ||
        "You are an exceptional principal engineer, computer scientist, and algorithmic reasoning expert. When solving complex queries or analyzing code, break down the core problems, reason systematically through invariant guarantees, edge cases, algorithmic complexity, and provide clean, production-ready code with clear explanations.",
    };

    if (highThinking && (model === "gemini-3.1-pro-preview" || model.includes("3.1-pro"))) {
      config.thinkingConfig = {
        thinkingLevel: ThinkingLevel.HIGH,
      };
      // Do NOT set maxOutputTokens!
    }

    const response = await ai.models.generateContent({
      model: model || "gemini-3.1-pro-preview",
      contents: contentText,
      config,
    });

    const durationMs = Date.now() - startTime;

    // Extract thoughts and text from response candidates
    let thoughtText = "";
    let mainText = response.text || "";

    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      const thoughts: string[] = [];
      const answers: string[] = [];

      for (const part of candidate.content.parts) {
        // In Gemini 3 with thinking mode, parts with thought: true contain reasoning thoughts
        if ((part as any).thought) {
          thoughts.push(part.text || "");
        } else if (part.text) {
          answers.push(part.text);
        }
      }

      if (thoughts.length > 0) {
        thoughtText = thoughts.join("\n\n");
      }
      if (answers.length > 0) {
        mainText = answers.join("\n\n");
      }
    }

    res.json({
      success: true,
      text: mainText,
      thoughts: thoughtText,
      model: model || "gemini-3.1-pro-preview",
      thinkingLevel: highThinking ? "HIGH" : "DEFAULT",
      durationMs,
      usageMetadata: response.usageMetadata,
    });
  } catch (error: any) {
    console.error("Gemini generation error:", error);
    const durationMs = Date.now() - startTime;
    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate AI response",
      durationMs,
    });
  }
});

// Streaming generation endpoint (Server-Sent Events)
app.post("/api/generate-stream", async (req: Request, res: Response) => {
  const startTime = Date.now();
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const {
      prompt,
      code,
      systemInstruction,
      highThinking = true,
      model = "gemini-3.1-pro-preview",
    } = req.body;

    if (!prompt && !code) {
      sendEvent("error", { message: "Prompt or code input is required." });
      res.end();
      return;
    }

    const ai = getGenAI();

    let contentText = prompt || "";
    if (code && code.trim()) {
      contentText = `${contentText}\n\n\`\`\`\n${code}\n\`\`\``;
    }

    const config: any = {
      systemInstruction:
        systemInstruction ||
        "You are an exceptional principal engineer, computer scientist, and algorithmic reasoning expert. Reason thoroughly through edge cases, complexity, and structural architecture before presenting complete, robust solutions.",
    };

    if (highThinking && (model === "gemini-3.1-pro-preview" || model.includes("3.1-pro"))) {
      config.thinkingConfig = {
        thinkingLevel: ThinkingLevel.HIGH,
      };
      // Do NOT set maxOutputTokens!
    }

    sendEvent("start", {
      model: model || "gemini-3.1-pro-preview",
      thinkingLevel: highThinking ? "HIGH" : "DEFAULT",
    });

    const responseStream = await ai.models.generateContentStream({
      model: model || "gemini-3.1-pro-preview",
      contents: contentText,
      config,
    });

    for await (const chunk of responseStream) {
      const candidate = chunk.candidates?.[0];
      if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
          if ((part as any).thought) {
            sendEvent("thought", { text: part.text });
          } else if (part.text) {
            sendEvent("chunk", { text: part.text });
          }
        }
      } else if (chunk.text) {
        sendEvent("chunk", { text: chunk.text });
      }
    }

    const durationMs = Date.now() - startTime;
    sendEvent("done", { durationMs });
    res.end();
  } catch (error: any) {
    console.error("Streaming error:", error);
    sendEvent("error", { message: error.message || "Streaming failed." });
    res.end();
  }
});

async function startServer() {
  // Vite middleware for dev or static serving for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
