import fastify from "fastify";
import fastifyStatic from "@fastify/static";
import type { ChatReqPost, ChatReqGet, SendReq } from "./types.js";
import { randomUUID } from "node:crypto";
import Ollama from "ollama";

import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const chats = new Map<
  string,
  {
    model: string;
    context: {
      content: string;
      role: "user" | "assistant" | "system";
    }[];
    lastMsg: Date;
  }
>();

const app = fastify();

app.register(fastifyStatic, {
  root: __dirname + "/public",
  // prefix: "/public/",
});

app.post("/api/v1/send", async (req, reply) => {
  console.log("send");
  const { chatId, message } = req.body as SendReq;

  console.log(chatId);

  let chat = chats.get(chatId);

  if (chat == undefined) {
    return reply.status(404).send({ ok: false, error: "Chat doesn't exists" });
  }

  chat.lastMsg = new Date(Date.now());

  chat.context.push({ role: "user", content: message });

  reply.raw.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const stream = await Ollama.chat({
    model: chat.model,
    stream: true,
    messages: chat.context,
  });

  let fullResponse = "";

  for await (const chunk of stream) {
    reply.raw.write(chunk.message.content);
    fullResponse += chunk.message.content;
  }

  chat.context.push({ role: "assistant", content: fullResponse });

  reply.raw.end();
});

app.post("/api/v1/chat", (req, reply) => {
  console.log("chat");
  const { systemprompt, model } = req.body as ChatReqPost;

  const id = randomUUID();

  chats.set(id, {
    model,
    context: systemprompt ? [{ role: "system", content: systemprompt }] : [],
    lastMsg: new Date(Date.now()),
  });
  return reply.status(201).send({ ok: true, id });
});

app.get("/api/v1/chats", (req, reply) => {
  return reply.send({
    ok: true,
    chats: [...chats.entries()]
      .sort((a, b) => b[1].lastMsg.getTime() - a[1].lastMsg.getTime())
      .map(([key]) => key),
  });
});

app.get("/api/v1/chat", (req, reply) => {
  const { chatId } = req.query as ChatReqGet;

  const chat = chats.get(chatId);

  if (!chat) {
    return reply.status(404).send({ ok: false, error: "Chat doesn't exists" });
  }

  return reply.send({ ok: true, chat });
});

app.get("/", (req, reply) => {
  return reply.sendFile("index.html");
});

app.get("/c/:id", (req, reply) => {
  return reply.sendFile("index.html");
});

app.get("/artifacts", (req, reply) => {
  return reply.sendFile("index.html");
});

app.get("/artifacts/:id", (req, reply) => {
  return reply.sendFile("index.html");
});

app.listen({ port: 8080 }, () => {
  console.log(`Listening on port 8080`);
});
