import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

const POSTS_PATH = path.join(process.cwd(), 'posts');

export default async function handler(req, res) {
  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { slug } = req.query;
  const filePath = path.join(POSTS_PATH, `${slug}.mdx`);

  // Check if post exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Post not found' });
  }

  if (req.method === 'GET') {
    // Get single post
    try {
      const source = fs.readFileSync(filePath, 'utf8');
      const { content, data } = matter(source);

      return res.status(200).json({
        slug,
        filename: `${slug}.mdx`,
        title: data.title || 'Untitled',
        description: data.description || '',
        date: data.date || '',
        isPublic: data.isPublic !== false,
        content,
      });
    } catch (error) {
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

      // Read existing post to preserve any additional frontmatter
      const source = fs.readFileSync(filePath, 'utf8');
      const { data: existingData } = matter(source);

      const frontmatter = {
        ...existingData,
        title,
        description: description || '',
        date: date || existingData.date,
        isPublic: isPublic !== false,
      };

      const fileContent = matter.stringify(content || '', frontmatter);
      fs.writeFileSync(filePath, fileContent);

      return res.status(200).json({
        slug,
        filename: `${slug}.mdx`,
        ...frontmatter,
        content: content || '',
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update post' });
    }
  }

  if (req.method === 'DELETE') {
    // Delete post
    try {
      fs.unlinkSync(filePath);
      return res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete post' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
