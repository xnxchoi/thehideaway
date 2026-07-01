import { chromium } from "playwright";

const baseURL = process.env.BASE_URL || "http://localhost:3000";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

const consoleMessages = [];
const pageErrors = [];
const createdDocs = [];
const cleanupResults = [];

page.on("console", (message) => {
  const text = message.text();
  if (["error", "warning"].includes(message.type())) {
    consoleMessages.push({
      type: message.type(),
      text,
    });
  }
});

page.on("pageerror", (error) => {
  pageErrors.push(error.message);
});

const waitForSettled = async () => {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
};

const signInAsButler = async () => {
  await page.goto(`${baseURL}/sign-in`);
  await waitForSettled();

  const butlerButton = page.getByRole("button", { name: /sign in as butler/i });
  if ((await butlerButton.count()) > 0) {
    await butlerButton.click();
    await page
      .waitForURL(/\/me\/settings\/profile/, { timeout: 15_000 })
      .catch(() => {});
    await waitForSettled();
  }

  const url = page.url();
  if (url.includes("/sign-in")) {
    throw new Error("Butler sign-in did not leave /sign-in.");
  }
};

const readControlButtons = async () =>
  page.locator(".doc-controls button").evaluateAll((buttons) =>
    buttons.map((button) => {
      const rect = button.getBoundingClientRect();
      return {
        id: button.id || null,
        ariaLabel: button.getAttribute("aria-label"),
        title: button.getAttribute("title"),
        text: (button.textContent || "").trim().replace(/\s+/g, " "),
        disabled: button.disabled,
        rect: {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
      };
    }),
  );

const requestJSON = async (method, path, options = {}) => {
  const url = path.startsWith("http") ? path : `${baseURL}${path}`;
  const requestOptions = {
    headers: { accept: "application/json", ...(options.headers || {}) },
  };

  if (options.body !== undefined) {
    requestOptions.data = options.body;
  }

  const response = await page.request[method](url, requestOptions);
  const text = await response.text();

  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}

  return { json, response, text };
};

const lexicalText = (text) => ({
  root: {
    type: "root",
    format: "",
    indent: 0,
    version: 1,
    direction: "ltr",
    children: [
      {
        type: "paragraph",
        format: "",
        indent: 0,
        version: 1,
        direction: "ltr",
        textFormat: 0,
        textStyle: "",
        children: [
          {
            type: "text",
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text,
            version: 1,
          },
        ],
      },
    ],
  },
});

const getCurrentUser = async () => {
  const { json, response, text } = await requestJSON("get", "/api/users/me");
  const user = json?.user;

  if (!response.ok() || !user?.id) {
    throw new Error(
      `Could not resolve signed-in user (${response.status()}): ${text.slice(0, 300)}`,
    );
  }

  return user;
};

const getUncategorizedCategory = async () => {
  const path =
    "/api/categories?where[slug][equals]=uncategorized&limit=1&depth=0";
  const { json, response, text } = await requestJSON("get", path);
  const category = json?.docs?.[0];

  if (!response.ok() || !category?.id) {
    throw new Error(
      `Could not resolve uncategorized category (${response.status()}): ${text.slice(0, 300)}`,
    );
  }

  return category;
};

const createSmokeDoc = async (collection) => {
  const [user, category] = await Promise.all([
    getCurrentUser(),
    getUncategorizedCategory(),
  ]);
  const stamp = Date.now();
  const title = `Codex live preview smoke ${collection} ${stamp}`;
  const slug = `codex-live-preview-${collection}-${stamp}`;
  const body = {
    title,
    richTitle: lexicalText(title),
    content: lexicalText("Disposable draft used for admin live-preview QA."),
    slug,
    slugLock: true,
    author: user.id,
    category: category.id,
    meta: {
      title,
      description: "Disposable draft used for admin live-preview QA.",
    },
    _status: "draft",
  };

  if (collection === "posts") {
    body.subtitle = "Disposable live-preview QA draft";
  }

  if (collection === "surf") {
    body.source = "external";
  }

  const { json, response, text } = await requestJSON("post", `/api/${collection}`, {
    body,
  });
  const doc = json?.doc || json;

  if (!response.ok() || !doc?.id) {
    return {
      skipped: true,
      reason: `Could not create ${collection} smoke draft (${response.status()})`,
      apiBody: text.slice(0, 500),
    };
  }

  createdDocs.push({ collection, id: doc.id, slug });

  return {
    id: doc.id,
    slug: doc.slug || slug,
    createdForSmoke: true,
  };
};

