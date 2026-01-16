import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout, { GradientBackground } from '../../components/Layout';
import SEO from '../../components/SEO';
import Link from 'next/link';

export default function AdminDashboard() {
  const { user, login, logout, loading, isAuthorizedUser } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!loading && user && isAuthorizedUser()) {
      fetchPosts();
    }
  }, [loading, user]);

  const fetchPosts = async () => {
    setLoadingPosts(true);
    setError(null);
    try {
      const response = await fetch('/.netlify/functions/get-posts', {
        headers: {
          Authorization: `Bearer ${user.token.access_token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      } else {
        setError('Failed to fetch posts');
      }
    } catch (err) {
      setError('Error fetching posts: ' + err.message);
    }
    setLoadingPosts(false);
  };

  const handleDelete = async (slug) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const response = await fetch('/.netlify/functions/delete-post', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token.access_token}`,
        },
        body: JSON.stringify({ slug }),
      });

      if (response.ok) {
        fetchPosts();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete post');
      }
    } catch (err) {
      setError('Error deleting post: ' + err.message);
    }
  };

  if (loading) {
    return (
      <Layout>
        <SEO title="Admin - Loading" />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-xl">Loading...</div>
        </div>
        <GradientBackground variant="large" className="fixed top-20 opacity-40 dark:opacity-60" />
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <SEO title="Admin - Login Required" />
        <div className="flex flex-col items-center justify-center min-h-screen gap-6">
          <h1 className="text-3xl font-bold">Blog Admin</h1>
          <p className="text-lg opacity-70">Please log in to manage your blog posts</p>
          <button
            onClick={login}
            className="px-6 py-3 text-lg font-semibold text-white transition-colors rounded-lg bg-primary hover:bg-primary/80"
          >
            Log in with Netlify Identity
          </button>
          <p className="text-sm opacity-50 mt-4">
            Only authorized users (dssilmmain@gmail.com) can access this area
          </p>
        </div>
        <GradientBackground variant="large" className="fixed top-20 opacity-40 dark:opacity-60" />
      </Layout>
    );
  }

  if (!isAuthorizedUser()) {
    return (
      <Layout>
        <SEO title="Admin - Unauthorized" />
        <div className="flex flex-col items-center justify-center min-h-screen gap-6">
          <h1 className="text-3xl font-bold text-red-500">Access Denied</h1>
          <p className="text-lg opacity-70">
            You are logged in as <strong>{user.email}</strong>, but you are not authorized to access this area.
          </p>
          <p className="text-sm opacity-50">
            Only dssilmmain@gmail.com is authorized.
          </p>
          <button
            onClick={logout}
            className="px-6 py-3 text-lg font-semibold text-white transition-colors rounded-lg bg-red-600 hover:bg-red-700"
          >
            Log Out
          </button>
        </div>
        <GradientBackground variant="large" className="fixed top-20 opacity-40 dark:opacity-60" />
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO title="Blog Admin Dashboard" />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Blog Admin</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm opacity-70">{user.email}</span>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm font-semibold text-white transition-colors rounded-lg bg-red-600 hover:bg-red-700"
            >
              Log Out
            </button>
          </div>
        </div>

        <div className="mb-6">
          <Link
            href="/admin/new"
            className="inline-flex items-center px-6 py-3 text-lg font-semibold text-white transition-colors rounded-lg bg-green-600 hover:bg-green-700"
          >
            + Create New Post
          </Link>
        </div>

        {error && (
          <div className="p-4 mb-6 text-red-800 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-200">
            {error}
          </div>
        )}

        {loadingPosts ? (
          <div className="text-center py-8">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-8 opacity-70">
            No posts found. Create your first post!
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.slug}
                className="p-6 transition border border-gray-800/10 rounded-lg bg-white/10 backdrop-blur-lg dark:bg-black/30 dark:border-white/10"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold">{post.title}</h2>
                    {post.description && (
                      <p className="mt-2 opacity-70">{post.description}</p>
                    )}
                    <p className="mt-2 text-sm opacity-50">{post.date}</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Link
                      href={`/admin/edit/${post.slug}`}
                      className="px-4 py-2 text-sm font-semibold text-white transition-colors rounded-lg bg-blue-600 hover:bg-blue-700"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(post.slug)}
                      className="px-4 py-2 text-sm font-semibold text-white transition-colors rounded-lg bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </button>
                    <Link
                      href={`/posts/${post.slug}`}
                      target="_blank"
                      className="px-4 py-2 text-sm font-semibold transition-colors rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-white/10"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <GradientBackground variant="large" className="fixed top-20 opacity-40 dark:opacity-60" />
    </Layout>
  );
}
