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

  if (req.method === 'GET') {
    // Get all posts with full data
    try {
      const files = fs.readdirSync(POSTS_PATH).filter((f) => /\.mdx?$/.test(f));
      const posts = files.map((filename) => {
        const filePath = path.join(POSTS_PATH, filename);
        const source = fs.readFileSync(filePath, 'utf8');
        const { content, data } = matter(source);
        const slug = filename.replace(/\.mdx?$/, '');

        return {
          slug,
          filename,
          title: data.title || 'Untitled',
          description: data.description || '',
          date: data.date || '',
          isPublic: data.isPublic !== false, // Default to public if not specified
          content,
        };
      });

      // Sort by date (newest first)
      posts.sort((a, b) => new Date(b.date) - new Date(a.date));

      return res.status(200).json(posts);
    } catch (error) {
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

      const filename = `${slug}.mdx`;
      const filePath = path.join(POSTS_PATH, filename);

      // Check if file already exists
      if (fs.existsSync(filePath)) {
        return res.status(400).json({ error: 'A post with this title already exists' });
      }

      const date = new Date().toISOString().split('T')[0];
      const frontmatter = {
        title,
        description: description || '',
        date,
        isPublic: isPublic !== false,
      };

      const fileContent = matter.stringify(content || '', frontmatter);
      fs.writeFileSync(filePath, fileContent);

      return res.status(201).json({
        slug,
        filename,
        ...frontmatter,
        content: content || '',
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create post' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
