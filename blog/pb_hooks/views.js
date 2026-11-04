const icons = require(`${__hooks}/zen.js`);

const PAGE_SIZE = 9;
const WORDS_PER_MINUTE = 220;
const TAGLINE = "Stories, notes and updates.";

const LAYOUT = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{.title}}</title>
  {{if .description}}<meta name="description" content="{{.description}}">{{end}}
  <meta property="og:title" content="{{.title}}">
  {{if .image}}<meta property="og:image" content="{{.image}}">{{end}}
  <link rel="stylesheet" href="/zen.css">
  <link rel="stylesheet" href="/style.css">
  <script src="/htmx.min.js"></script>
</head>
<body>
  <div class="zen-provider site" data-paint="true" data-component-theme="brand-s1">
    <header class="topbar">
      <div class="wrap topbar-row">
        <a class="brand" href="/"><span class="mark" aria-hidden="true"></span><span class="zen-text zen-type-heading-4" data-tone="strongest">{{.site}}</span></a>
      </div>
    </header>
    <main>{{raw .content}}</main>
    <footer class="footer">
      <div class="wrap footer-row">
        <span class="zen-text zen-type-body-small-regular" data-tone="light">© {{.year}} {{.site}}</span>
        <span class="zen-text zen-type-body-small-regular" data-tone="light">Powered by PocketBase</span>
      </div>
    </footer>
  </div>
</body>
</html>`;

const META = `<p class="meta zen-text zen-type-caption-regular" data-tone="light"><time datetime="{{.iso}}">{{.date}}</time><span aria-hidden="true">·</span>${icons.clock}<span>{{.minutes}} min read</span></p>`;

const COVER = `{{if .cover}}<img class="cover-img" src="{{.cover}}" alt="" loading="lazy">{{else}}<span class="cover-fallback" style="--hue: {{.hue}}" aria-hidden="true">{{.initial}}</span>{{end}}`;

const HOME = `<section class="hero">
  <div class="wrap hero-inner">
    <span class="zen-badge" data-size="medium" data-tone="accent" data-background="subtle"><span class="zen-badge__text zen-type-body-base-medium">The blog</span></span>
    <h1 class="zen-text zen-heading zen-type-display-2" data-tone="strongest">{{.site}}</h1>
    <p class="zen-text zen-type-body-extra-regular" data-tone="base">{{.tagline}}</p>
  </div>
</section>
<div class="wrap feed">
{{if .featured}}{{with .featured}}<a class="zen-card featured" data-tone="shadow" data-interactive="true" href="/posts/{{.slug}}">
  <div class="zen-card__content featured-inner">
    <div class="cover cover--wide">${COVER}</div>
    <div class="featured-text">
      <span class="eyebrow zen-text zen-type-all-caps-s" data-tone="accent">Latest</span>
      <h2 class="zen-text zen-heading zen-type-heading-1" data-tone="strongest">{{.title}}</h2>
      {{if .summary}}<p class="zen-text zen-type-body-extra-regular" data-tone="base">{{.summary}}</p>{{end}}
      ${META}
    </div>
  </div>
</a>{{end}}
{{if .items}}<h2 class="section-title zen-text zen-heading zen-type-heading-3" data-tone="strongest">More posts</h2>
<ol class="grid" id="posts">{{raw .items}}</ol>{{end}}
{{else}}<section class="zen-empty-state"><div class="zen-empty-state__body"><div class="zen-empty-state__content"><h3 class="zen-empty-state__title zen-type-heading-4">No posts yet</h3><p class="zen-empty-state__caption zen-type-body-base-regular">Publish your first post from your PocketBase.</p></div></div></section>{{end}}
</div>`;

const ITEMS = `{{range .posts}}<li>
  <a class="zen-card card" data-tone="shadow" data-interactive="true" href="/posts/{{.slug}}">
    <div class="zen-card__content card-inner">
      <div class="cover">${COVER}</div>
      <div class="card-text">
        <h3 class="zen-text zen-heading zen-type-heading-4" data-tone="strongest">{{.title}}</h3>
        {{if .summary}}<p class="zen-text zen-type-body-base-regular" data-tone="base">{{.summary}}</p>{{end}}
        ${META}
      </div>
    </div>
  </a>
