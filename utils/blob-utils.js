import { getStore } from "@netlify/blobs";

export async function getBlobPosts() {
  try {
    const store = getStore("blog-posts");
    const { blobs } = await store.list();

    const posts = await Promise.all(
      blobs.map(async (blob) => {
        const post = await store.get(blob.key, { type: "json" });
        return {
          slug: blob.key,
          filePath: `${blob.key}.mdx`, // For compatibility with existing code
          content: post.content,
          data: {
            title: post.title,
            description: post.description,
            date: post.date,
          },
        };
      })
    );

    return posts;
  } catch (error) {
    console.error("Error fetching blob posts:", error);
    return [];
  }
}

export async function getBlobPostBySlug(slug) {
  try {
    const store = getStore("blog-posts");
    const post = await store.get(slug, { type: "json" });

    if (!post) {
      return null;
    }

    return {
      content: post.content,
      data: {
        title: post.title,
        description: post.description,
        date: post.date,
      },
    };
  } catch (error) {
    console.error("Error fetching blob post:", error);
    return null;
  }
}
