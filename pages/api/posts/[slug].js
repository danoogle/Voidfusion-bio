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

  const { slug } = req.query;
  const store = getPostsStore();

  // Check if post exists
  const existingPost = await store.get(slug, { type: 'json' });
  if (!existingPost) {
    return res.status(404).json({ error: 'Post not found' });
  }

  if (req.method === 'GET') {
    // Get single post
    try {
      return res.status(200).json({
        slug,
        filename: `${slug}.mdx`,
        title: existingPost.title || 'Untitled',
        description: existingPost.description || '',
        date: existingPost.date || '',
        isPublic: existingPost.isPublic !== false,
        content: existingPost.content || '',
      });
    } catch (error) {
      console.error('Failed to fetch post:', error);
      return res.status(500).json({ error: 'Failed to fetch post' });
    }
  }

  if (req.method === 'PUT') {
    // Update post
    try {
      const { title, description, content, isPublic, date } = req.body;

      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      const postData = {
        ...existingPost,
        title,
        description: description || '',
        date: date || existingPost.date,
        isPublic: isPublic !== false,
        content: content || '',
      };

      await store.setJSON(slug, postData);

      return res.status(200).json({
        slug,
        filename: `${slug}.mdx`,
        ...postData,
      });
    } catch (error) {
      console.error('Failed to update post:', error);
      return res.status(500).json({ error: 'Failed to update post' });
    }
  }

  if (req.method === 'DELETE') {
    // Delete post
    try {
      await store.delete(slug);
      return res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
      console.error('Failed to delete post:', error);
      return res.status(500).json({ error: 'Failed to delete post' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
