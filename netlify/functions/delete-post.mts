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

export default async (req: Request, context: Context) => {
  if (req.method !== "DELETE") {
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
    const { slug } = body;

    if (!slug) {
      return new Response(JSON.stringify({ error: "Slug is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const store = getStore("blog-posts");
    await store.delete(slug);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error deleting post:", error);
    return new Response(JSON.stringify({ error: "Failed to delete post" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const config: Config = {
  path: "/.netlify/functions/delete-post",
};
