import fastify from "fastify";
import fastifyStatic from "@fastify/static";
import type { ChatReqPost, ChatReqGet, SendReq } from "./types.js";
import { randomUUID } from "node:crypto";
import Ollama from "ollama";
import { prisma } from "./lib/prisma.js";
import { fileURLToPath } from "node:url";
import path from "node:path";

prisma;

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

  // let chat = chats.get(chatId);

  const chat = await prisma.chat.findUnique({
    where: {
      id: chatId,
    },
  });

  if (!chat) {
    return reply.status(404).send({ ok: false, error: "Chat doesn't exists" });
  }

  await prisma.message.create({
    data: { content: message, role: "user", chatId },
  });

  const context = (
    await prisma.message.findMany({
      where: { chatId },
    })
  ).map((v) => {
    return { content: v.content, role: v.role };
  });

  // chat.lastMsg = new Date(Date.now());

  // chat.context.push({ role: "user", content: message });

  reply.raw.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const stream = await Ollama.chat({
    model: chat.model,
    stream: true,
    messages: context,
  });

  let fullResponse = "";

  for await (const chunk of stream) {
    reply.raw.write(chunk.message.content);
    fullResponse += chunk.message.content;
  }

  await prisma.message.create({
    data: { chatId, content: fullResponse, role: "assistant" },
  });

  // chat.context.push({ role: "assistant", content: fullResponse });

  reply.raw.end();
});

app.post("/api/v1/chat", async (req, reply) => {
  console.log("chat");
  const { systemprompt, model } = req.body as ChatReqPost;

  const res = await prisma.chat.create({
    data: {
      model,
      system: systemprompt ?? null,
    },
  });

  // const id = randomUUID();

  // chats.set(id, {
  //   model,
  //   context: systemprompt ? [{ role: "system", content: systemprompt }] : [],
  //   lastMsg: new Date(Date.now()),
  // });

  return reply.status(201).send({ ok: true, id: res.id });
});

app.get("/api/v1/chats", async (req, reply) => {
  const res = await prisma.chat.findMany({});

  return reply.send({
    ok: true,
    chats: res.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()),
  });
});

app.get("/api/v1/chat", async (req, reply) => {
  const { chatId } = req.query as ChatReqGet;

  // const chat = chats.get(chatId);

  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: { messages: true },
  });

  if (!chat) {
    return reply.status(404).send({ ok: false, error: "Chat doesn't exists" });
  }

  return reply.send({ ok: true, chat });
});

app.get("/api/v1/models", async (req, reply) => {
  const models = await Ollama.list();

  return reply.send({ ok: true, models: models.models });
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

app.listen({ port: 3000, host: "0.0.0.0" }, () => {
  console.log(`Listening on port 3000`);
});
