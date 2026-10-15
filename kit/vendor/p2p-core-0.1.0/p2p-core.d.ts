// Types for p2p-core. The library is plain JavaScript; these are for editors and agents.

export const VERSION: string;

/** This page's id: what every room in this page is called (trystero's selfId). */
export const selfId: string;

/** The shared public nostr relay list. Append-only: see src/relays.js. */
export const RELAYS: readonly string[];

export type Mode = 'auto' | 'online' | 'offline' | 'tabs';
export type TransportName = 'tabs' | 'relays' | 'server' | 'pair' | 'memory';

export interface Allow {
  /** Other tabs/windows of this same browser. Default true. */
  sameBrowser?: boolean;
  /** Other browsers and devices on this network (incl. other browsers on this device). Default true. */
  sameNetwork?: boolean;
  /** Anyone on the internet. Default true. */
  otherNetworks?: boolean;
}

export interface TurnServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface JoinOptions {
  /** Your game's name. Players only meet players of the same app. Required. */
  app: string;
  /** Room name inside the app. Default 'lobby'. */
  room?: string;
  /** Which transports run. Default 'auto'. */
  mode?: Mode;
  /** Who may join. All true by default. */
  allow?: Allow;
  /** Local server: 'auto' (the server this page came from), a URL, or false. */
  server?: string | false;
  /** Nostr relays. Default RELAYS. Only players with an overlapping list meet. */
  relays?: readonly string[];
  /** TURN servers for networks that block direct links. */
  turn?: TurnServer[];
  /** Extra RTCPeerConnection configuration. */
  rtcConfig?: RTCConfiguration;
  /** Shared secret: changes the room on every transport and encrypts WebRTC signalling. */
  password?: string;
  /** Your network protocol version. Peers with a different one are refused. */
  protocol?: string | number;
  /** Decide who gets in. Return false to refuse. */
  acceptPeer?: (peer: { id: string; profile?: unknown; via: TransportName[] }) => boolean | Promise<boolean>;
  /** Most other players to accept. Default Infinity. */
  maxPeers?: number;
  /** Largest message accepted or sent, in bytes. Default 65536. */
  maxMessageBytes?: number;
  /** Messages per second accepted from each peer (0 = no limit). */
  rateLimit?: number;
  /** Per-kind validators: return false to drop the message. */
  validate?: Record<string, (data: unknown, from: string) => boolean | void>;
  /** Sent to every peer when they meet you; read as peer.profile. */
  profile?: unknown;
  /** Message kinds to register at once (see "register handlers early"). */
  kinds?: string[];
  /** A createTestNetwork() network: run in memory, for tests. */
  network?: TestNetwork;
  /** Advanced: turn individual transports on/off or configure them. */
  transports?: Partial<Record<TransportName, boolean | string | object>>;
  /** Advanced: fixed id (tests). Not allowed with the real relays. */
  selfId?: string;
  /** Log what happens to the console. */
  debug?: boolean;
}

export interface Peer {
  id: string;
  profile?: any;
  /** When this page accepted them (ms since epoch). */
  joinedAt: number | null;
  /** Every transport they are reachable through, best first. */
  via: TransportName[];
  /** The transport messages to them take. */
  transport: TransportName | null;
}

export interface Route {
  path: 'same-browser' | 'local-server' | 'direct-local' | 'direct-internet' | 'relayed' | 'via-peer' | 'memory' | 'unknown';
  local: boolean | null;
  rtt: number | null;
  transport?: TransportName;
}

export interface TransportStatus {
  name: TransportName;
  state: 'off' | 'connecting' | 'ready' | 'idle' | 'unavailable' | 'error';
  peers: number;
  detail?: string;
  /** relays only */
  open?: number;
  total?: number;
  relays?: { url: string; open: boolean }[];
  /** server only */
  url?: string;
  /** pair only */
  links?: number;
}

export interface RoomStatus {
  selfId: string;
  peers: number;
  online: boolean;
  transports: Partial<Record<TransportName, TransportStatus>>;
}