</li>{{end}}{{if .next}}<li class="more" id="more">
  <button type="button" class="zen-button" data-size="md" data-appearance="main" data-level="secondary" data-variant="secondary"
    hx-get="/blog/more?page={{.next}}" hx-target="#more" hx-swap="outerHTML"><span class="zen-button__label zen-type-button-label-m">Load more posts</span></button>
</li>{{end}}`;

const POST = `<article class="article">
  <header class="article-head wrap narrow">
    <a href="/" class="zen-link back" data-tone="hyperlink" data-underline="hover">${icons.arrowLeft}<span>All posts</span></a>
    <h1 class="zen-text zen-heading zen-type-display-2" data-tone="strongest">{{.title}}</h1>
    {{if .summary}}<p class="lede zen-text zen-type-body-extra-regular" data-tone="base">{{.summary}}</p>{{end}}
    ${META}
  </header>
  {{if .coverLarge}}<figure class="article-cover wrap"><img src="{{.coverLarge}}" alt=""></figure>{{end}}
  <div class="prose wrap narrow">{{raw .body}}</div>
</article>`;

const NOT_FOUND = `<div class="wrap narrow notfound"><section class="zen-empty-state"><div class="zen-empty-state__body"><div class="zen-empty-state__content"><h3 class="zen-empty-state__title zen-type-heading-4">Post not found</h3><p class="zen-empty-state__caption zen-type-body-base-regular">It may have been unpublished or moved. <a class="zen-link" data-tone="hyperlink" data-underline="hover" href="/">See all posts</a></p></div></div></section></div>`;

function siteName() {
  return $app.settings().meta.appName || "Blog";
}

function minutesToRead(html) {
  const words = html.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

function hueOf(text) {
  let hash = 0;
  for (const character of text) hash = (hash * 31 + character.charCodeAt(0)) % 360;
  return hash;
}

function coverUrl(record, thumb) {
  const file = record.getString("cover");
  if (!file) return "";
  return `/api/files/${record.collection().id}/${record.id}/${encodeURIComponent(file)}?thumb=${thumb}`;
}

function postData(record) {
  const created = record.getDateTime("created").time();
  const title = record.getString("title");
  return {
    title,
    slug: record.getString("slug"),
    summary: record.getString("summary"),
    iso: created.utc().format("2006-01-02T15:04:05Z"),
    date: created.format("January 2, 2006"),
    minutes: minutesToRead(record.getString("body")),
    cover: coverUrl(record, "800x450"),
    hue: hueOf(title),
    initial: title.trim().charAt(0).toUpperCase() || "·",
  };
}

function render(template, data) {
  return $template.loadString(template).render(data);
}

function page(title, content, description, image) {
  return render(LAYOUT, {
    title,
    content,
    description: description || "",
    image: image || "",
    site: siteName(),
    year: new Date().getFullYear(),
  });
}

function listPage(page, skipFeatured) {
  const offset = (page - 1) * PAGE_SIZE + (skipFeatured ? 1 : 0);
  const records = $app.findRecordsByFilter("posts", "published = true", "-created", PAGE_SIZE + 1, offset);
  return {
    posts: records.slice(0, PAGE_SIZE).map(postData),
    next: records.length > PAGE_SIZE ? page + 1 : 0,
  };
}

module.exports = {
  home() {
    const newest = $app.findRecordsByFilter("posts", "published = true", "-created", 1, 0);
    const featured = newest.length > 0 ? postData(newest[0]) : null;
    const rest = listPage(1, true);
    const content = render(HOME, {
      site: siteName(),
      tagline: TAGLINE,
      featured,
      items: rest.posts.length > 0 ? render(ITEMS, rest) : "",
    });
    return page(siteName(), content, TAGLINE, featured ? featured.cover : "");
  },

  more(rawPage) {
    const number = Math.max(2, parseInt(rawPage, 10) || 2);
    return render(ITEMS, listPage(number, true));
  },

  post(slug) {
    let record;
    try {
      record = $app.findFirstRecordByFilter("posts", "slug = {:slug} && published = true", { slug });
    } catch {
      return null;
    }
    const data = postData(record);
    return page(
      `${data.title} · ${siteName()}`,
      render(POST, { ...data, coverLarge: coverUrl(record, "1600x900"), body: record.getString("body") }),
      data.summary,
      data.cover,
    );
  },

  notFound() {
    return page(`Not found · ${siteName()}`, NOT_FOUND);
  },
};
