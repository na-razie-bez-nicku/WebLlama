let activeId = "new";
const promptMaxSize = 250;

if (window.location.pathname.startsWith("/c/"))
  activeId = window.location.pathname.substring(3);

const textarea = document.getElementById("chatInput");
const chats = document.getElementById("chats");
const messages = document.getElementById("messages");
const systemInput = document.getElementById("systemInput");

const header = document.getElementById("header");
const modelsMenu = document.getElementById("modelSelect");

function autoResize(el) {
  el.style.height = "auto"; // reset
  el.style.height = Math.min(el.scrollHeight, promptMaxSize) + "px";
}

textarea.addEventListener("input", () => autoResize(textarea));

// let currentChat;
let message;
let buffer = "";

marked.setOptions({
  gfm: true,
  breaks: false,
  highlight(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
});

function render() {
  const html = marked.parse(buffer);

  message.innerHTML = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
  });

  message.querySelectorAll("pre code").forEach((block) => {
    hljs.highlightElement(block);
  });
}

function onToken(t) {
  buffer += t;
  render();
}

function isEmptyOrSpaces(str) {
  return str === null || str.match(/^\s*$/) !== null;
}

textarea.addEventListener("keydown", async (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();

    const prompt = textarea.value;

    textarea.value = "";

    if (!isEmptyOrSpaces(prompt)) {
      buffer = "";
      systemInput.remove();
      messages.classList.remove("flex");

      if (activeId == "new") {
        const model = modelsMenu.value;

        let reqBody;

        if (isEmptyOrSpaces(systemInput.value)) {
          reqBody = JSON.stringify({ model });
        } else {
          reqBody = JSON.stringify({ model, systemprompt: systemInput.value });
        }

        const res = await fetch("/api/v1/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: reqBody,
        });

        const body = await res.json();

        activeId = body.id;

        const div = document.createElement("div");

        div.classList =
          "chat-item p-2 hover:bg-neutral-800 active:bg-neutral-700 rounded-md";

        div.dataset.id = activeId;

        window.history.pushState({}, "", `/c/${activeId}`);

        div.innerText = "New Chat";

        header.children[0].hidden = true;
        header.children[1].hidden = false;

        header.children[1].innerText = model;

        chats.insertBefore(div, chats.firstChild);

        const items = document.querySelectorAll(".chat-item");

        for (const i of items) {
          i.classList.remove("bg-neutral-700", "font-medium");
        }

        // add active
        div.classList.add("bg-neutral-700", "font-medium");

        div.addEventListener("click", async () => {
          const items = document.querySelectorAll(".chat-item");

          // remove active
          for (const i of items) {
            i.classList.remove("bg-neutral-700", "font-medium");
          }

          // add active
          div.classList.add("bg-neutral-700", "font-medium");

          activeId = div.dataset.id;

          messages.innerHTML = "";

          if (activeId === "new") {
            window.history.pushState({}, "", "/");

            header.children[0].hidden = true;
            header.children[1].hidden = false;
            messages.appendChild(systemInput);
            messages.classList.add("flex");
          } else if (activeId === "artifacts") {
            window.history.pushState({}, "", "/artifacts");
            systemInput.remove();
            messages.classList.remove("flex");
          } else {
            messages.classList.remove("flex");
            systemInput.remove();
            const res = await fetch("/api/v1/chat?chatId=" + activeId);

            window.history.pushState({}, "", `/c/${activeId}`);

            const resBody = await res.json();

            const model = resBody.chat.model;
            const context = resBody.chat.messages;

            header.children[0].hidden = true;
            header.children[1].hidden = false;

            header.children[1].innerText = model;

            for (const msg of context) {
              if (msg.role == "user") {
                const div = document.createElement("div");

                div.classList =
                  "bg-neutral-500 w-5/8 ml-auto p-4 my-4 rounded-3xl";
                // message = div;
                // buffer = msg.content;

                // render();

                div.innerText = msg.content;

                messages.appendChild(div);
              } else if (msg.role == "assistant") {
                const div = document.createElement("div");

                div.classList = "my-4";
                message = div;
                buffer = msg.content;

                render();

                messages.appendChild(div);
              }
            }
          }
        });

        console.log(activeId);
      }

      const userDiv = document.createElement("div");

      userDiv.classList = "bg-neutral-500 w-5/8 ml-auto p-4 my-4 rounded-3xl";

      userDiv.innerText = prompt;

      messages.appendChild(userDiv);

      const llmDiv = document.createElement("div");

      llmDiv.classList = "my-4";
      message = llmDiv;

      messages.appendChild(llmDiv);

      const res = await fetch("/api/v1/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chatId: activeId, message: prompt }),
      });

      const reader = res.body.getReader();

      let done = false;

      while (!done) {
        const readed = await reader.read();

        done = readed.done;

        buffer += new TextDecoder().decode(readed.value);

        render();
      }
    }
  }
});

