import type { Context, Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

const AUTHORIZED_EMAIL = "dssilmmain@gmail.com";

async function verifyAuth(req: Request, context: Context): Promise<{ authorized: boolean; email?: string; error?: string }> {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { authorized: false, error: "No authorization token provided" };
  }

  // Extract user info from the Netlify Identity context
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

  try {
    const store = getStore("blog-posts");
    const { blobs } = await store.list();

    const posts = await Promise.all(
      blobs.map(async (blob) => {
        const post = await store.get(blob.key, { type: "json" });
        return {
          slug: blob.key,
          ...post,
        };
      })
    );

    // Sort by date descending
    posts.sort((a, b) => {
      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);
      return dateB.getTime() - dateA.getTime();
    });

    return new Response(JSON.stringify({ posts }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch posts" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const config: Config = {
  path: "/.netlify/functions/get-posts",
};
