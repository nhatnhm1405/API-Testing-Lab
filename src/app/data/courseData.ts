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

export type LessonData = MCQData | FillBlankData | DragCategorizeData | DragOrderData | PostmanData;

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
  }
}

// ── Course data ───────────────────────────────────────────────────

export const MODULES: Module[] = [
  // ─────────────────────────────────────────── MODULE 1
  {
    id: 'mod1',
    title: 'What is an API?',
    subtitle: 'Core concepts',
    accent: '#3B82F6',
    accentLight: '#DBEAFE',
    nodeColor: ['#3B82F6', '#60A5FA'],
    lessons: [
      {
        id: 'l1-1', title: 'API Definition', xp: 10,
        data: {
          type: 'mcq',
          question: 'What does the acronym API stand for?',
          options: [
            'Application Programming Interface',
            'Advanced Program Integration',
            'Automated Process Interface',
            'Applied Programming Index',
          ],
          correctIndex: 0,
          explanation: 'API stands for Application Programming Interface — a set of rules and protocols that lets software applications talk to each other. Think of it like a restaurant menu: the API tells you what you can order and what you\'ll get.',
        },
      },
      {
        id: 'l1-2', title: 'APIs in the Wild', xp: 10,
        data: {
          type: 'mcq',
          question: 'When a weather app on your phone shows a forecast, how does it get that data?',
          options: [
            'It collects weather data on its own',
            'It calls a weather service API',
            'It reads from the phone\'s memory',
            'It prompts you to enter it manually',
          ],
          correctIndex: 1,
          explanation: 'The weather app calls an API from a service like OpenWeather. The API returns JSON data, and the app displays it for you. No self-collection or local storage needed!',
        },
      },
      {
        id: 'l1-3', title: 'HTTP Methods', xp: 15,
        data: {
          type: 'mcq',
          question: 'Which HTTP method is used to RETRIEVE data from a server?',
          options: ['POST', 'PUT', 'DELETE', 'GET'],
          correctIndex: 3,
          explanation: 'GET retrieves (reads) data from the server. POST creates new data, PUT updates it, DELETE removes it. Together these form CRUD: Create, Read, Update, Delete.',
        },
      },
      {
        id: 'l1-4', title: 'Status Codes', xp: 15,
        data: {
          type: 'mcq',
          question: 'A server returns status code 404. What does that mean?',
          options: [
            'Success! The request was processed.',
            'Not Found — the resource doesn\'t exist.',
            'Server Error — something went wrong on the server.',
            'Unauthorized — you need to log in.',
          ],
          correctIndex: 1,
          explanation: '404 Not Found means the server couldn\'t locate the resource. Families: 2xx = success, 3xx = redirect, 4xx = client error, 5xx = server error.',
        },
      },
    ],
  },

  // ─────────────────────────────────────────── MODULE 2
  {
    id: 'mod2',
    title: 'HTTP Methods & Status Codes',
    subtitle: 'Methods, families & mapping',
    accent: '#8B5CF6',
    accentLight: '#EDE9FE',
    nodeColor: ['#8B5CF6', '#A78BFA'],
    lessons: [
      {
        id: 'l2-1', title: 'GET, POST, PUT, DELETE', xp: 10,
        data: {
          type: 'mcq',
          question: 'Which HTTP method retrieves data without changing anything on the server?',
          options: ['GET', 'POST', 'PUT', 'DELETE'],
          correctIndex: 0,
          explanation: 'GET is read-only — it fetches data with no side effects. POST creates, PUT replaces an existing resource entirely, DELETE removes it.',
        },
      },
      {
        id: 'l2-2', title: 'Status Code Families', xp: 10,
        data: {
          type: 'mcq',
          question: 'The server hits an unexpected bug while handling your request. Which status code family does it return?',
          options: [
            '5xx — server error',
            '2xx — success',
            '3xx — redirection',
            '4xx — client error',
          ],
          correctIndex: 0,
          explanation: '5xx codes signal server-side errors — problems the server encountered that are not the client\'s fault. 4xx means YOU did something wrong; 2xx means everything went fine.',
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
    accent: '#F59E0B',
    accentLight: '#FEF3C7',
    nodeColor: ['#F59E0B', '#FCD34D'],
    lessons: [
      {
        id: 'l4-1', title: 'What is a Test Case?', xp: 10,
        data: {
          type: 'mcq',
          question: 'In essence, what is a test case?',
          options: [
            'A defined input plus the expected result, used to verify behavior.',
            'A piece of code that sends HTTP requests automatically.',
            'A list of all the API endpoints in a project.',
            'A script that generates random test data.',
          ],
          correctIndex: 0,
          explanation: 'A test case defines what you send (input), what you expect back (expected result), then compares against what actually happened. If expected === actual, the test passes.',
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
