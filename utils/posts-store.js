import { getStore } from '@netlify/blobs';

// Helper to get posts store
export function getPostsStore(options = {}) {
  const { consistency = 'eventual' } = options;
  return getStore({ name: 'posts', consistency });
}

// Get all posts from Netlify Blobs
export async function getPostsFromStore(options = {}) {
  const { includePrivate = false, consistency = 'eventual' } = options;
  const store = getPostsStore({ consistency });

  try {
    const { blobs } = await store.list();

    const posts = await Promise.all(
      blobs.map(async (blob) => {
        const post = await store.get(blob.key, { type: 'json' });
        if (!post) return null;
        return {
          slug: blob.key,
          filePath: `${blob.key}.mdx`,
          content: post.content || '',
          data: {
            title: post.title || 'Untitled',
            description: post.description || '',
            date: post.date || '',
            isPublic: post.isPublic !== false,
          },
        };
      })
    );

    // Filter out nulls and optionally private posts
    let validPosts = posts.filter(Boolean);
    if (!includePrivate) {
      validPosts = validPosts.filter((post) => post.data.isPublic !== false);
    }

    // Sort by date (newest first)
    validPosts.sort((a, b) => new Date(b.data.date) - new Date(a.data.date));

    return validPosts;
  } catch (error) {
    console.error('Failed to fetch posts from store:', error);
    return [];
  }
}

// Get a single post from Netlify Blobs
export async function getPostFromStore(slug, options = {}) {
  const { consistency = 'eventual' } = options;
  const store = getPostsStore({ consistency });

  try {
    const post = await store.get(slug, { type: 'json' });
    if (!post) return null;

    return {
      slug,
      filePath: `${slug}.mdx`,
      content: post.content || '',
      data: {
        title: post.title || 'Untitled',
        description: post.description || '',
        date: post.date || '',
        isPublic: post.isPublic !== false,
      },
    };
  } catch (error) {
    console.error(`Failed to fetch post ${slug} from store:`, error);
    return null;
  }
}