export interface Invite {
  /** Show this to the other device (as text or QR). */
  code: string;
  /** Give it the answer code the other device shows. Resolves with their id once connected. */
  finish(answerCode: string): Promise<string>;
  connected: Promise<string>;
  cancel(): void;
}

type Off = () => void;

export interface Room {
  readonly selfId: string;
  readonly app: string;
  readonly roomId: string;
  readonly version: string;
  /** Resolves when every transport has started. Joining does not need to wait for it. */
  readonly ready: Promise<Room>;
  readonly stats: {
    sent: number;
    received: number;
    dropped: { unknownPeer: number; tooBig: number; rateLimited: number; invalid: number; unhandled: number; refused: number };
  };
  readonly profile: unknown;
  readonly left: boolean;

  /** Send to everyone, one peer id, or a list of ids. Kinds are 1–12 bytes. */
  send(kind: string, data: unknown, to?: string | string[] | null): Promise<void>;
  /** Listen to one kind. Returns a function that stops listening. */
  onMessage<T = any>(kind: string, fn: (data: T, from: string, peer: Peer) => void): Off;
  /** Listen to every kind. */
  onMessage(fn: (kind: string, data: any, from: string, peer: Peer) => void): Off;
  /** trystero-compatible: [send(data, to?), onReceive(fn(data, peerId)), onProgress]. */
  makeAction<T = any>(kind: string): [(data: T, to?: string | string[] | null, meta?: object) => Promise<void>, (fn: (data: T, peerId: string, meta?: object) => void) => void, (fn: Function) => void];

  onPeerJoin(fn: (id: string, peer: Peer) => void): Off;
  onPeerLeave(fn: (id: string, peer: Peer) => void): Off;
  /** A peer's profile or transports changed. */
  onPeerUpdate(fn: (id: string, peer: Peer) => void): Off;
  onRefused(fn: (id: string, reason: string) => void): Off;
  onError(fn: (error: Error) => void): Off;
  onStatus(fn: (status: RoomStatus) => void): Off;
  onHostChange(fn: (hostId: string) => void): Off;
  onPeerStream(fn: (stream: MediaStream, id: string, meta?: object) => void): Off;
  onPeerTrack(fn: (track: MediaStreamTrack, stream: MediaStream, id: string, meta?: object) => void): Off;

  peers(): Peer[];
  peer(id: string): Peer | null;
  count(): number;
  /** The lowest id in the room, yourself included. Everyone agrees on it. */
  hostId(): string;
  isHost(): boolean;
  setProfile(profile: unknown): void;

  status(): RoomStatus;
  route(id: string): Promise<Route | null>;
  ping(id: string, timeoutMs?: number): Promise<number>;

  addStream(stream: MediaStream, to?: string | string[] | null, meta?: object): unknown;
  removeStream(stream: MediaStream, to?: string | string[] | null): unknown;
  addTrack(track: MediaStreamTrack, stream: MediaStream, to?: string | string[] | null, meta?: object): unknown;
  removeTrack(track: MediaStreamTrack, to?: string | string[] | null): unknown;
  /** trystero-compatible: RTCPeerConnections of peers reached over WebRTC. */
  getPeers(): Record<string, RTCPeerConnection>;

  pair: {
    readonly available: boolean;
    invite(): Promise<Invite>;
    accept(inviteCode: string): Promise<{ code: string; connected: Promise<string> }>;
  };

  transport(name: TransportName): object | null;
  leave(): void;
}

export function joinRoom(options: JoinOptions): Room;

export interface TestNetwork {
  latency: number;
  log: { from: string; to: string; kind: string; data: unknown }[];
  settle(): Promise<void>;
  drop(rule: ((entry: { from: string; to: string; kind: string; data: unknown }) => boolean) | null): void;
  disconnect(id: string): void;
}
export function createTestNetwork(options?: { latency?: number }): TestNetwork;

/** The base URL of the p2p-core server this page was served from, or null. */
export function detectServer(base?: string): Promise<string | null>;
export function planTransports(options: object): Record<string, unknown>;
export function classifyCandidates(local: object, remote: object): { path: Route['path']; local: boolean | null };
