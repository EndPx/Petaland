/**
 * ChatPanel — bottom-left floating chat for Petaland.
 *
 * Design: NomStead-style warm panel, minimal, expand/collapse.
 * - Always-visible last 3 messages (faded, click to expand)
 * - When expanded: full message history + input
 * - Press Enter while focused to send
 * - Press T or / to focus input from anywhere in the game
 *
 * Wired to ColyseusClient — sends `chat` messages, listens for
 * `chat_message` broadcasts.
 */

export interface ChatLine {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isLocal?: boolean;
}

export type ChatSendHandler = (text: string) => void;

const MAX_VISIBLE = 50;

export class ChatPanel {
  private panel!: HTMLElement;
  private messageList!: HTMLElement;
  private input!: HTMLInputElement;
  private toggleBtn!: HTMLElement;
  private expanded = true;
  private messages: ChatLine[] = [];
  private sendHandler: ChatSendHandler | null = null;

  constructor() {
    this.buildDOM();
    this.bindEvents();
  }

  // ─── DOM ──────────────────────────────────────────────────────────────────

  private buildDOM(): void {
    const root = document.createElement('div');
    root.id = 'chat-panel';
    root.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');

        #chat-panel {
          position: fixed;
          bottom: 80px;
          left: 16px;
          width: 320px;
          max-width: calc(100vw - 32px);
          font-family: 'Nunito', sans-serif;
          z-index: 25;
          pointer-events: none;
          user-select: none;
          -webkit-user-select: none;
        }
        #chat-panel.collapsed #chat-body {
          display: none;
        }

        /* Header / toggle bar */
        #chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #fffdf8;
          border: 1px solid rgba(180, 150, 120, 0.15);
          border-radius: 10px 10px 0 0;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 700;
          color: #4a3828;
          cursor: pointer;
          pointer-events: all;
          box-shadow: 0 -2px 6px rgba(100, 60, 20, 0.08);
        }
        #chat-panel.collapsed #chat-header {
          border-radius: 10px;
        }
        #chat-header-title {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        #chat-toggle {
          font-size: 14px;
          color: #9a8672;
          font-weight: 700;
          width: 20px;
          text-align: center;
          transition: transform 0.18s ease;
        }
        #chat-panel.collapsed #chat-toggle {
          transform: rotate(-180deg);
        }
        #chat-unread-badge {
          background: #e8536a;
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 10px;
          margin-left: 4px;
          display: none;
        }
        #chat-unread-badge.has-unread {
          display: inline-block;
        }

        /* Body */
        #chat-body {
          background: #fffdf8;
          border: 1px solid rgba(180, 150, 120, 0.15);
          border-top: none;
          border-radius: 0 0 10px 10px;
          padding: 8px;
          box-shadow: 0 4px 14px rgba(100, 60, 20, 0.12);
          pointer-events: all;
        }

        #chat-messages {
          max-height: 200px;
          min-height: 120px;
          overflow-y: auto;
          margin-bottom: 8px;
          padding: 4px 6px;
          background: #f5ece0;
          border-radius: 6px;
          scroll-behavior: smooth;
        }
        #chat-messages::-webkit-scrollbar {
          width: 6px;
        }
        #chat-messages::-webkit-scrollbar-thumb {
          background: rgba(180, 150, 120, 0.4);
          border-radius: 3px;
        }
        #chat-messages::-webkit-scrollbar-track {
          background: transparent;
        }

        .chat-msg {
          font-size: 12px;
          line-height: 1.4;
          margin: 3px 0;
          word-wrap: break-word;
        }
        .chat-msg-name {
          font-weight: 700;
          margin-right: 5px;
        }
        .chat-msg-time {
          color: #b0a090;
          font-size: 9px;
          margin-right: 4px;
          font-weight: 600;
        }
        .chat-msg-text {
          color: #4a3828;
        }
        .chat-msg-system {
          color: #9a8672;
          font-style: italic;
          text-align: center;
          font-size: 10px;
        }
        .chat-msg.is-local .chat-msg-name {
          color: #6b9e3e;
        }
        .chat-msg.is-remote .chat-msg-name {
          color: #5a7da3;
        }

        /* Input row */
        #chat-input-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        #chat-input {
          flex: 1;
          padding: 6px 10px;
          font-size: 12px;
          font-family: 'Nunito', sans-serif;
          font-weight: 600;
          color: #4a3828;
          background: #f5ece0;
          border: 1.5px solid rgba(180, 150, 120, 0.2);
          border-radius: 6px;
          outline: none;
          transition: border-color 0.15s ease;
        }
        #chat-input:focus {
          border-color: #6b9e3e;
          background: #fffdf8;
        }
        #chat-input::placeholder {
          color: #b0a090;
        }
        #chat-send {
          background: #6b9e3e;
          color: #ffffff;
          border: none;
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 700;
          font-family: 'Nunito', sans-serif;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        #chat-send:hover {
          background: #7db648;
          transform: scale(1.04);
        }
        #chat-send:active {
          transform: scale(0.96);
        }
        #chat-send:disabled {
          background: #c0c0c0;
          cursor: not-allowed;
          transform: none;
        }

        /* Empty state */
        .chat-empty {
          text-align: center;
          padding: 20px 8px;
          color: #b0a090;
          font-size: 11px;
          font-weight: 600;
        }
      </style>

      <div id="chat-header">
        <div id="chat-header-title">
          💬 <span>Chat</span>
          <span id="chat-unread-badge"></span>
        </div>
        <span id="chat-toggle">▾</span>
      </div>

      <div id="chat-body">
        <div id="chat-messages">
          <div class="chat-empty">No messages yet — say hi!</div>
        </div>
        <div id="chat-input-row">
          <input
            id="chat-input"
            type="text"
            maxlength="200"
            placeholder="Press Enter to send..."
            autocomplete="off"
          />
          <button id="chat-send">Send</button>
        </div>
      </div>
    `;

    document.body.appendChild(root);
    this.panel = root;
    this.messageList = root.querySelector('#chat-messages') as HTMLElement;
    this.input = root.querySelector('#chat-input') as HTMLInputElement;
    this.toggleBtn = root.querySelector('#chat-header') as HTMLElement;
  }

  private bindEvents(): void {
    // Toggle expanded/collapsed
    this.toggleBtn.addEventListener('click', () => this.toggle());

    // Send on Enter
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.send();
      }
      // Stop game-input propagation while focused (so WASD doesn't move player)
      e.stopPropagation();
    });

    // Send button
    const sendBtn = this.panel.querySelector('#chat-send') as HTMLButtonElement;
    sendBtn.addEventListener('click', () => this.send());

    // Disable send when input empty
    this.input.addEventListener('input', () => {
      sendBtn.disabled = this.input.value.trim() === '';
    });
    sendBtn.disabled = true;

    // Press T or / anywhere → focus chat input
    document.addEventListener('keydown', (e) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';
      if (isTyping) return;

      if (e.key === '/' || e.key === 't' || e.key === 'T') {
        // Skip 't' if it's also bound to placement mode in GameScene —
        // only focus chat if we're already expanded; otherwise let game handle T
        if (e.key === 't' || e.key === 'T') {
          if (!this.expanded) return; // T = place tree (game)
        }
        e.preventDefault();
        this.expand();
        this.input.focus();
      }
    });
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  setSendHandler(handler: ChatSendHandler): void {
    this.sendHandler = handler;
  }

  pushMessage(line: ChatLine): void {
    // Remove empty state on first real message
    const empty = this.messageList.querySelector('.chat-empty');
    if (empty) empty.remove();

    this.messages.push(line);
    while (this.messages.length > MAX_VISIBLE) {
      this.messages.shift();
      this.messageList.firstElementChild?.remove();
    }

    const div = document.createElement('div');
    div.className = `chat-msg ${line.isLocal ? 'is-local' : 'is-remote'}`;
    const time = this.formatTime(line.timestamp);
    div.innerHTML = `
      <span class="chat-msg-time">${time}</span>
      <span class="chat-msg-name">${this.escapeHtml(line.senderName)}:</span>
      <span class="chat-msg-text">${this.escapeHtml(line.text)}</span>
    `;
    this.messageList.appendChild(div);
    this.messageList.scrollTop = this.messageList.scrollHeight;

    // Bump unread badge if collapsed
    if (!this.expanded && !line.isLocal) {
      const badge = this.panel.querySelector('#chat-unread-badge') as HTMLElement;
      const current = parseInt(badge.textContent ?? '0', 10) || 0;
      badge.textContent = String(current + 1);
      badge.classList.add('has-unread');
    }
  }

  pushSystem(text: string): void {
    const empty = this.messageList.querySelector('.chat-empty');
    if (empty) empty.remove();
    const div = document.createElement('div');
    div.className = 'chat-msg chat-msg-system';
    div.textContent = `— ${text} —`;
    this.messageList.appendChild(div);
    this.messageList.scrollTop = this.messageList.scrollHeight;
  }

  expand(): void {
    this.expanded = true;
    this.panel.classList.remove('collapsed');
    const badge = this.panel.querySelector('#chat-unread-badge') as HTMLElement;
    badge.classList.remove('has-unread');
    badge.textContent = '';
  }

  collapse(): void {
    this.expanded = false;
    this.panel.classList.add('collapsed');
  }

  toggle(): void {
    this.expanded ? this.collapse() : this.expand();
  }

  destroy(): void {
    this.panel.remove();
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  private send(): void {
    const text = this.input.value.trim();
    if (!text) return;
    if (!this.sendHandler) {
      this.pushSystem('Not connected to server');
      return;
    }
    this.sendHandler(text);
    this.input.value = '';
    (this.panel.querySelector('#chat-send') as HTMLButtonElement).disabled = true;
  }

  private formatTime(ts: number): string {
    const d = new Date(ts);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