(async () => {
  const modelsRes = await fetch("/api/v1/models");

  const models = await modelsRes.json();

  for (const model of models.models) {
    const option = document.createElement("option");

    option.text = model.name;
    option.value = model.name;

    modelsMenu.appendChild(option);
  }

  const chatsRes = await fetch("/api/v1/chats");

  const chatsInfo = await chatsRes.json();

  const allChats = chatsInfo.chats;

  for (const chat of allChats) {
    const div = document.createElement("div");

    div.classList =
      "chat-item p-2 hover:bg-neutral-800 active:bg-neutral-700 rounded-md";

    div.dataset.id = chat.id;

    div.innerText = chat.title ?? "New Chat";

    chats.appendChild(div);
  }

  const items = document.querySelectorAll(".chat-item");

  for (const item of items) {
    item.addEventListener("click", async () => {
      const items = document.querySelectorAll(".chat-item");

      // remove active
      for (const i of items) {
        i.classList.remove("bg-neutral-700", "font-medium");
      }

      // add active
      item.classList.add("bg-neutral-700", "font-medium");

      activeId = item.dataset.id;

      messages.innerHTML = "";

      if (activeId === "new") {
        window.history.pushState({}, "", "/");

        header.children[0].hidden = false;
        header.children[1].hidden = true;
        messages.classList.add("flex");
        messages.appendChild(systemInput);
      } else if (activeId === "artifacts") {
        window.history.pushState({}, "", "/artifacts");
        systemInput.remove();
        messages.classList.remove("flex");
      } else {
        systemInput.remove();
        messages.classList.remove("flex");
        window.history.pushState({}, "", `/c/${activeId}`);

        const res = await fetch("/api/v1/chat?chatId=" + activeId);

        const resBody = await res.json();

        const model = resBody.chat.model;
        const context = resBody.chat.messages;

        header.children[0].hidden = true;
        header.children[1].hidden = false;

        header.children[1].innerText = model;

        for (const msg of context) {
          if (msg.role == "user") {
            const div = document.createElement("div");

            div.classList = "bg-neutral-500 w-5/8 ml-auto p-4 my-4 rounded-3xl";
            // message = div;
            // buffer = msg.content;

            // render();

            div.innerText = msg.content;

            messages.appendChild(div);
          } else if (msg.role == "assistant") {
            const div = document.createElement("div");

            div.classList = "my-4";
            message = div;
            buffer = msg.content;

            render();

            messages.appendChild(div);
          }
        }
      }
    });
  }

  if (activeId == "new") {
    messages.appendChild(systemInput);
    messages.classList.add("flex");
  } else {
    messages.classList.remove("flex");
    systemInput.remove();
  }

  if (activeId != "new" && activeId != "artifacts") {
    const res = await fetch("/api/v1/chat?chatId=" + activeId);

    if (res.status != 404) {
      const resBody = await res.json();

      const model = resBody.chat.model;
      const context = resBody.chat.messages;

      header.children[0].hidden = true;
      header.children[1].hidden = false;

      header.children[1].innerText = model;

      const items = document.querySelectorAll(".chat-item");

      for (const item of items) {
        item.classList.remove("bg-neutral-700", "font-medium");

        if (item.dataset.id == activeId) {
          item.classList.add("bg-neutral-700", "font-medium");
        }
      }

      for (const msg of context) {
        if (msg.role == "user") {
          const div = document.createElement("div");

          div.classList = "bg-neutral-500 w-5/8 ml-auto p-4 my-4 rounded-3xl";
          // message = div;
          // buffer = msg.content;

          // render();

          div.innerText = msg.content;

          messages.appendChild(div);
        } else if (msg.role == "assistant") {
          const div = document.createElement("div");

          div.classList = "my-4";
          message = div;
          buffer = msg.content;

          render();

          messages.appendChild(div);
        }
      }
    } else {
      alert("Error. Chat doesn't exists!");
      window.history.pushState({}, "", "/");
    }
  }
})();
