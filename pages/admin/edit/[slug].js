import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Layout, { GradientBackground } from '../../../components/Layout';
import SEO from '../../../components/SEO';
import Link from 'next/link';

export default function EditPost() {
  const { user, login, loading, isAuthorizedUser } = useAuth();
  const router = useRouter();
  const { slug } = router.query;
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    content: '',
  });
  const [loadingPost, setLoadingPost] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!loading && user && isAuthorizedUser() && slug) {
      fetchPost();
    }
  }, [loading, user, slug]);

  const fetchPost = async () => {
    setLoadingPost(true);
    setError(null);
    try {
      const response = await fetch(`/.netlify/functions/get-post?slug=${slug}`, {
        headers: {
          Authorization: `Bearer ${user.token.access_token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setFormData({
          title: data.post.title || '',
          description: data.post.description || '',
          date: data.post.date || '',
          content: data.post.content || '',
        });
      } else {
        setError('Failed to fetch post');
      }
    } catch (err) {
      setError('Error fetching post: ' + err.message);
    }
    setLoadingPost(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/.netlify/functions/update-post', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token.access_token}`,
        },
        body: JSON.stringify({ slug, ...formData }),
      });

      if (response.ok) {
        router.push('/admin');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update post');
      }
    } catch (err) {
      setError('Error updating post: ' + err.message);
    }
    setSaving(false);
  };

  if (loading || loadingPost) {
    return (
      <Layout>
        <SEO title="Loading..." />
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
        <SEO title="Login Required" />
        <div className="flex flex-col items-center justify-center min-h-screen gap-6">
          <h1 className="text-3xl font-bold">Login Required</h1>
          <button
            onClick={login}
            className="px-6 py-3 text-lg font-semibold text-white transition-colors rounded-lg bg-primary hover:bg-primary/80"
          >
            Log in with Netlify Identity
          </button>
        </div>
        <GradientBackground variant="large" className="fixed top-20 opacity-40 dark:opacity-60" />
      </Layout>
    );
  }

  if (!isAuthorizedUser()) {
    return (
      <Layout>
        <SEO title="Unauthorized" />
        <div className="flex flex-col items-center justify-center min-h-screen gap-6">
          <h1 className="text-3xl font-bold text-red-500">Access Denied</h1>
          <p>You are not authorized to access this area.</p>
          <Link href="/admin" className="text-primary underline">
            Go back
          </Link>
        </div>
        <GradientBackground variant="large" className="fixed top-20 opacity-40 dark:opacity-60" />
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO title={`Edit: ${formData.title || 'Post'}`} />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Edit Post</h1>
          <Link
            href="/admin"
            className="px-4 py-2 text-sm font-semibold transition-colors rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-white/10"
          >
            Back to Dashboard
          </Link>
        </div>

        {error && (
          <div className="p-4 mb-6 text-red-800 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/10 dark:bg-black/30 backdrop-blur-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/10 dark:bg-black/30 backdrop-blur-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium mb-2">
              Date *
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/10 dark:bg-black/30 backdrop-blur-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium mb-2">
              Content (Markdown) *
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              rows={15}
              placeholder="Write your blog post content in Markdown format..."
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/10 dark:bg-black/30 backdrop-blur-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 text-lg font-semibold text-white transition-colors rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <Link
              href="/admin"
              className="px-6 py-3 text-lg font-semibold transition-colors rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-white/10"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
      <GradientBackground variant="large" className="fixed top-20 opacity-40 dark:opacity-60" />
    </Layout>
  );
}
