import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import {
  getOAuthRedirectUrl,
  exchangeCodeForSessionToken,
  authMiddleware,
  deleteSession,
  MOCHA_SESSION_TOKEN_COOKIE_NAME,
} from "@getmocha/users-service/backend";
import { z } from "zod";
import OpenAI from "openai";

const app = new Hono<{ Bindings: Env }>();

// OAuth endpoints
app.get("/api/oauth/google/redirect_url", async (c) => {
  const redirectUrl = await getOAuthRedirectUrl("google", {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  return c.json({ redirectUrl }, 200);
});

app.post("/api/sessions", async (c) => {
  const body = await c.req.json();

  if (!body.code) {
    return c.json({ error: "No authorization code provided" }, 400);
  }

  const sessionToken = await exchangeCodeForSessionToken(body.code, {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 60 * 24 * 60 * 60,
  });

  return c.json({ success: true }, 200);
});

app.get("/api/users/me", authMiddleware, async (c) => {
  return c.json(c.get("user"));
});

app.get("/api/logout", async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);

  if (typeof sessionToken === "string") {
    await deleteSession(sessionToken, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
  }

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// Activity endpoints
const ActivitySchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  duration: z.number().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

app.get("/api/activities", authMiddleware, async (c) => {
  const user = c.get("user");
  const date = c.req.query("date");

  if (!date) {
    return c.json({ error: "Date parameter is required" }, 400);
  }

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM activities WHERE user_id = ? AND date = ? ORDER BY created_at ASC"
  )
    .bind(user!.id, date)
    .all();

  return c.json(results);
});

app.post("/api/activities", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();

  const parsed = ActivitySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid activity data" }, 400);
  }

  const { name, category, duration, date } = parsed.data;

  const result = await c.env.DB.prepare(
    "INSERT INTO activities (user_id, name, category, duration, date) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(user!.id, name, category, duration, date)
    .run();

  return c.json({ id: result.meta.last_row_id, ...parsed.data }, 201);
});

app.put("/api/activities/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const body = await c.req.json();

  const parsed = ActivitySchema.partial().safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid activity data" }, 400);
  }

  const activity = await c.env.DB.prepare(
    "SELECT * FROM activities WHERE id = ? AND user_id = ?"
  )
    .bind(id, user!.id)
    .first();

  if (!activity) {
    return c.json({ error: "Activity not found" }, 404);
  }

  const updates: string[] = [];
  const values: (string | number)[] = [];

  if (parsed.data.name !== undefined) {
    updates.push("name = ?");
    values.push(parsed.data.name);
  }
  if (parsed.data.category !== undefined) {
    updates.push("category = ?");
    values.push(parsed.data.category);
  }
  if (parsed.data.duration !== undefined) {
    updates.push("duration = ?");
    values.push(parsed.data.duration);
  }
  if (parsed.data.date !== undefined) {
    updates.push("date = ?");
    values.push(parsed.data.date);
  }

  if (updates.length > 0) {
    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id, user!.id);

    await c.env.DB.prepare(
      `UPDATE activities SET ${updates.join(", ")} WHERE id = ? AND user_id = ?`
    )
      .bind(...values)
      .run();
  }

  return c.json({ success: true });
});

app.delete("/api/activities/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  await c.env.DB.prepare("DELETE FROM activities WHERE id = ? AND user_id = ?")
    .bind(id, user!.id)
    .run();

  return c.json({ success: true });
});

app.post("/api/mood", authMiddleware, async (c) => {
  const body = await c.req.json();
  const { activities } = body;

  if (!activities || activities.length === 0) {
    return c.json({ error: "No activities provided" }, 400);
  }

  try {
    const client = new OpenAI({
      apiKey: c.env.OPENAI_API_KEY,
    });

    const totalMinutes = activities.reduce((sum: number, a: any) => sum + a.duration, 0);
    const remainingMinutes = 1440 - totalMinutes;
    
    const list = activities
      .map((a: any) => `${a.name} (${a.duration} mins, ${a.category})`)
      .join(", ");

    const prompt = totalMinutes >= 1440
      ? `My completed day activities: ${list}.
Give a short friendly mood summary analyzing how well I spent my day + 3 helpful suggestions for tomorrow.
Make it positive and encouraging.`
      : `My activities so far today (${totalMinutes} minutes logged, ${remainingMinutes} minutes remaining): ${list}.
Give a short friendly analysis of how well I'm doing so far + 3 helpful suggestions for managing the rest of my day.
Make it positive and encouraging.`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that analyzes daily activities and provides encouraging feedback and suggestions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    return c.json({ mood: response.choices[0].message.content });
  } catch (error: any) {
    console.error("AI Error:", error);
    return c.json({ error: error.message || "AI request failed" }, 500);
  }
});

export default app;
