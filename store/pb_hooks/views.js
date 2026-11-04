const icons = require(`${__hooks}/zen.js`);

const CURRENCY_SYMBOL = "$";
const TAGLINE = "Small-batch goods, made to last.";
const LIMIT = 60;
const SORTS = {
  featured: ["Featured", "-featured,-created"],
  newest: ["Newest", "-created"],
  "price-asc": ["Price: low to high", "price,name"],
  "price-desc": ["Price: high to low", "-price,name"],
};

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
        <span class="secure zen-text zen-type-body-small-medium" data-tone="base">${icons.shield}<span>Secure checkout</span></span>
      </div>
    </header>
    <main>{{raw .content}}</main>
    <footer class="footer">
      <div class="wrap footer-row">
        <span class="zen-text zen-type-body-small-regular" data-tone="light">© {{.year}} {{.site}}</span>
        <span class="zen-text zen-type-body-small-regular" data-tone="light">Payments handled by Stripe</span>
      </div>
    </footer>
  </div>
</body>
</html>`;

const TILE = `{{if .image}}<img src="{{.image}}" alt="" loading="lazy">{{else}}<span class="tile-fallback" style="--hue: {{.hue}}" aria-hidden="true">{{.initial}}</span>{{end}}`;

const CATALOG = `<div id="catalog" class="catalog">
  <div class="toolbar">
    <nav class="chips" aria-label="Categories">
      {{range .chips}}<a class="chip zen-type-body-base-medium" href="{{.href}}" {{if .selected}}aria-current="page"{{end}}
        hx-get="/shop/catalog?{{.query}}" hx-target="#catalog" hx-swap="outerHTML">{{.name}}</a>{{end}}
    </nav>
    <label class="sort zen-type-body-small-regular"><span class="zen-visually-hidden">Sort by</span>
      <select name="sort" class="sort-select zen-type-body-base-medium" hx-get="/shop/catalog" hx-target="#catalog" hx-swap="outerHTML" hx-include="[name=category]">
        {{range .sorts}}<option value="{{.value}}" {{if .selected}}selected{{end}}>{{.label}}</option>{{end}}
      </select>
      <input type="hidden" name="category" value="{{.category}}">
    </label>
  </div>
  {{if .products}}<ul class="products">{{range .products}}<li>
    <a class="product-card" href="/products/{{.slug}}">
      <span class="tile">${TILE}{{if .featured}}<span class="zen-badge tile-badge" data-size="small" data-tone="inverse" data-background="solid"><span class="zen-badge__text zen-type-body-small-medium">Bestseller</span></span>{{end}}</span>
      <span class="product-meta">
        <span class="zen-text zen-type-body-base-medium" data-tone="strongest">{{.name}}</span>
        <span class="zen-text zen-type-body-base-regular" data-tone="base">{{.price}}</span>
      </span>
      {{if .summary}}<span class="zen-text zen-type-body-small-regular product-summary" data-tone="light">{{.summary}}</span>{{end}}
    </a>
  </li>{{end}}</ul>
  {{else}}<section class="zen-empty-state"><div class="zen-empty-state__body"><div class="zen-empty-state__content"><h3 class="zen-empty-state__title zen-type-heading-4">Nothing here yet</h3><p class="zen-empty-state__caption zen-type-body-base-regular">Add products in your PocketBase and tick <strong>active</strong>.</p></div></div></section>{{end}}
</div>`;

const HOME = `<section class="banner">
  <div class="wrap banner-inner">
    <div class="banner-text">
      <span class="eyebrow zen-text zen-type-all-caps-s" data-tone="accent">New season</span>
      <h1 class="zen-text zen-heading zen-type-display-2" data-tone="strongest">{{.site}}</h1>
      <p class="zen-text zen-type-body-extra-regular" data-tone="base">{{.tagline}}</p>
    </div>
    <ul class="perks">
      <li class="zen-text zen-type-body-small-medium" data-tone="base">${icons.bag}Free returns for 30 days</li>
      <li class="zen-text zen-type-body-small-medium" data-tone="base">${icons.shield}Pay safely with Stripe</li>
    </ul>
  </div>
