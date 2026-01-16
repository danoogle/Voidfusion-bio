import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout, { GradientBackground } from '../components/Layout';
import SEO from '../components/SEO';
import { getGlobalData } from '../utils/global-data';
import Link from 'next/link';

export default function Admin({ globalData }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewPost, setShowNewPost] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [newPost, setNewPost] = useState({ slug: '', title: '', description: '', content: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchPosts();
    }
  }, [session]);

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/posts');
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPost),
      });

      if (res.ok) {
        showMessage('Post created successfully!');
        setNewPost({ slug: '', title: '', description: '', content: '' });
        setShowNewPost(false);
        fetchPosts();
      } else {
        const data = await res.json();
        showMessage(data.error || 'Failed to create post', 'error');
      }
    } catch (error) {
      showMessage('Failed to create post', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePost = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/posts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: editingPost.slug,
          content: editingPost.content,
        }),
      });

      if (res.ok) {
        showMessage('Post updated successfully!');
        setEditingPost(null);
        fetchPosts();
      } else {
        const data = await res.json();
        showMessage(data.error || 'Failed to update post', 'error');
      }
    } catch (error) {
      showMessage('Failed to update post', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePost = async (slug) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const res = await fetch('/api/posts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });

      if (res.ok) {
        showMessage('Post deleted successfully!');
        fetchPosts();
      } else {
        const data = await res.json();
        showMessage(data.error || 'Failed to delete post', 'error');
      }
    } catch (error) {
      showMessage('Failed to delete post', 'error');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <Layout>
        <SEO title="Admin" description="Blog admin panel" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-xl">Loading...</div>
        </div>
        <GradientBackground
          variant="large"
          className="fixed top-20 opacity-40 dark:opacity-60"
        />
      </Layout>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <Layout>
      <SEO title="Admin" description="Blog admin panel" />
      <main className="w-full px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Blog Admin</h1>
            <p className="opacity-60 mt-1">Welcome, {session.user?.name || session.user?.email}</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/"
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              View Blog
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'error'
                ? 'bg-red-500/20 border border-red-500/50'
                : 'bg-green-500/20 border border-green-500/50'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* New Post Button / Form */}
        {!showNewPost && !editingPost && (
          <button
            onClick={() => setShowNewPost(true)}
            className="mb-6 px-6 py-3 rounded-lg bg-primary/20 hover:bg-primary/30 transition-colors font-semibold"
          >
            + Create New Post
          </button>
        )}

        {/* New Post Form */}
        {showNewPost && (
          <div className="mb-8 p-6 rounded-xl bg-white/10 backdrop-blur-lg border border-gray-800/10 dark:bg-black/30 dark:border-white/10">
            <h2 className="text-xl font-bold mb-4">Create New Post</h2>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Slug (URL path)</label>
                <input
                  type="text"
                  value={newPost.slug}
                  onChange={(e) => setNewPost({ ...newPost, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                  placeholder="my-new-post"
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-gray-800/20 dark:border-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  placeholder="My New Post"
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-gray-800/20 dark:border-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input
                  type="text"
                  value={newPost.description}
                  onChange={(e) => setNewPost({ ...newPost, description: e.target.value })}
                  placeholder="A brief description of the post"
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-gray-800/20 dark:border-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Content (MDX)</label>
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  placeholder="Write your post content in MDX format..."
                  rows={10}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-gray-800/20 dark:border-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-sm"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 transition-colors font-semibold disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Post'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewPost(false);
                    setNewPost({ slug: '', title: '', description: '', content: '' });
                  }}
                  className="px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Edit Post Form */}
        {editingPost && (
          <div className="mb-8 p-6 rounded-xl bg-white/10 backdrop-blur-lg border border-gray-800/10 dark:bg-black/30 dark:border-white/10">
            <h2 className="text-xl font-bold mb-4">Edit Post: {editingPost.slug}</h2>
            <form onSubmit={handleUpdatePost} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Content (MDX with frontmatter)</label>
                <textarea
                  value={editingPost.content}
                  onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                  rows={20}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-gray-800/20 dark:border-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-sm"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 transition-colors font-semibold disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingPost(null)}
                  className="px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Posts List */}
        {!showNewPost && !editingPost && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Posts ({posts.length})</h2>
            {posts.length === 0 ? (
              <p className="opacity-60">No posts yet. Create your first post!</p>
            ) : (
              <ul className="space-y-3">
                {posts.map((post) => (
                  <li
                    key={post.slug}
                    className="p-4 rounded-lg bg-white/10 backdrop-blur-lg border border-gray-800/10 dark:bg-black/30 dark:border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                  >
                    <div>
                      <h3 className="font-semibold">{post.slug}</h3>
                      <p className="text-sm opacity-60">{post.filename}</p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/posts/${post.slug}`}
                        className="px-3 py-1 text-sm rounded bg-white/10 hover:bg-white/20 transition-colors"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => setEditingPost(post)}
                        className="px-3 py-1 text-sm rounded bg-blue-500/20 hover:bg-blue-500/30 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeletePost(post.slug)}
                        className="px-3 py-1 text-sm rounded bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </main>
      <GradientBackground
        variant="large"
        className="fixed top-20 opacity-40 dark:opacity-60"
      />
      <GradientBackground
        variant="small"
        className="absolute bottom-0 opacity-20 dark:opacity-10"
      />
    </Layout>
  );
}

export function getStaticProps() {
  const globalData = getGlobalData();
  return { props: { globalData } };
}
