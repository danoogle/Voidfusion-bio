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
  const auth = await verifyAuth(req, context);

  if (!auth.authorized) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");

  if (!slug) {
    return new Response(JSON.stringify({ error: "Slug parameter is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const store = getStore("blog-posts");
    const post = await store.get(slug, { type: "json" });

    if (!post) {
      return new Response(JSON.stringify({ error: "Post not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ post: { slug, ...post } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching post:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch post" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const config: Config = {
  path: "/.netlify/functions/get-post",
};
