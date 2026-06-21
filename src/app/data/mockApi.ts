// ── Mock API engine ──────────────────────────────────────────────────────────
//
// A tiny in-browser "server" for the Free Lab sandbox. It takes a request the
// user assembled (method + path + query + headers + body) and returns a
// realistic response — WITHOUT touching the network. This keeps the lab safe and
// offline while still behaving dynamically for any input the user types.
//
// Supported resources mimic a JSONPlaceholder-style API:
//   /users        /users/:id
//   /posts        /posts/:id
//   /profile      (requires an Authorization header)

export interface MockRequest {
  method: string;
  path: string;                                    // e.g. "/users/1"
  query: Record<string, string>;                   // e.g. { role: "admin", _limit: "2" }
  headers: Array<{ key: string; value: string }>;
  body: string;                                     // raw text the user typed
}

export interface MockResponse {
  status: number;
  statusText: string;
  lines: string[];        // pretty-printed JSON, split per line for the viewer
  data?: unknown;         // the parsed body object/array (for assertions)
  timeMs: number;         // simulated latency
  emptyNote?: string;     // shown when there is no body (e.g. 204)
}

// ── Seed data (read-only — the sandbox is stateless on purpose) ───────────────

const USERS = [
  { id: 1, name: 'Ada Lovelace',   role: 'admin',  email: 'ada@example.com'   },
  { id: 2, name: 'Alan Turing',    role: 'editor', email: 'alan@example.com'  },
  { id: 3, name: 'Grace Hopper',   role: 'editor', email: 'grace@example.com' },
  { id: 4, name: 'Linus Torvalds', role: 'viewer', email: 'linus@example.com' },
];

const POSTS = [
  { id: 1, userId: 1, title: 'Notes on the Analytical Engine' },
  { id: 2, userId: 2, title: 'On Computable Numbers' },
  { id: 3, userId: 3, title: 'The first compiler' },
  { id: 4, userId: 1, title: 'Bernoulli numbers, mechanically' },
];

const INVALID = Symbol('invalid-json');

function parseBody(raw: string): unknown {
  if (!raw.trim()) return undefined;
  try { return JSON.parse(raw); } catch { return INVALID; }
}

function applyQuery<T extends Record<string, unknown>>(rows: T[], query: Record<string, string>): T[] {
  let out = rows;
  for (const [key, val] of Object.entries(query)) {
    if (key === '_limit' || !val) continue;
    out = out.filter(r => String(r[key as keyof T]) === val);
  }
  const limit = Number(query._limit);
  if (Number.isFinite(limit) && limit >= 0) out = out.slice(0, limit);
  return out;
}

// ── Main entry ───────────────────────────────────────────────────────────────

export function mockApi(req: MockRequest): MockResponse {
  const timeMs   = Math.round(60 + Math.random() * 140);
  const method   = req.method.toUpperCase();
  const segments = req.path.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
  const resource = segments[0] ?? '';
  const rawId    = segments[1];

  const json = (status: number, statusText: string, payload: unknown): MockResponse =>
    ({ status, statusText, lines: JSON.stringify(payload, null, 2).split('\n'), data: payload, timeMs });
  const empty = (status: number, statusText: string, note: string): MockResponse =>
    ({ status, statusText, lines: [], timeMs, emptyNote: note });
  const error = (status: number, statusText: string, message: string): MockResponse =>
    json(status, statusText, { error: message });

  const hasHeader = (name: string) =>
    req.headers.some(h => h.key.toLowerCase().trim() === name && h.value.trim() !== '');
  const isJsonBody = req.headers.some(h =>
    h.key.toLowerCase().trim() === 'content-type' && h.value.toLowerCase().includes('application/json'));

  // ── Landing / help ──────────────────────────────────────────────────────────
  if (!resource) {
    return json(200, 'OK', {
      message: 'Welcome to the Free Lab mock API.',
      endpoints: ['/users', '/users/:id', '/posts', '/posts/:id', '/profile (needs Authorization)'],
      tip: 'Try GET /users?role=editor or POST /users with a JSON body.',
    });
  }

  // ── /profile (protected) ──────────────────────────────────────────────────────
  if (resource === 'profile') {
    if (method !== 'GET') return error(405, 'Method Not Allowed', `Use GET on /profile, not ${method}.`);
    if (!hasHeader('authorization'))
      return error(401, 'Unauthorized', 'Missing or invalid Authorization header.');
    return json(200, 'OK', USERS[0]);
  }

  // ── Resolve collection ────────────────────────────────────────────────────────
  const collections: Record<string, typeof USERS | typeof POSTS> = { users: USERS, posts: POSTS };
  const collection = collections[resource];
  if (!collection) {
    return error(404, 'Not Found', `Unknown endpoint "/${resource}". Try /users or /posts.`);
  }

  // ── Collection-level (no id) ──────────────────────────────────────────────────
  if (rawId === undefined) {
    switch (method) {
      case 'GET':
        return json(200, 'OK', applyQuery(collection as Record<string, unknown>[], req.query));
      case 'POST': {
        if (!isJsonBody)
          return error(400, 'Bad Request', 'Content-Type must be application/json.');
        const parsed = parseBody(req.body);
        if (parsed === INVALID) return error(400, 'Bad Request', 'Request body is not valid JSON.');
        const nextId = Math.max(...collection.map(r => r.id)) + 1;
        return json(201, 'Created', { id: nextId, ...(parsed as object ?? {}) });
      }
      case 'PUT':
      case 'PATCH':
      case 'DELETE':
        return error(405, 'Method Not Allowed',
          `Cannot ${method} the whole /${resource} collection. Target one item: /${resource}/1.`);
      default:
        return error(405, 'Method Not Allowed', `${method} is not supported on /${resource}.`);
    }
  }

  // ── Item-level (with id) ──────────────────────────────────────────────────────
  const id   = Number(rawId);
  const item = Number.isFinite(id) ? collection.find(r => r.id === id) : undefined;

  switch (method) {
    case 'GET':
      return item ? json(200, 'OK', item)
                  : error(404, 'Not Found', `No ${resource.replace(/s$/, '')} with id ${rawId}.`);
    case 'PUT':
    case 'PATCH': {
      if (!item) return error(404, 'Not Found', `No ${resource.replace(/s$/, '')} with id ${rawId} to update.`);
      if (!isJsonBody) return error(400, 'Bad Request', 'Content-Type must be application/json.');
      const parsed = parseBody(req.body);
      if (parsed === INVALID) return error(400, 'Bad Request', 'Request body is not valid JSON.');
      const merged = method === 'PUT' ? { id: item.id, ...(parsed as object ?? {}) }
                                      : { ...item, ...(parsed as object ?? {}) };
      return json(200, 'OK', merged);
    }
    case 'DELETE':
      return item ? empty(204, 'No Content', `204 No Content — ${resource.replace(/s$/, '')} ${rawId} was deleted. There's nothing to return.`)
                  : error(404, 'Not Found', `No ${resource.replace(/s$/, '')} with id ${rawId} to delete.`);
    case 'POST':
      return error(405, 'Method Not Allowed', `POST creates new items at /${resource}, not /${resource}/${rawId}.`);
    default:
      return error(405, 'Method Not Allowed', `${method} is not supported here.`);
  }
}
