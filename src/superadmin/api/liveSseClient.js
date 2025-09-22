// src/superadmin/api/liveSseClient.js  (or keep your existing path)
// Uses fetch + ReadableStream so we can send custom headers.

import axios from "../api/axiosInstance"; // adjust path to your axiosInstance

export class LiveSSEClient {
  constructor({ path, headers, onOpen, onMessage, onError, onClose }) {
    const base = axios.defaults.baseURL || "http://localhost:8080";
    this.url = new URL(path, base).toString();
    this.headers = headers || {};
    this.onOpen = onOpen || (() => {});
    this.onMessage = onMessage || (() => {});
    this.onError = onError || (() => {});
    this.onClose = onClose || (() => {});
    this.controller = null;
    this.decoder = new TextDecoder("utf-8");
    this.buffer = "";
    this.reconnectAttempts = 0;
    this.maxBackoff = 15000;
    this.lastEventId = null;
    this.isClosing = false;
  }

  async connect() {
    this.isClosing = false;
    try {
      this.controller = new AbortController();
      const res = await fetch(this.url, {
        method: "GET",
        mode: "cors",
        headers: {
          Accept: "text/event-stream",
          ...this.headers,
          ...(this.lastEventId ? { "Last-Event-ID": this.lastEventId } : {}),
        },
        signal: this.controller.signal,
      });

      if (!res.ok || !res.body) {
        const err = new Error(`SSE HTTP ${res.status}`);
        this.onError(err);
        this.scheduleReconnect();
        return;
      }

      this.onOpen({ attempts: this.reconnectAttempts });

      const reader = res.body.getReader();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        this.buffer += this.decoder.decode(value, { stream: true });
        this.processBuffer();
      }

      if (!this.isClosing) {
        this.onClose({ reason: "eof" });
        this.scheduleReconnect();
      }
    } catch (err) {
      if (this.isClosing) return;
      this.onError(err);
      this.scheduleReconnect();
    }
  }

  processBuffer() {
    let idx;
    while ((idx = this.buffer.indexOf("\n\n")) !== -1) {
      const raw = this.buffer.slice(0, idx);
      this.buffer = this.buffer.slice(idx + 2);
      this.handleEventBlock(raw);
    }
  }

  handleEventBlock(block) {
    const lines = block.split(/\r?\n/);
    let id = null;
    let event = "message";
    const dataLines = [];

    for (const line of lines) {
      if (!line || line.startsWith(":")) continue;
      const colon = line.indexOf(":");
      const field = colon === -1 ? line : line.slice(0, colon);
      const value = colon === -1 ? "" : line.slice(colon + 1).trimStart();
      if (field === "id") id = value;
      else if (field === "event") event = value;
      else if (field === "data") dataLines.push(value);
    }

    const dataStr = dataLines.join("\n");
    this.lastEventId = id || this.lastEventId;

    let parsed = dataStr;
    try { parsed = JSON.parse(dataStr); } catch {}

    this.onMessage({ id: this.lastEventId, event, data: parsed, raw: dataStr });
  }

  scheduleReconnect() {
    if (this.isClosing) return;
    this.reconnectAttempts += 1;
    const backoff = Math.min(this.reconnectAttempts * 1000, this.maxBackoff);
    setTimeout(() => this.connect(), backoff);
  }

  close() {
    this.isClosing = true;
    try { this.controller?.abort(); } catch {}
    this.onClose({ reason: "manual" });
  }
}

export function createLiveClient({ adminUsername, adminPassword, onOpen, onMessage, onError, onClose }) {
  if (!adminUsername || !adminPassword) {
    throw new Error("Admin username/password required for live SSE");
  }
  return new LiveSSEClient({
    path: "/api/admin/sessions/live",
    headers: {
      "X-Auth-Username": adminUsername,
      "X-Auth-Password": adminPassword,
    },
    onOpen, onMessage, onError, onClose,
  });
}
