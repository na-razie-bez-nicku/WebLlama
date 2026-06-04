# WebLlama

WebLlama is a web client for Ollama.

> [!WARNING]
> WebLlama is in very early development. It doesn't have a database (chats disappear after a backend restart) and most of the planned features are missing.

## Plans

- [x] Chatting with LLMs
- [x] Basic frontend
- [x] Streaming LLM responses
- [x] Markdown in LLM response
- [ ] Saving chats and messages in DB
- [ ] Changing system prompt in frontend
- [ ] Switching models in frontend (currently hardcoded in frontend)
- [ ] Interchat memory
- [ ] Web search for LLMs
- [ ] Executing LLM-generated code directly on the page
- [ ] Model presets (system prompt, temperature, etc.)
- [ ] Plugins (custom tool calls for LLMs and more)
- [ ] Editing sent messages:
  - [ ] Chat branches
- [ ] Regenerating responses
- [ ] Cancel generating response
- [ ] Pin chats
- [ ] Chat folders/projects
- [ ] Exporting user data (chats, presets, etc.)
- [ ] Auto title generation
- [ ] HTML preview
- [ ] Uploading files to chat:
  - [ ] Images
  - [ ] Documents (PDF, etc.)
- [ ] User accounts

## How to run step-by-step
1. Clone this repo:
Run `git clone https://github.com/na-razie-bez-nicku/WebLlama.git` and `cd WebLlama/backend`
2. Install dependecies:
Run `npm install` in backend directory (you must have npm and node.js installed)
3. Build Typescript files:
Run `npm run build` in backend directory
4. Start the server:
Run `npm run run` in backend directory.

> [!NOTE]
> If you want to run the server after shutdown, just type `npm run run`