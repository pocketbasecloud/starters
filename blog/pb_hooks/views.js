const VIEWS = `${__hooks}/views`;
const PARTIALS = ["partials/post-cards.html", "partials/cover.html", "partials/post-meta.html", "icons.html"];
const PAGE_SIZE = 9;
const WORDS_PER_MINUTE = 220;
const TAGLINE = "Stories, notes and updates.";

function render(files, data) {
  return $template.loadFiles(...files.map((file) => `${VIEWS}/${file}`)).render(data);
}

function siteName() {
  return $app.settings().meta.appName || "Blog";
}

function page(name, meta, data) {
  return render(["layout.html", `pages/${name}.html`, ...PARTIALS], {
    ...data,
    meta: { description: "", image: "", ...meta },
    site: siteName(),
    year: new Date().getFullYear(),
  });
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

function listPage(number) {
  const offset = (number - 1) * PAGE_SIZE + 1;
  const records = $app.findRecordsByFilter("posts", "published = true", "-created", PAGE_SIZE + 1, offset);
  return {
    posts: records.slice(0, PAGE_SIZE).map(postData),
    next: records.length > PAGE_SIZE ? number + 1 : 0,
  };
}

module.exports = {
  home() {
    const newest = $app.findRecordsByFilter("posts", "published = true", "-created", 1, 0);
    const featured = newest.length > 0 ? postData(newest[0]) : null;
    return page("home", { title: siteName(), description: TAGLINE, image: featured ? featured.cover : "" }, {
      tagline: TAGLINE,
      featured,
      more: listPage(1),
    });
  },

  more(rawPage) {
    const number = Math.max(2, parseInt(rawPage, 10) || 2);
    return render(PARTIALS, listPage(number));
  },

  post(slug) {
    let record;
    try {
      record = $app.findFirstRecordByFilter("posts", "slug = {:slug} && published = true", { slug });
    } catch {
      return null;
    }
    const post = { ...postData(record), coverLarge: coverUrl(record, "1600x900"), body: record.getString("body") };
    return page("post", { title: `${post.title} · ${siteName()}`, description: post.summary, image: post.cover }, { post });
  },

  notFound() {
    return page("not-found", { title: `Not found · ${siteName()}` }, {});
  },
};
