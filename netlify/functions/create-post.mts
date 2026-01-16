import type { Context, Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

const AUTHORIZED_EMAIL = "dssilmmain@gmail.com";

async function verifyAuth(req: Request, context: Context): Promise<{ authorized: boolean; email?: string; error?: string }> {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { authorized: false, error: "No authorization token provided" };
  }

  const clientContext = context.clientContext;

  if (!clientContext || !clientContext.user) {
    return { authorized: false, error: "Invalid authentication" };
  }

  const userEmail = clientContext.user.email;

  if (!userEmail || userEmail.toLowerCase() !== AUTHORIZED_EMAIL.toLowerCase()) {
    return { authorized: false, error: "Unauthorized user" };
  }

  return { authorized: true, email: userEmail };
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const auth = await verifyAuth(req, context);

  if (!auth.authorized) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { title, description, date, content } = body;

    if (!title || !content || !date) {
      return new Response(JSON.stringify({ error: "Title, content, and date are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const slug = generateSlug(title);
    const store = getStore("blog-posts");

    // Check if a post with this slug already exists
    const existingPost = await store.get(slug);
    if (existingPost) {
      return new Response(JSON.stringify({ error: "A post with this title already exists" }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    const postData = {
      title,
      description: description || "",
      date,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await store.setJSON(slug, postData);

    return new Response(JSON.stringify({ success: true, slug }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating post:", error);
    return new Response(JSON.stringify({ error: "Failed to create post" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const config: Config = {
  path: "/.netlify/functions/create-post",
};
