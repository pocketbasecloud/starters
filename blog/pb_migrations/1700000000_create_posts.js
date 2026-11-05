/// <reference path="../pb_data/types.d.ts" />

const SAMPLES = [
  {
    title: "Hello from your new blog",
    slug: "hello",
    summary: "Your blog runs inside PocketBase. Here is how the pieces fit together.",
    body:
      "<p>Every post is a record in the <code>posts</code> collection, and every page is an HTML template in <code>pb_hooks/views/</code>, rendered by PocketBase's built-in template engine. There is no separate server and no build step.</p>" +
      "<h2>Publishing</h2><p>Add a record, write the body, tick <strong>published</strong> and it appears on the home page. Unticked posts stay private drafts: neither the pages nor the API show them.</p>" +
      "<h2>Covers</h2><p>Upload an image to a post's <strong>cover</strong> field and it becomes the card image on the home page.</p>",
  },
  {
    title: "Writing a post people finish",
    slug: "writing-a-post-people-finish",
    summary: "Short paragraphs, honest headings and one idea per post.",
    body:
      "<p>Readers skim first and read second. Give them headings that say what the section proves, and paragraphs short enough to read on a phone.</p>" +
      "<blockquote>Write the summary before the post. If it does not fit in two lines, the post is two posts.</blockquote>" +
      "<p>End with the one thing you want the reader to do next.</p>",
  },
  {
    title: "Make it yours",
    slug: "make-it-yours",
    summary: "Change the name, the tagline and the look in a few minutes.",
    body:
      "<p>The site name comes from your PocketBase settings, so renaming the app renames the blog. The tagline lives at the top of <code>pb_hooks/views.js</code>.</p>" +
      "<p>The look uses the Zen design system: <code>pb_public/zen.css</code> holds the components and <code>pb_public/style.css</code> the layout. Change the layout file; regenerate the Zen file rather than editing it.</p>",
  },
];

migrate((app) => {
  const posts = new Collection({
    type: "base",
    name: "posts",
    listRule: "published = true",
    viewRule: "published = true",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "text", name: "title", required: true, max: 200 },
      { type: "text", name: "slug", required: true, max: 120, pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
      { type: "text", name: "summary", max: 300 },
      { type: "editor", name: "body" },
      {
        type: "file",
        name: "cover",
        maxSelect: 1,
        maxSize: 5242880,
        mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
        thumbs: ["800x450", "1600x900"],
      },
      { type: "bool", name: "published" },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_posts_slug ON posts (slug)"],
  });
  app.save(posts);

  for (const sample of [...SAMPLES].reverse()) {
    const post = new Record(posts);
    post.set("title", sample.title);
    post.set("slug", sample.slug);
    post.set("summary", sample.summary);
    post.set("body", sample.body);
    post.set("published", true);
    app.save(post);
  }
}, (app) => {
  app.delete(app.findCollectionByNameOrId("posts"));
});
