import { getStore } from '@netlify/blobs';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

// Helper to get posts store with strong consistency for admin operations
function getPostsStore() {
  return getStore({ name: 'posts', consistency: 'strong' });
}

export default async function handler(req, res) {
  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const store = getPostsStore();

  if (req.method === 'GET') {
    // Get all posts with full data
    try {
      const { blobs } = await store.list();

      const posts = await Promise.all(
        blobs.map(async (blob) => {
          const post = await store.get(blob.key, { type: 'json' });
          if (!post) return null;
          return {
            slug: blob.key,
            filename: `${blob.key}.mdx`,
            title: post.title || 'Untitled',
            description: post.description || '',
            date: post.date || '',
            isPublic: post.isPublic !== false,
            content: post.content || '',
          };
        })
      );

      // Filter out any null values and sort by date (newest first)
      const validPosts = posts.filter(Boolean);
      validPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

      return res.status(200).json(validPosts);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      return res.status(500).json({ error: 'Failed to fetch posts' });
    }
  }

  if (req.method === 'POST') {
    // Create new post
    try {
      const { title, description, content, isPublic } = req.body;

      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      // Generate slug from title
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Check if post already exists
      const existingPost = await store.get(slug, { type: 'json' });
      if (existingPost) {
        return res.status(400).json({ error: 'A post with this title already exists' });
      }

      const date = new Date().toISOString().split('T')[0];
      const postData = {
        title,
        description: description || '',
        date,
        isPublic: isPublic !== false,
        content: content || '',
      };

      await store.setJSON(slug, postData);

      return res.status(201).json({
        slug,
        filename: `${slug}.mdx`,
        ...postData,
      });
    } catch (error) {
      console.error('Failed to create post:', error);
      return res.status(500).json({ error: 'Failed to create post' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