</section>
<div class="wrap shop">{{raw .catalog}}</div>`;

const PRODUCT = `<div class="wrap product">
  <a href="/" class="zen-link back" data-tone="hyperlink" data-underline="hover">${icons.arrowLeft}<span>All products</span></a>
  <div class="product-layout">
    <div class="gallery">
      {{if .images}}{{range $index, $image := .images}}<input type="radio" name="shot" id="shot-{{$index}}" class="shot" {{if eq $index 0}}checked{{end}}>{{end}}
      <div class="stage">{{range .images}}<img src="{{.large}}" alt="">{{end}}</div>
      {{if gt (len .images) 1}}<div class="thumbs">{{range $index, $image := .images}}<label for="shot-{{$index}}" class="thumb" aria-label="Show image {{$image.number}}"><img src="{{$image.small}}" alt=""></label>{{end}}</div>{{end}}
      {{else}}<div class="stage"><span class="tile-fallback" style="--hue: {{.hue}}" aria-hidden="true">{{.initial}}</span></div>{{end}}
    </div>
    <div class="buy">
      {{if .category}}<span class="eyebrow zen-text zen-type-all-caps-s" data-tone="accent">{{.category}}</span>{{end}}
      <h1 class="zen-text zen-heading zen-type-heading-1" data-tone="strongest">{{.name}}</h1>
      <p class="price zen-text zen-type-heading-3" data-tone="strongest">{{.price}}</p>
      {{if .summary}}<p class="zen-text zen-type-body-extra-regular" data-tone="base">{{.summary}}</p>{{end}}
      {{if .checkout}}<a class="zen-button buy-button" data-size="lg" data-appearance="main" data-level="primary" data-variant="primary" href="{{.checkout}}" rel="noopener noreferrer"><span class="zen-button__label zen-type-button-label-l">Buy now</span><span class="zen-button__icon" aria-hidden="true">${icons.arrowRight}</span></a>
      {{else}}<button type="button" class="zen-button buy-button" data-size="lg" data-appearance="main" data-level="secondary" data-variant="secondary" disabled><span class="zen-button__label zen-type-button-label-l">Not on sale yet</span></button>{{end}}
      <ul class="assurances">
        <li class="zen-text zen-type-body-small-regular" data-tone="base">${icons.shield}Checkout on Stripe. We never see your card.</li>
        <li class="zen-text zen-type-body-small-regular" data-tone="base">${icons.bag}Free returns within 30 days.</li>
      </ul>
      <div class="prose">{{raw .description}}</div>
    </div>
  </div>
  {{if .related}}<section class="related">
    <h2 class="zen-text zen-heading zen-type-heading-3" data-tone="strongest">You may also like</h2>
    <ul class="products">{{range .related}}<li><a class="product-card" href="/products/{{.slug}}"><span class="tile">${TILE}</span><span class="product-meta"><span class="zen-text zen-type-body-base-medium" data-tone="strongest">{{.name}}</span><span class="zen-text zen-type-body-base-regular" data-tone="base">{{.price}}</span></span></a></li>{{end}}</ul>
  </section>{{end}}
</div>`;

const MESSAGE = `<div class="wrap narrow notice"><section class="zen-empty-state"><div class="zen-empty-state__body"><div class="zen-empty-state__content"><h3 class="zen-empty-state__title zen-type-heading-4">{{.title}}</h3><p class="zen-empty-state__caption zen-type-body-base-regular">{{.text}} <a class="zen-link" data-tone="hyperlink" data-underline="hover" href="/">Keep shopping</a></p></div></div></section></div>`;

function siteName() {
  return $app.settings().meta.appName || "Store";
}

function render(template, data) {
  return $template.loadString(template).render(data);
}

function money(cents) {
  const whole = String(Math.floor(cents / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${CURRENCY_SYMBOL}${whole}.${String(cents % 100).padStart(2, "0")}`;
}

function hueOf(text) {
  let hash = 0;
  for (const character of text) hash = (hash * 31 + character.charCodeAt(0)) % 360;
  return hash;
}

function imageUrl(record, file, thumb) {
  return `/api/files/${record.collection().id}/${record.id}/${encodeURIComponent(file)}?thumb=${thumb}`;
}