const getFirstEditableDoc = async (collection) => {
  const url = new URL(`/api/${collection}`, baseURL);
  url.searchParams.set("limit", "5");
  url.searchParams.set("depth", "0");
  url.searchParams.set("sort", "-updatedAt");

  const response = await page.request.get(url.toString(), {
    headers: { accept: "application/json" },
  });
  const body = await response.text();

  if (!response.ok()) {
    return {
      skipped: true,
      reason: `API lookup failed with ${response.status()}`,
      apiBody: body.slice(0, 500),
    };
  }

  let json;
  try {
    json = JSON.parse(body);
  } catch (error) {
    return {
      skipped: true,
      reason: "API lookup did not return JSON",
      apiBody: body.slice(0, 500),
    };
  }

  const docs = Array.isArray(json.docs) ? json.docs : [];
  const doc = docs.find(
    (candidate) =>
      candidate?.id &&
      typeof candidate.slug === "string" &&
      candidate.slug.trim().length > 0,
  );

  if (!doc) {
    const created = await createSmokeDoc(collection);
    return { ...created, previousCount: docs.length };
  }

  if (doc.slug.startsWith("codex-live-preview-")) {
    createdDocs.push({ collection, id: doc.id, slug: doc.slug });
  }

  return {
    id: doc.id,
    slug: doc.slug,
    reusedSmokeDoc: doc.slug.startsWith("codex-live-preview-"),
  };
};

const cleanupSmokeDocs = async () => {
  while (createdDocs.length > 0) {
    const doc = createdDocs.pop();
    const { response, text } = await requestJSON(
      "delete",
      `/api/${doc.collection}/${doc.id}?depth=0`,
    );

    cleanupResults.push({
      collection: doc.collection,
      id: doc.id,
      slug: doc.slug,
      ok: response.ok(),
      status: response.status(),
      body: response.ok() ? undefined : text.slice(0, 300),
    });
  }

  return cleanupResults;
};


const readLivePreviewState = async () =>
  page.evaluate(() => {
    const windowEl = document.querySelector(".live-preview-window");
    const togglerEl = document.querySelector("#live-preview-toggler");
    const iframes = Array.from(document.querySelectorAll("iframe")).map(
      (iframe) => ({
        id: iframe.id || null,
        className: iframe.className || null,
        src: iframe.getAttribute("src"),
        title: iframe.getAttribute("title"),
      }),
    );

    return {
      windowClass: windowEl?.className || null,
      iframeCount: iframes.length,
      iframes,
      togglerClass: togglerEl?.className || null,
      togglerAriaLabel: togglerEl?.getAttribute("aria-label") || null,
      togglerTitle: togglerEl?.getAttribute("title") || null,
    };
  });

const inspectCollection = async (collection) => {
  const doc = await getFirstEditableDoc(collection);

  if (doc.skipped) {
    return {
      collection,
      skipped: true,
      reason: doc.reason,
      apiBody: doc.apiBody,
      count: doc.count,
    };
  }

  await page.goto(`${baseURL}/vault/collections/${collection}/${doc.id}`);
  await waitForSettled();
  await page.waitForSelector(".doc-controls", { timeout: 30_000 });
  await page.waitForTimeout(750);

  const beforeControls = await readControlButtons();
  const toggler = page.locator("#live-preview-toggler");
  let hasToggler = (await toggler.count()) > 0;
  let togglerAppearedAfterSave = false;

  if (!hasToggler) {
    const saveDraft = page.locator("#action-save-draft");

    if ((await saveDraft.count()) > 0) {
      await saveDraft.click();
      await page.waitForTimeout(2_500);
      hasToggler = (await toggler.count()) > 0;
      togglerAppearedAfterSave = hasToggler;
    }
  }

  let livePreview = null;
  if (hasToggler) {
    await toggler.click();
    await page
      .waitForSelector(".live-preview-window, iframe", {
        timeout: 15_000,
      })
      .catch(() => {});
    await page.waitForTimeout(1_000);
  }

  livePreview = await readLivePreviewState();

  return {
    collection,
    id: doc.id,
    slug: doc.slug,
    url: page.url(),
    title: await page.title(),
    hasLivePreviewToggler: hasToggler,
    togglerAppearedAfterSave,
    controls: beforeControls,
    livePreview,
  };
};

try {
  await signInAsButler();
  const results = [];
  for (const collection of ["posts", "surf"]) {
    results.push(await inspectCollection(collection));
  }
  await cleanupSmokeDocs();

  console.log(
    JSON.stringify(
      {
        ok: true,
        results,
        cleanupResults,
        consoleMessages,
        pageErrors,
      },
      null,
      2,
    ),
  );
} catch (error) {
  await cleanupSmokeDocs().catch((cleanupError) => {
    cleanupResults.push({
      ok: false,
      error:
        cleanupError instanceof Error
          ? cleanupError.message
          : String(cleanupError),
    });
  });

  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        cleanupResults,
        consoleMessages,
        pageErrors,
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
} finally {
  await browser.close();
}
