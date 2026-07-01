// ── Lesson data types ────────────────────────────────────────────

export interface MCQData {
  type: 'mcq';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface FillBlankData {
  type: 'fill-blank';
  instruction?: string;
  template: string; // uses ____ as blank marker
  blanks: string[]; // correct answers in order
  wordBank: string[]; // includes correct answers + distractors
  explanation: string;
}

export interface DragCategorizeData {
  type: 'drag-categorize';
  instruction: string;
  buckets: string[];
  cards: Array<{ id: string; text: string; correctBucket: string }>;
  explanation: string;
}

export interface DragOrderData {
  type: 'drag-order';
  instruction: string;
  items: Array<{ id: string; text: string; badge?: string }>; // in correct order
  explanation: string;
}

export interface PostmanData {
  type: 'postman';
  task: string;
  method: string;
  url: string;
  headers: Array<{ key: string; value: string; locked?: boolean }>;
  body?: string;
  showBody?: boolean;
  debugMode?: boolean;
  debugHint?: string;
  initialFailResponse?: { status: number; statusText: string; body: string };
  requiredHeaders?: Array<{ key: string; value: string }>;
  successResponse: { status: number; statusText: string; body: string };
  explanation: string;
}

// A Brilliant-style interactive lesson, run as three beats:
//   1. EXPERIENCE — the learner plays with a live mini-system (no right/wrong),
//      triggering real request→response round-trips and watching it react.
//   2. CONCEPT    — only now do we name what just happened (the definition).
//   3. CHECK      — a hands-on consolidation (drag a request wire to the right
//      source), which feels obvious because the learner already lived it.
export interface InteractiveNode {
  id: string;
  label: string;
  sub?: string;   // small caption under the label (e.g. a URL or hint)
  emoji?: string; // visual anchor
}

// One thing the learner can try in the EXPERIENCE step. Tapping it fires a
// round-trip: the request flies out, the response comes back, the device updates.
export interface ExploreQuery {
  id: string;
  label: string;    // chip label, e.g. "Hà Nội"
  request: string;  // what the device sends,   e.g. "GET /forecast?city=Hanoi"
  response: string; // what comes back (JSON),   e.g. '{ "temp": 28 }'
  display: string;  // what the device then shows, e.g. "28° ☀️"
  tone?: 'good' | 'bad'; // colours the result (green success / red error); omit = neutral
}

// Alternative EXPERIENCE: the learner sets the EXPECTED result themselves, runs
// the request, and sees PASS/FAIL from their own expectation vs the actual.
export interface PredictExperience {
  intro: string;
  expectedOptions: string[]; // choices the learner can predict, e.g. ['200 OK', '404 Not Found']
  rows: Array<{ id: string; request: string; actual: string }>;
}

export interface InteractiveData {
  type: 'interactive';
  // 1 ── EXPERIENCE
  explore: {
    prompt: string;
    deviceEmoji: string;  deviceLabel: string;
    serviceEmoji: string; serviceLabel: string; serviceSub?: string;
    emptyDisplay: string;        // device display before any request (e.g. "—°")
    queries?: ExploreQuery[];    // round-trip playground: things to try (≥1 to advance)
    predict?: PredictExperience; // OR a predict-the-result lab (used instead of queries)
    hint?: string;
  };
  // 2 ── CONCEPT (named only after the experience)
  insight: {
    title: string;
    body: string;
    terms?: Array<{ term: string; def: string }>;
  };
  // 3 ── CHECK (hands-on consolidation; explanation always shown afterwards)
  check: InteractiveCheck;
}

interface InteractiveCheckBase {
  prompt: string;
  explanation: string; // always revealed after answering — right OR wrong
}
// Drag a request "wire" from the source to the correct destination.
export interface InteractiveConnectCheck extends InteractiveCheckBase {
  mode: 'connect';
  source: InteractiveNode;
  sourceEmptyLabel?: string;
  sourceFilledLabel?: string;
  targets: InteractiveNode[];
  correctTargetId: string;
  reveal: { request: string; response: string };
}
// Tap the correct statement — used when the concept is pure recall (e.g. an acronym).
export interface InteractiveChoiceCheck extends InteractiveCheckBase {
  mode: 'choice';
  options: string[];
  correctIndex: number;
}
// Predict-&-Run: the learner declares the EXPECTED result for one or more real
// requests, then runs them and watches PASS/FAIL from expected vs actual — the
// same muscle a tester uses. Passes only when EVERY prediction matches. This
// keeps the check hands-on instead of a recall quiz.
export interface InteractivePredictCheck extends InteractiveCheckBase {
  mode: 'predict';
  intro?: string;
  expectedOptions: string[];
  rows: Array<{ id: string; request: string; actual: string }>;
}
export type InteractiveCheck = InteractiveConnectCheck | InteractiveChoiceCheck | InteractivePredictCheck;

export type LessonData = MCQData | FillBlankData | DragCategorizeData | DragOrderData | PostmanData | InteractiveData;

export interface Lesson {
  id: string;
  title: string;
  xp: number;
  data: LessonData;
}

export interface Module {
  id: string;
  title: string;
  subtitle: string;
  // One-line "by the end you'll be able to…" outcome shown on the module card.
  outcome: string;
  accent: string;
  accentLight: string;
  nodeColor: [string, string];
  lessons: Lesson[];
}

// ── Helpers ──────────────────────────────────────────────────────

export function computeModuleStatus(
  moduleIdx: number,
  completedLessons: Set<string>
): 'completed' | 'current' | 'locked' {
  // Free-roam mode: every module is open for testing. A module is only ever
  // 'completed' (all lessons done) or 'current' (still has lessons to do) —
  // nothing is locked behind a prerequisite.
  const mod = MODULES[moduleIdx];
  if (mod.lessons.every(l => completedLessons.has(l.id))) return 'completed';
  return 'current';
}

export function getCurrentModule(completedLessons: Set<string>) {
  const idx = MODULES.findIndex(mod => !mod.lessons.every(l => completedLessons.has(l.id)));
  const safeIdx = idx === -1 ? MODULES.length - 1 : idx;
  return { module: MODULES[safeIdx], index: safeIdx };
}

// Locate a lesson (and its module) by id — used by the mistakes review.
export function findLesson(lessonId: string) {
  for (let mi = 0; mi < MODULES.length; mi++) {
    const lesson = MODULES[mi].lessons.find(l => l.id === lessonId);
    if (lesson) return { moduleIdx: mi, module: MODULES[mi], lesson };
  }
  return null;
}

// A short, human-readable prompt for any exercise type.
export function getLessonPrompt(data: LessonData): string {
  switch (data.type) {
    case 'mcq':             return data.question;
    case 'fill-blank':      return data.instruction ?? data.template;
    case 'drag-categorize': return data.instruction;
    case 'drag-order':      return data.instruction;
    case 'postman':         return data.task;
    case 'interactive':     return data.explore.prompt;
  }
}

// The correct answer for an exercise, as readable text. Used to "reveal" the
// answer after the learner has missed it several times. Returns null for types
// that own their own answer feedback (postman / interactive).
export function getCorrectAnswer(data: LessonData): string | null {
  switch (data.type) {
    case 'mcq':             return data.options[data.correctIndex];
    case 'fill-blank':      return data.blanks.join(', ');
    case 'drag-categorize': return data.cards.map(c => `${c.text} → ${c.correctBucket}`).join(' · ');
    case 'drag-order':      return data.items.map((it, i) => `${i + 1}. ${it.text}`).join('   ');
    default:                return null;
  }
}

// A gentle nudge toward the answer, shown the moment a learner gets it wrong
// (before the full answer is revealed). Type-specific so it actually helps.
export function getHint(data: LessonData): string {
  switch (data.type) {
    case 'fill-blank':      return 'Re-read the sentence and reconsider the highlighted words — each blank has one best fit.';
    case 'drag-categorize': return 'Some cards are in the wrong group. Re-read the instruction and move the highlighted ones.';
    case 'drag-order':      return 'The order isn\'t right yet. Think about which step has to happen first.';
    default:                return 'Take another look and try again.';
  }
}

// ── Course data ───────────────────────────────────────────────────

export const MODULES: Module[] = [
  // ─────────────────────────────────────────── MODULE 1
  {
    id: 'mod1',
    title: 'What is an API?',
    subtitle: 'Core concepts',
    outcome: 'Explain what an API is and read a request & response.',
    accent: '#3B82F6',
    accentLight: '#DBEAFE',
    nodeColor: ['#3B82F6', '#60A5FA'],
    lessons: [
      {
        id: 'l1-1', title: 'API Definition', xp: 10,
        data: {
          type: 'interactive',
          explore: {
            prompt: 'You\'re at a restaurant. You can\'t walk into the kitchen — but you have a menu. Tap a dish to order.',
            deviceEmoji: '🧑', deviceLabel: 'You',
            serviceEmoji: '👨‍🍳', serviceLabel: 'Kitchen', serviceSub: 'cooks to order',
            emptyDisplay: 'hungry…',
            queries: [
              { id: 'pho',    label: '🍜 Phở',     request: 'ORDER pho',    response: '{ "dish": "Phở bò" }',    display: '🍜 Phở!' },
              { id: 'coffee', label: '☕ Cà phê',   request: 'ORDER coffee', response: '{ "dish": "Cà phê sữa" }', display: '☕ Cà phê!' },
              { id: 'banhmi', label: '🥖 Bánh mì',  request: 'ORDER banhmi', response: '{ "dish": "Bánh mì" }',   display: '🥖 Bánh mì!' },
            ],
            hint: 'The menu is the only way you talk to the kitchen.',
          },
          insight: {
            title: 'That menu is an interface',
            body: 'You never touched the kitchen — you asked through the menu, a fixed list of what you can order and what you\'ll get back. Software works the same way: one program talks to another through an Application Programming Interface.',
            terms: [
              { term: 'Application', def: 'the program doing the asking (the app — or you)' },
              { term: 'Programming', def: 'it\'s an interface built for software to use' },
              { term: 'Interface', def: 'the agreed menu: how you ask, and what comes back' },
            ],
          },
          check: {
            mode: 'predict',
            prompt: 'The menu is the interface — it fixes exactly what you can order. Predict how the kitchen answers each order.',
            intro: 'A prediction passes only when it matches what the kitchen actually does.',
            expectedOptions: ['✅ On the menu', '❌ Not on the menu'],
            rows: [
              { id: 'r1', request: 'ORDER phở',     actual: '✅ On the menu' },
              { id: 'r2', request: 'ORDER bánh mì', actual: '✅ On the menu' },
              { id: 'r3', request: 'ORDER pizza',   actual: '❌ Not on the menu' },
            ],
            explanation: 'An API is exactly this menu — an Application Programming Interface that defines what you may ask for and what comes back. Phở and bánh mì are on the menu, so the kitchen serves them; pizza isn\'t, so the request is refused. That agreed list of valid requests IS the API.',
          },
        },
      },
      {
        id: 'l1-2', title: 'APIs in the Wild', xp: 10,
        data: {
          type: 'interactive',
          explore: {
            prompt: 'Here\'s a brand-new weather app — it knows nothing yet. Tap a city and watch how it gets a forecast.',
            deviceEmoji: '📱', deviceLabel: 'Weather App',
            serviceEmoji: '☁️', serviceLabel: 'Weather Service', serviceSub: 'api.openweather.org',
            emptyDisplay: '—°',
            queries: [
              { id: 'hanoi',  label: 'Hà Nội', request: 'GET /forecast?city=Hanoi',  response: '{ "temp": 28, "sky": "sunny" }', display: '28° ☀️', tone: 'good' },
              { id: 'tokyo',  label: 'Tokyo',  request: 'GET /forecast?city=Tokyo',  response: '{ "temp": 19, "sky": "rain" }',  display: '19° 🌧️', tone: 'good' },
              { id: 'london', label: 'London', request: 'GET /forecast?city=London', response: '{ "temp": 12, "sky": "cloud" }', display: '12° ☁️', tone: 'good' },
            ],
            hint: 'Try a few cities — the app asks the service every time.',
          },
          insight: {
            title: 'You just made API calls',
            body: 'The app had no weather of its own. Each time you picked a city, it sent a request to a weather service and got back data, then showed it. That round-trip — ask, then receive — is an API call.',
            terms: [
              { term: 'Client', def: 'the app doing the asking (your weather app)' },
              { term: 'API', def: 'the service\'s menu of things you can request' },
              { term: 'Request → Response', def: 'you ask, the service answers with data (JSON)' },
            ],
          },
          check: {
            mode: 'predict',
            prompt: 'The app has no weather of its own — it must ask the service. Predict the forecast each request brings back.',
            intro: 'Different request (city) → different response (its forecast).',
            expectedOptions: ['☀️ 28°', '🌧️ 19°', '☁️ 12°'],
            rows: [
              { id: 'r1', request: 'GET /forecast?city=Hanoi',  actual: '☀️ 28°' },
              { id: 'r2', request: 'GET /forecast?city=Tokyo',  actual: '🌧️ 19°' },
              { id: 'r3', request: 'GET /forecast?city=London', actual: '☁️ 12°' },
            ],
            explanation: 'The weather app holds no data itself. Each city name goes out in the request and the matching data comes back in the response — that round-trip is an API call. Change the request and the response changes with it.',
          },
        },
      },
      {
        id: 'l1-3', title: 'HTTP Methods', xp: 15,
        data: {
          type: 'interactive',
          explore: {
            prompt: 'Here\'s a users API. Tap each method and watch what it does to the data.',
            deviceEmoji: '💻', deviceLabel: 'API Client',
            serviceEmoji: '🗄️', serviceLabel: 'Users API', serviceSub: '/users',
            emptyDisplay: 'idle',
            queries: [
              { id: 'get',    label: 'GET',    request: 'GET /users/1',    response: '200 { "name": "Mai" }', display: '📄 Read' },
              { id: 'post',   label: 'POST',   request: 'POST /users',     response: '201 Created',           display: '➕ Create' },
              { id: 'put',    label: 'PUT',    request: 'PUT /users/1',    response: '200 Updated',           display: '✏️ Update' },
              { id: 'delete', label: 'DELETE', request: 'DELETE /users/1', response: '204 No Content',        display: '🗑️ Delete' },
            ],
            hint: 'Four methods, four different actions.',
          },
          insight: {
            title: 'Each method is a verb',
            body: 'You just saw it: GET reads data, POST creates new data, PUT updates it, DELETE removes it. These four actions together are known as CRUD — Create, Read, Update, Delete.',
            terms: [
              { term: 'GET', def: 'read / retrieve existing data' },
              { term: 'POST', def: 'create something new' },
              { term: 'PUT', def: 'update / replace existing data' },
              { term: 'DELETE', def: 'remove data' },
            ],
          },
          check: {
            mode: 'predict',
            prompt: 'Predict what each HTTP method does to the data on the server.',
            intro: 'Match every method to its action, then run to check.',
            expectedOptions: ['📄 Read', '➕ Create', '✏️ Update', '🗑️ Delete'],
            rows: [
              { id: 'r1', request: 'GET /users/1',    actual: '📄 Read' },
              { id: 'r2', request: 'POST /users',     actual: '➕ Create' },
              { id: 'r3', request: 'PUT /users/1',    actual: '✏️ Update' },
              { id: 'r4', request: 'DELETE /users/1', actual: '🗑️ Delete' },
            ],
            explanation: 'GET reads, POST creates, PUT updates, DELETE removes. Together these four actions are CRUD — Create, Read, Update, Delete.',
          },
        },
      },
      {
        id: 'l1-4', title: 'Status Codes', xp: 15,
        data: {
          type: 'interactive',
          explore: {
            prompt: 'Ask the server for different things. Some exist, some don\'t — watch the status code it sends back.',
            deviceEmoji: '💻', deviceLabel: 'Client',
            serviceEmoji: '🗄️', serviceLabel: 'Server',
            emptyDisplay: 'no request yet',
            queries: [
              { id: 'u1',    label: 'User #1 (exists)',    request: 'GET /users/1',   response: '200 { "name": "Mai" }', display: '200 ✅', tone: 'good' },
              { id: 'u999',  label: 'User #999 (missing)', request: 'GET /users/999', response: '404 Not Found',         display: '404 ❓', tone: 'bad' },
              { id: 'about', label: 'Page /about',         request: 'GET /about',     response: '200 OK',                display: '200 ✅', tone: 'good' },
              { id: 'typo',  label: 'Page /abuot (typo)',  request: 'GET /abuot',     response: '404 Not Found',         display: '404 ❓', tone: 'bad' },
            ],
            hint: 'Things that exist → 200. Things that don\'t → 404.',
          },
          insight: {
            title: 'The server always answers with a code',
            body: 'Every response carries a status code telling you how it went. 404 Not Found means the server looked but the resource isn\'t there. Codes come in families by their first digit.',
            terms: [
              { term: '2xx', def: 'success — it worked' },
              { term: '3xx', def: 'redirect — look elsewhere' },
              { term: '4xx', def: 'client error — your request was wrong (e.g. 404)' },
              { term: '5xx', def: 'server error — the server failed' },
            ],
          },
          check: {
            mode: 'predict',
            prompt: 'Predict the status code the server returns for each request.',
            intro: 'Things that exist come back 200; things that don\'t come back 404.',
            expectedOptions: ['200 ✅', '404 ❓'],
            rows: [
              { id: 'r1', request: 'GET /users/1 · exists',    actual: '200 ✅' },
              { id: 'r2', request: 'GET /users/999 · missing', actual: '404 ❓' },
              { id: 'r3', request: 'GET /about · exists',      actual: '200 ✅' },
              { id: 'r4', request: 'GET /abuot · typo',        actual: '404 ❓' },
            ],
            explanation: '404 Not Found means the server looked but the resource isn\'t there. Existing resources return 200 (success). Families: 2xx success, 3xx redirect, 4xx client error, 5xx server error.',
          },
        },
      },
    ],
  },

  // ─────────────────────────────────────────── MODULE 2
  {
    id: 'mod2',
    title: 'HTTP Methods & Status Codes',
    subtitle: 'Methods, families & mapping',
    outcome: 'Pick the right method and read status codes (200, 404, 500).',
    accent: '#8B5CF6',
    accentLight: '#EDE9FE',
    nodeColor: ['#8B5CF6', '#A78BFA'],
    lessons: [
      {
        id: 'l2-1', title: 'GET, POST, PUT, DELETE', xp: 10,
        data: {
          type: 'interactive',
          explore: {
            prompt: 'Some methods only look; others change the data. Tap each and notice which one leaves the server untouched.',
            deviceEmoji: '💻', deviceLabel: 'Client',
            serviceEmoji: '🗄️', serviceLabel: 'Server', serviceSub: 'users: 1',
            emptyDisplay: 'idle',
            queries: [
              { id: 'get',    label: 'GET',    request: 'GET /users',      response: '200 OK · read-only',   display: '🔒 safe', tone: 'good' },
              { id: 'post',   label: 'POST',   request: 'POST /users',     response: '201 · 1 row added',    display: '✏️ changed' },
              { id: 'put',    label: 'PUT',    request: 'PUT /users/1',    response: '200 · 1 row replaced', display: '✏️ changed' },
              { id: 'delete', label: 'DELETE', request: 'DELETE /users/1', response: '204 · 1 row removed',  display: '✏️ changed' },
            ],
            hint: 'Only one of them leaves the data exactly as it was.',
          },
          insight: {
            title: 'GET is "safe"',
            body: 'GET only reads — it never changes the server, so you can repeat it as often as you like. POST, PUT and DELETE all modify data. That read-only nature is what makes GET safe to retry or refresh.',
            terms: [
              { term: 'Safe (read-only)', def: 'GET — fetches data, no side effects' },
              { term: 'Changes data', def: 'POST creates, PUT replaces, DELETE removes' },
            ],
          },
          check: {
            mode: 'connect',
            prompt: 'Drag the job to the method that does it — safely.',
            source: { id: 'read', label: 'Read data · no changes', emoji: '🔒' },
            sourceEmptyLabel: '??',
            sourceFilledLabel: 'GET',
            targets: [
              { id: 'get', label: 'GET', sub: 'read', emoji: '📄' },
              { id: 'post', label: 'POST', sub: 'create', emoji: '➕' },
              { id: 'put', label: 'PUT', sub: 'replace', emoji: '✏️' },
              { id: 'delete', label: 'DELETE', sub: 'remove', emoji: '🗑️' },
            ],
            correctTargetId: 'get',
            reveal: { request: 'GET /users', response: '200 OK · read-only' },
            explanation: 'GET is read-only — it fetches data with no side effects. POST creates, PUT replaces an existing resource entirely, DELETE removes it.',
          },
        },
      },
      {
        id: 'l2-2', title: 'Status Code Families', xp: 10,
        data: {
          type: 'interactive',
          explore: {
            prompt: 'Trigger different outcomes on the server and watch which status family comes back.',
            deviceEmoji: '💻', deviceLabel: 'Client',
            serviceEmoji: '🗄️', serviceLabel: 'Server',
            emptyDisplay: 'no request yet',
            queries: [
              { id: 'ok',      label: 'Normal request',       request: 'GET /products', response: '200 OK',                    display: '2xx ✅', tone: 'good' },
              { id: 'missing', label: 'Ask for missing page', request: 'GET /nope',     response: '404 Not Found',             display: '4xx ⚠️', tone: 'bad' },
              { id: 'auth',    label: 'No login',             request: 'GET /admin',    response: '401 Unauthorized',          display: '4xx ⚠️', tone: 'bad' },
              { id: 'crash',   label: 'Trigger a server bug', request: 'GET /crash',    response: '500 Internal Server Error', display: '5xx 💥', tone: 'bad' },
            ],
            hint: 'Watch the first digit — it tells you whose fault it is.',
          },
          insight: {
            title: 'Status codes group into families',
            body: 'The first digit tells the story: 2xx the request succeeded, 3xx go look elsewhere, 4xx you did something wrong, 5xx the server itself failed. So a bug that crashes the server returns a 5xx.',
            terms: [
              { term: '2xx', def: 'success' },
              { term: '4xx', def: 'client error — your fault' },
              { term: '5xx', def: 'server error — the server\'s fault' },
            ],
          },
          check: {
            mode: 'connect',
            prompt: 'The server crashed handling your request. Drag it to the family it returns.',
            source: { id: 'bug', label: 'Server bug', emoji: '💥' },
            sourceEmptyLabel: '?xx',
            sourceFilledLabel: '5xx',
            targets: [
              { id: 's2', label: '2xx', sub: 'success', emoji: '✅' },
              { id: 's4', label: '4xx', sub: 'your mistake', emoji: '🙅' },
              { id: 's5', label: '5xx', sub: 'server failed', emoji: '💥' },
            ],
            correctTargetId: 's5',
            reveal: { request: 'GET /crash', response: '500 Internal Server Error' },
            explanation: '5xx codes signal server-side errors — problems the server encountered that are not the client\'s fault. 4xx means YOU did something wrong; 2xx means everything went fine.',
          },
        },
      },
      {
        id: 'l2-3', title: 'Status Code Meanings', xp: 15,
        data: {
          type: 'fill-blank',
          instruction: 'Fill in the blanks with the correct status code family.',
          template: '____ means success, ____ means the client did something wrong, and ____ means the server failed.',
          blanks: ['2xx', '4xx', '5xx'],
          wordBank: ['2xx', '4xx', '5xx', '3xx'],
          explanation: '2xx (200 OK, 201 Created) = success. 4xx (400 Bad Request, 404 Not Found) = client error. 5xx (500 Internal Server Error) = server error.',
        },
      },
      {
        id: 'l2-4', title: 'Method Matcher', xp: 20,
        data: {
          type: 'drag-categorize',
          instruction: 'Drag each action into the correct HTTP method bucket.',
          buckets: ['GET', 'POST', 'PUT', 'DELETE'],
          cards: [
            { id: 'c1', text: 'Fetch a list of products',        correctBucket: 'GET'    },
            { id: 'c2', text: 'Create a new blog post',          correctBucket: 'POST'   },
            { id: 'c3', text: "Replace a user's entire profile", correctBucket: 'PUT'    },
            { id: 'c4', text: 'Remove a comment',               correctBucket: 'DELETE' },
            { id: 'c5', text: 'Load a profile to display',       correctBucket: 'GET'    },
            { id: 'c6', text: 'Submit a new order',              correctBucket: 'POST'   },
          ],
          explanation: 'GET = read (safe, no side effects). POST = create. PUT = replace/update. DELETE = remove. These map directly to CRUD.',
        },
      },
      {
        id: 'l2-5', title: 'CRUD Lifecycle', xp: 20,
        data: {
          type: 'drag-order',
          instruction: 'Arrange the CRUD lifecycle steps in the correct order.',
          items: [
            { id: 'o1', text: 'POST — Create a new resource',  badge: '1st' },
            { id: 'o2', text: 'GET — Read the resource',       badge: '2nd' },
            { id: 'o3', text: 'PUT — Update the resource',     badge: '3rd' },
            { id: 'o4', text: 'DELETE — Remove the resource',  badge: '4th' },
          ],
          explanation: 'CRUD in order: Create (POST) → Read (GET) → Update (PUT) → Delete (DELETE). Understanding this helps you map any business action to an HTTP method.',
        },
      },
    ],
  },

  // ─────────────────────────────────────────── MODULE 3
  {
    id: 'mod3',
    title: 'Practice with Requests',
    subtitle: 'Headers, body & your first request',
    outcome: 'Send real requests with headers, a JSON body, and auth.',
    accent: '#10B981',
    accentLight: '#D1FAE5',
    nodeColor: ['#10B981', '#34D399'],
    lessons: [
      {
        id: 'l3-1', title: 'Headers & Body', xp: 10,
        data: {
          type: 'fill-blank',
          template: '____ carry extra information about the request, while the ____ carries the actual data you send.',
          blanks: ['Headers', 'body'],
          wordBank: ['Headers', 'body', 'URL', 'method'],
          explanation: 'Headers are key-value metadata pairs (e.g. Content-Type, Authorization). The body is the payload — usually JSON — sent with POST, PUT, or PATCH requests.',
        },
      },
      {
        id: 'l3-2', title: 'Content-Type Header', xp: 10,
        data: {
          type: 'fill-blank',
          instruction: 'Choose the correct value.',
          template: 'To tell the server you\'re sending JSON, set Content-Type to ____.',
          blanks: ['application/json'],
          wordBank: ['application/json', 'text/html', 'text/plain', 'multipart/form-data'],
          explanation: 'Content-Type: application/json tells the server to parse the body as JSON. Without it, the server may misinterpret your data.',
        },
      },
      {
        id: 'l3-3', title: 'Send Your First GET', xp: 15,
        data: {
          type: 'postman',
          task: 'Send a GET request to fetch the user with ID 1.',
          method: 'GET',
          url: 'https://api.example.com/users/1',
          headers: [],
          showBody: false,
          successResponse: {
            status: 200,
            statusText: 'OK',
            body: '{\n  "id": 1,\n  "name": "Ada Lovelace",\n  "role": "admin"\n}',
          },
          explanation: 'GET /users/1 fetches the user whose ID is 1. The server returns 200 OK with JSON. GET requests have no body — the resource is identified by the URL alone.',
        },
      },
      {
        id: 'l3-4', title: 'POST with a JSON Body', xp: 20,
        data: {
          type: 'postman',
          task: 'Create a new user by sending a POST request with a JSON body.',
          method: 'POST',
          url: 'https://api.example.com/users',
          headers: [{ key: 'Content-Type', value: 'application/json', locked: true }],
          showBody: true,
          body: '{\n  "name": "Grace Hopper",\n  "role": "editor"\n}',
          successResponse: {
            status: 201,
            statusText: 'Created',
            body: '{\n  "id": 7,\n  "name": "Grace Hopper",\n  "role": "editor"\n}',
          },
          explanation: 'POST /users with a JSON body creates a new user. The server responds with 201 Created and returns the new resource — including its assigned ID.',
        },
      },
      {
        id: 'l3-5', title: 'API Authentication', xp: 15,
        data: {
          type: 'fill-blank',
          template: 'Send a token in the ____ header, like: Authorization: Bearer <token>.',
          blanks: ['Authorization'],
          wordBank: ['Authorization', 'Content-Type', 'Accept', 'Cache-Control'],
          explanation: 'The Authorization header carries your credentials. The "Bearer" scheme is used for token-based auth (e.g. JWT). Without a valid token, the server returns 401 Unauthorized.',
        },
      },
    ],
  },

  // ─────────────────────────────────────────── MODULE 4
  {
    id: 'mod4',
    title: 'Real-world API Testing',
    subtitle: 'Test cases, debugging & assertions',
    outcome: 'Write test cases (expected vs actual) and debug failing requests.',
    accent: '#F59E0B',
    accentLight: '#FEF3C7',
    nodeColor: ['#F59E0B', '#FCD34D'],
    lessons: [
      {
        id: 'l4-1', title: 'What is a Test Case?', xp: 10,
        data: {
          type: 'interactive',
          explore: {
            prompt: 'You write the test. For each request, pick what you EXPECT — then run it and see if it passes.',
            deviceEmoji: '🧪', deviceLabel: 'Test Runner',
            serviceEmoji: '🛰️', serviceLabel: 'API',
            emptyDisplay: 'no tests run',
            predict: {
              intro: 'A test passes only when your expected result matches what actually comes back.',
              expectedOptions: ['200 OK', '404 Not Found'],
              rows: [
                { id: 'r1', request: 'GET /users/1',   actual: '200 OK' },
                { id: 'r2', request: 'GET /users/999', actual: '404 Not Found' },
                { id: 'r3', request: 'GET /products',  actual: '200 OK' },
              ],
            },
            hint: 'Try guessing wrong on purpose — watch it FAIL.',
          },
          insight: {
            title: 'A test case = input + expected, vs actual',
            body: 'Each test you ran had an input (the request), an expected result (what you predicted), and an actual result (what the API really returned). If expected matches actual it PASSES; if not, you\'ve found a bug.',
            terms: [
              { term: 'Input', def: 'what you send (the request)' },
              { term: 'Expected', def: 'what you predict you\'ll get back' },
              { term: 'Actual', def: 'what really came back — compared to expected' },
            ],
          },
          check: {
            mode: 'connect',
            prompt: 'Drag “test case” to what it actually is.',
            source: { id: 'tc', label: 'Test case', emoji: '🧪' },
            sourceEmptyLabel: '= ?',
            sourceFilledLabel: 'input + expected',
            targets: [
              { id: 'def', label: 'Input + expected result', sub: 'to verify behavior', emoji: '✅' },
              { id: 'code', label: 'Code that sends requests', sub: 'automation', emoji: '⚙️' },
              { id: 'list', label: 'A list of endpoints', sub: 'inventory', emoji: '📜' },
            ],
            correctTargetId: 'def',
            reveal: { request: 'expected: 200', response: 'actual: 200 · PASS' },
            explanation: 'A test case defines what you send (input), what you expect back (expected result), then compares against what actually happened. If expected === actual, the test passes.',
          },
        },
      },
      {
        id: 'l4-2', title: 'Test Case Parts', xp: 15,
        data: {
          type: 'fill-blank',
          template: 'A test case has three parts: the ____ (what you send), the ____ result (what you expect), and the ____ result (what really happened).',
          blanks: ['input', 'expected', 'actual'],
          wordBank: ['input', 'expected', 'actual', 'output', 'random'],
          explanation: 'Input → Expected → Actual is the core loop of every test. You define what to send, declare the expected response, run the request, and compare. Any mismatch is a bug.',
        },
      },
      {
        id: 'l4-3', title: 'Debug a Failing Request', xp: 25,
        data: {
          type: 'postman',
          task: 'This request returns 401 Unauthorized. Add the missing Authorization header and re-send to fix it.',
          method: 'GET',
          url: 'https://api.example.com/profile',
          headers: [],
          showBody: false,
          debugMode: true,
          debugHint: 'Missing Authorization header — add it with a Bearer token.',
          initialFailResponse: {
            status: 401,
            statusText: 'Unauthorized',
            body: '{\n  "error": "Missing or invalid Authorization header."\n}',
          },
          requiredHeaders: [{ key: 'Authorization', value: 'Bearer <token>' }],
          successResponse: {
            status: 200,
            statusText: 'OK',
            body: '{\n  "id": 1,\n  "name": "Minh Nhat",\n  "role": "admin"\n}',
          },
          explanation: '401 Unauthorized means your request is missing valid credentials. Always include "Authorization: Bearer <your_token>" when calling protected endpoints.',
        },
      },
      {
        id: 'l4-4', title: 'PASS or FAIL?', xp: 20,
        data: {
          type: 'drag-categorize',
          instruction: 'Categorize each test result as PASS or FAIL.',
          buckets: ['PASS', 'FAIL'],
          cards: [
            { id: 't1', text: 'Expected 200, Got 200',            correctBucket: 'PASS' },
            { id: 't2', text: "Expected name 'Ada', Got 'Ada'",   correctBucket: 'PASS' },
            { id: 't3', text: 'Expected 200, Got 500',            correctBucket: 'FAIL' },
            { id: 't4', text: 'Expected id 1, Got id 2',          correctBucket: 'FAIL' },
            { id: 't5', text: 'Expected 201, Got 400',            correctBucket: 'FAIL' },
            { id: 't6', text: "Expected role 'admin', Got 'admin'", correctBucket: 'PASS' },
          ],
          explanation: 'A test PASSES when the actual response exactly matches expected (status code, values, types). Any mismatch — wrong status, wrong value — is a FAIL.',
        },
      },
    ],
  },
];

export const USER_NAME   = 'Minh Nhat';
export const USER_STREAK = 15;
export const USER_XP     = 340;