function secureUrl(value) {
  return /^https:\/\/[^\s"'<>]+$/.test(value) ? value : "";
}

function card(record) {
  const name = record.getString("name");
  const images = record.getStringSlice("images");
  return {
    name,
    slug: record.getString("slug"),
    summary: record.getString("summary"),
    price: money(record.getInt("price")),
    featured: record.getBool("featured"),
    image: images.length > 0 ? imageUrl(record, images[0], "600x600") : "",
    hue: hueOf(name),
    initial: name.trim().charAt(0).toUpperCase() || "·",
  };
}

function page(title, content, description, image) {
  return render(LAYOUT, { title, content, description: description || "", image: image || "", site: siteName(), year: new Date().getFullYear() });
}

function categoryBySlug(slug) {
  if (!slug) return null;
  try {
    return $app.findFirstRecordByData("categories", "slug", slug);
  } catch {
    return null;
  }
}

function shopUrl(categorySlug, sortKey) {
  const category = categoryBySlug(categorySlug);
  const query = [
    category ? `category=${encodeURIComponent(category.getString("slug"))}` : "",
    SORTS[sortKey] && sortKey !== "featured" ? `sort=${sortKey}` : "",
  ].filter(Boolean).join("&");
  return query ? `/?${query}` : "/";
}

function catalog(categorySlug, sortKey) {
  const sort = SORTS[sortKey] ? sortKey : "featured";
  const category = categoryBySlug(categorySlug);
  const filter = category ? "active = true && category = {:category}" : "active = true";
  const records = $app.findRecordsByFilter("products", filter, SORTS[sort][1], LIMIT, 0, { category: category ? category.id : "" });
  const categories = $app.findRecordsByFilter("categories", "", "sort,name", 50, 0);
  const sortQuery = sort === "featured" ? "" : `sort=${sort}`;
  const chip = (name, slug) => {
    const query = [slug ? `category=${encodeURIComponent(slug)}` : "", sortQuery].filter(Boolean).join("&");
    return { name, query, href: query ? `/?${query}` : "/", selected: (category ? category.getString("slug") : "") === slug };
  };
  return render(CATALOG, {
    chips: [chip("All", ""), ...categories.map((item) => chip(item.getString("name"), item.getString("slug")))],
    sorts: Object.entries(SORTS).map(([value, [label]]) => ({ value, label, selected: value === sort })),
    category: category ? category.getString("slug") : "",
    products: records.map(card),
  });
}

module.exports = {
  catalog,
  shopUrl,

  home(categorySlug, sortKey) {
    const content = render(HOME, { site: siteName(), tagline: TAGLINE, catalog: catalog(categorySlug, sortKey) });
    return page(siteName(), content, TAGLINE);
  },

  product(slug) {
    let record;
    try {
      record = $app.findFirstRecordByFilter("products", "slug = {:slug} && active = true", { slug });
    } catch {
      return null;
    }
    const data = card(record);
    const categoryId = record.getString("category");
    let categoryName = "";
    let related = [];
    if (categoryId) {
      try {
        categoryName = $app.findRecordById("categories", categoryId).getString("name");
      } catch {}
      related = $app
        .findRecordsByFilter("products", "active = true && category = {:category} && id != {:id}", "-featured,-created", 4, 0, { category: categoryId, id: record.id })
        .map(card);
    }
    const images = record.getStringSlice("images").map((file, index) => ({ number: index + 1, small: imageUrl(record, file, "600x600"), large: imageUrl(record, file, "1200x1200") }));
    const content = render(PRODUCT, {
      ...data,
      images,
      category: categoryName,
      checkout: secureUrl(record.getString("checkout")),
      description: record.getString("description"),
      related,
    });
    return page(`${data.name} · ${siteName()}`, content, data.summary, data.image);
  },

  thanks() {
    return page(`Thank you · ${siteName()}`, render(MESSAGE, { title: "Thank you for your order", text: "Stripe has emailed your receipt. We'll send tracking details as soon as it ships." }));
  },

  notFound() {
    return page(`Not found · ${siteName()}`, render(MESSAGE, { title: "Product not found", text: "It may be sold out or no longer available." }));
  },
};
