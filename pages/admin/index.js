import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout, { GradientBackground } from '../../components/Layout';
import SEO from '../../components/SEO';
import Link from 'next/link';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchPosts();
    }
  }, [session]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/posts');
      if (!res.ok) throw new Error('Failed to fetch posts');
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = async (slug, currentStatus) => {
    try {
      const post = posts.find((p) => p.slug === slug);
      const res = await fetch(`/api/posts/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...post,
          isPublic: !currentStatus,
        }),
      });

      if (!res.ok) throw new Error('Failed to update post');

      // Update local state
      setPosts(posts.map((p) =>
        p.slug === slug ? { ...p, isPublic: !currentStatus } : p
      ));
    } catch (err) {
      alert('Failed to update post visibility');
    }
  };

  const deletePost = async (slug) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const res = await fetch(`/api/posts/${slug}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete post');

      // Remove from local state
      setPosts(posts.filter((p) => p.slug !== slug));
    } catch (err) {
      alert('Failed to delete post');
    }
  };

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <Layout>
        <SEO title="Admin Dashboard" />
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </Layout>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <Layout>
      <SEO title="Admin Dashboard" />
      <GradientBackground
        variant="large"
        className="fixed top-20 opacity-40 dark:opacity-60"
      />
      <main className="w-full px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Signed in as {session.user.email}
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/admin/new"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                New Post
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/admin/login' })}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Posts Table */}
          <div className="backdrop-blur-lg bg-white/30 dark:bg-black/30 rounded-2xl shadow-lg border border-gray-200/20 dark:border-gray-700/30 overflow-hidden">
            <div className="p-4 border-b border-gray-200/20 dark:border-gray-700/30">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                All Posts ({posts.length})
              </h2>
            </div>

            {posts.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                No posts yet. Create your first post!
              </div>
            ) : (
              <div className="divide-y divide-gray-200/20 dark:divide-gray-700/30">
                {posts.map((post) => (
                  <div
                    key={post.slug}
                    className="p-4 hover:bg-white/20 dark:hover:bg-black/20 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">
                            {post.title}
                          </h3>
                          <span
                            className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                              post.isPublic
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                            }`}
                          >
                            {post.isPublic ? 'Public' : 'Private'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {post.description || 'No description'}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {post.date}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => toggleVisibility(post.slug, post.isPublic)}
                          className={`px-3 py-1.5 text-sm rounded-lg transition-colors font-medium ${
                            post.isPublic
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
                              : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'
                          }`}
                        >
                          {post.isPublic ? 'Make Private' : 'Make Public'}
                        </button>
                        <Link
                          href={`/admin/edit/${post.slug}`}
                          className="px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-lg transition-colors font-medium"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => deletePost(post.slug)}
                          className="px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg transition-colors font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Back to site link */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              &larr; Back to site
            </Link>
          </div>
        </div>
      </main>
      <GradientBackground
        variant="small"
        className="absolute bottom-0 opacity-20 dark:opacity-10"
      />
    </Layout>
  );
}
