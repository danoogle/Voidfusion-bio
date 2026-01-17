import { getGlobalData } from '../../utils/global-data';
import { getPostsFromStore, getPostFromStore } from '../../utils/posts-store';
import { serialize } from 'next-mdx-remote/serialize';
import rehypePrism from '@mapbox/rehype-prism';
import remarkGfm from 'remark-gfm';
import rehypeUnwrapImages from 'rehype-unwrap-images';

import { MDXRemote } from 'next-mdx-remote';
import Head from 'next/head';
import Link from 'next/link';
import ArrowIcon from '../../components/ArrowIcon';
import CustomImage from '../../components/CustomImage';
import CustomLink from '../../components/CustomLink';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import Layout, { GradientBackground } from '../../components/Layout';
import SEO from '../../components/SEO';

// Custom components/renderers to pass to MDX.
// Since the MDX files aren't loaded by webpack, they have no knowledge of how
// to handle import statements. Instead, you must include components in scope
// here.
const components = {
  a: CustomLink,
  // It also works with dynamically-imported components, which is especially
  // useful for conditionally loading components for certain routes.
  // See the notes in README.md for more details.
  Head,
  img: CustomImage,
};

export default function PostPage({
  source,
  frontMatter,
  prevPost,
  nextPost,
  globalData,
}) {
  return (
    <Layout>
      <SEO
        title={`${frontMatter.title} - ${globalData.name}`}
        description={frontMatter.description}
      />
      <Header name={globalData.name} />
      <article className="px-6 md:px-0">
        <header>
          <h1 className="mb-12 text-3xl text-center md:text-5xl dark:text-white">
            {frontMatter.title}
          </h1>
          {frontMatter.description && (
            <p className="mb-4 text-xl">
              {frontMatter.description}
            </p>
          )}
        </header>
        <main>
          <article className="prose dark:prose-invert">
            <MDXRemote {...source} components={components} />
          </article>
        </main>
        <div className="grid mt-12 md:grid-cols-2 lg:-mx-24">
          {prevPost && (
            <Link
              href={`/posts/${prevPost.slug}`}
              className="flex flex-col px-10 py-8 text-center transition border border-gray-800/10 bg-white/10 md:text-right first:rounded-t-lg md:first:rounded-tr-none md:first:rounded-l-lg last:rounded-r-lg last:rounded-b-lg backdrop-blur-lg dark:bg-black/30 hover:bg-white/20 dark:hover:bg-black/50 dark:border-white/10 last:border-t md:border-r-0 md:last:border-r md:last:rounded-r-none"
            >
              <p className="mb-4 text-gray-500 uppercase dark:text-white dark:opacity-60">
                Previous
              </p>
              <h4 className="mb-6 text-2xl text-gray-700 dark:text-white">
                {prevPost.title}
              </h4>
              <ArrowIcon className="mx-auto mt-auto transform rotate-180 md:mr-0" />
            </Link>
          )}
          {nextPost && (
            <Link
              href={`/posts/${nextPost.slug}`}
              className="flex flex-col px-10 py-8 text-center transition border border-t-0 border-b-0 border-gray-800/10 bg-white/10 md:text-left md:first:rounded-t-lg last:rounded-b-lg first:rounded-l-lg md:last:rounded-bl-none md:last:rounded-r-lg backdrop-blur-lg dark:bg-black/30 hover:bg-white/20 dark:hover:bg-black/50 dark:border-white/10 first:border-t first:rounded-t-lg md:border-t last:border-b"
            >
              <p className="mb-4 text-gray-500 uppercase dark:text-white dark:opacity-60">
                Next
              </p>
              <h4 className="mb-6 text-2xl text-gray-700 dark:text-white">
                {nextPost.title}
              </h4>
              <ArrowIcon className="mx-auto mt-auto md:ml-0" />
            </Link>
          )}
        </div>
      </article>
      <Footer copyrightText={globalData.footerText} />
      <GradientBackground
        variant="large"
        className="absolute -top-32 opacity-30 dark:opacity-50"
      />
      <GradientBackground
        variant="small"
        className="absolute bottom-0 opacity-20 dark:opacity-10"
      />
    </Layout>
  );
}

export const getServerSideProps = async ({ params }) => {
  const globalData = getGlobalData();

  // Get the current post
  const post = await getPostFromStore(params.slug);

  if (!post) {
    return { notFound: true };
  }

  // Check if post is private - don't show on public site
  if (post.data.isPublic === false) {
    return { notFound: true };
  }

  // Serialize MDX content
  const mdxSource = await serialize(post.content, {
    mdxOptions: {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypePrism, rehypeUnwrapImages],
    },
    scope: post.data,
  });

  // Get all posts for prev/next navigation
  const allPosts = await getPostsFromStore();
  const currentIndex = allPosts.findIndex((p) => p.slug === params.slug);

  const prevPost = currentIndex > 0 ? {
    title: allPosts[currentIndex - 1].data.title,
    slug: allPosts[currentIndex - 1].slug,
  } : null;

  const nextPost = currentIndex < allPosts.length - 1 ? {
    title: allPosts[currentIndex + 1].data.title,
    slug: allPosts[currentIndex + 1].slug,
  } : null;

  return {
    props: {
      globalData,
      source: mdxSource,
      frontMatter: post.data,
      prevPost,
      nextPost,
    },
  };
};
