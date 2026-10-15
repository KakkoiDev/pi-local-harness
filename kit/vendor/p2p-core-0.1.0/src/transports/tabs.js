/**
 * Other tabs and windows of the SAME browser, through a BroadcastChannel.
 *
 * No network at all: it works offline, on file-less localhost, on a plane.
 * It cannot reach a different browser on the same machine (Chrome and Firefox
 * do not share channels) — that takes the relays or the local server.
 *
 * Wire format, all on one channel named after the room key:
 *   { t: 'hi',   from, silent }          I am here (sent on start, and as a reply)
 *   { t: 'here', from, silent, to }      reply to a hi, so the newcomer learns about us
 *   { t: 'hb',   from }                  heartbeat; a tab that stops sending is gone
 *   { t: 'bye',  from }                  leaving
 *   { t: 'm',    from, to, k, d }        a message (to: null = everyone)
 *
 * A tab with `silent` set (allow.sameBrowser === false) still announces
 * itself, so that both sides can exclude each other from every other
 * transport too, but it is never reported as a peer.
 */

const HEARTBEAT_MS = 2000;
const TIMEOUT_MS = 7000;

export function tabsTransport({ silent = false, Channel = globalThis.BroadcastChannel } = {}) {
  let ctx = null;
  let channel = null;
  let beat = null;
  let state = 'off';
  /** id -> { seen, silent } */
  const tabs = new Map();

  function post(message) {
    if (!channel) return;
    try { channel.postMessage({ ...message, from: ctx.selfId }); } catch (err) {
      ctx.error(new Error(`p2p-core: could not post to other tabs — ${err.message}`));
    }
  }

  function see(id, isSilent) {
    const known = tabs.get(id);
    if (known) { known.seen = Date.now(); return false; }
    tabs.set(id, { seen: Date.now(), silent: !!isSilent });
    if (silent || isSilent) ctx.sibling(id);
    else ctx.peerJoin(id);
    return true;
  }

  function forget(id) {
    const known = tabs.get(id);
    if (!known) return;
    tabs.delete(id);
    if (!silent && !known.silent) ctx.peerLeave(id);
  }

  function onMessage(event) {
    const msg = event.data;
    if (!msg || typeof msg !== 'object' || typeof msg.from !== 'string' || msg.from === ctx.selfId) return;
    switch (msg.t) {
      case 'hi':
        see(msg.from, msg.silent);
        post({ t: 'here', to: msg.from, silent });
        break;
      case 'here':
        if (msg.to === ctx.selfId) see(msg.from, msg.silent);
        break;
      case 'hb':
        if (!tabs.has(msg.from)) {
          // A tab we never heard say hi (we joined while its hi was in flight,
          // or we were asleep). Ask it to introduce itself.
          post({ t: 'hi', silent });
        } else tabs.get(msg.from).seen = Date.now();
        break;
      case 'bye':
        forget(msg.from);
        break;
      case 'm': {
        if (msg.to && !msg.to.includes(ctx.selfId)) return;
        if (!tabs.has(msg.from)) see(msg.from, false);
        if (silent || tabs.get(msg.from)?.silent) return;
        tabs.get(msg.from).seen = Date.now();
        ctx.receive(msg.from, msg.k, msg.d);
        break;
      }
      default:
    }
  }

  const onPageHide = () => post({ t: 'bye' });

  return {
    name: 'tabs',
    start(context) {
      ctx = context;
      if (typeof Channel !== 'function') {
        state = 'unavailable';
        ctx.statusChanged();
        return;
      }
      channel = new Channel(`p2p-core:${ctx.key}`);
      channel.onmessage = onMessage;
      state = 'ready';
      post({ t: 'hi', silent });
      beat = setInterval(() => {
        post({ t: 'hb' });
        const now = Date.now();
        for (const [id, info] of tabs) if (now - info.seen > TIMEOUT_MS) forget(id);
      }, HEARTBEAT_MS);
      globalThis.addEventListener?.('pagehide', onPageHide);
      ctx.statusChanged();
    },
    register() {},
    send(kind, data, ids) {
      post({ t: 'm', to: ids || null, k: kind, d: data });
    },
    stop() {
      post({ t: 'bye' });
      clearInterval(beat);
      globalThis.removeEventListener?.('pagehide', onPageHide);
      channel?.close();
      channel = null;
      for (const id of [...tabs.keys()]) forget(id);
      state = 'off';
    },
    status() {
      return { name: 'tabs', state, peers: silent ? 0 : [...tabs.values()].filter((t) => !t.silent).length };
    },
    async route(id) {
      return tabs.has(id) ? { path: 'same-browser', local: true, rtt: 0 } : null;
    },
  };
}
