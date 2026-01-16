import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../lib/auth';
import fs from 'fs';
import path from 'path';

const POSTS_PATH = path.join(process.cwd(), 'posts');

export default async function handler(req, res) {
  // Check authentication
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    // Get all posts
    try {
      const files = fs.readdirSync(POSTS_PATH).filter(f => /\.mdx?$/.test(f));
      const posts = files.map(filename => {
        const content = fs.readFileSync(path.join(POSTS_PATH, filename), 'utf8');
        return {
          filename,
          slug: filename.replace(/\.mdx?$/, ''),
          content,
        };
      });
      return res.status(200).json(posts);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to read posts' });
    }
  }

  if (req.method === 'POST') {
    // Create a new post
    const { slug, title, description, content } = req.body;

    if (!slug || !title) {
      return res.status(400).json({ error: 'Slug and title are required' });
    }

    const filename = `${slug}.mdx`;
    const filepath = path.join(POSTS_PATH, filename);

    // Check if file already exists
    if (fs.existsSync(filepath)) {
      return res.status(400).json({ error: 'A post with this slug already exists' });
    }

    const date = new Date().toISOString().split('T')[0];
    const postContent = `---
title: "${title}"
description: "${description || ''}"
date: "${date}"
---

${content || ''}
`;

    try {
      fs.writeFileSync(filepath, postContent);
      return res.status(201).json({ message: 'Post created', slug });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create post' });
    }
  }

  if (req.method === 'PUT') {
    // Update an existing post
    const { slug, content } = req.body;

    if (!slug || !content) {
      return res.status(400).json({ error: 'Slug and content are required' });
    }

    const filename = `${slug}.mdx`;
    const filepath = path.join(POSTS_PATH, filename);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'Post not found' });
    }

    try {
      fs.writeFileSync(filepath, content);
      return res.status(200).json({ message: 'Post updated', slug });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update post' });
    }
  }

  if (req.method === 'DELETE') {
    // Delete a post
    const { slug } = req.body;

    if (!slug) {
      return res.status(400).json({ error: 'Slug is required' });
    }

    const filename = `${slug}.mdx`;
    const filepath = path.join(POSTS_PATH, filename);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'Post not found' });
    }

    try {
      fs.unlinkSync(filepath);
      return res.status(200).json({ message: 'Post deleted', slug });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete post' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
