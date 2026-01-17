import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { getStore } from '@netlify/blobs';

const POSTS_PATH = path.join(process.cwd(), 'posts');

async function migratePostsToBlobs() {
  console.log('Starting migration of posts to Netlify Blobs...');

  // Get the store
  const store = getStore({ name: 'posts', consistency: 'strong' });

  // Read all MDX files from the posts directory
  const files = fs.readdirSync(POSTS_PATH).filter((f) => /\.mdx?$/.test(f));

  console.log(`Found ${files.length} posts to migrate`);

  for (const filename of files) {
    const slug = filename.replace(/\.mdx?$/, '');
    const filePath = path.join(POSTS_PATH, filename);

    try {
      // Check if post already exists in blob store
      const existingPost = await store.get(slug, { type: 'json' });
      if (existingPost) {
        console.log(`Skipping ${slug} - already exists in blob store`);
        continue;
      }

      // Read the MDX file
      const source = fs.readFileSync(filePath, 'utf8');
      const { content, data } = matter(source);

      // Create post object
      const postData = {
        title: data.title || 'Untitled',
        description: data.description || '',
        date: data.date || '',
        isPublic: data.isPublic !== false,
        content: content,
      };

      // Save to blob store
      await store.setJSON(slug, postData);
      console.log(`Migrated: ${slug}`);
    } catch (error) {
      console.error(`Failed to migrate ${slug}:`, error);
    }
  }

  console.log('Migration complete!');
}

// Run migration
migratePostsToBlobs().catch(console.error);
