const VIEWS = `${__hooks}/views`;
const PARTIALS = ["partials/catalog.html", "partials/product-card.html", "partials/tile.html", "icons.html"];
const CURRENCY_SYMBOL = "$";
const TAGLINE = "Small-batch goods, made to last.";
const LIMIT = 60;
const SORTS = {
  featured: ["Featured", "-featured,-created"],
  newest: ["Newest", "-created"],
  "price-asc": ["Price: low to high", "price,name"],
  "price-desc": ["Price: high to low", "-price,name"],
};

function siteName() {
  return $app.settings().meta.appName || "Store";
}

function render(files, data) {
  return $template.loadFiles(...files.map((file) => `${VIEWS}/${file}`)).render(data);
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

function page(name, meta, data) {
  return render(["layout.html", `pages/${name}.html`, ...PARTIALS], {
    ...data,
    meta: { description: "", image: "", ...meta },
    site: siteName(),
    year: new Date().getFullYear(),
  });
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

function catalogData(categorySlug, sortKey) {
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
  return {
    chips: [chip("All", ""), ...categories.map((item) => chip(item.getString("name"), item.getString("slug")))],
    sorts: Object.entries(SORTS).map(([value, [label]]) => ({ value, label, selected: value === sort })),
    category: category ? category.getString("slug") : "",
    products: records.map(card),
  };
}

function catalog(categorySlug, sortKey) {
  return render(PARTIALS, catalogData(categorySlug, sortKey));
}

module.exports = {
  catalog,
  shopUrl,

  home(categorySlug, sortKey) {
    return page("home", { title: siteName(), description: TAGLINE }, { tagline: TAGLINE, catalog: catalogData(categorySlug, sortKey) });
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
    const product = {
      ...data,
      images,
      category: categoryName,
      checkout: secureUrl(record.getString("checkout")),
      description: record.getString("description"),
      related,
    };
    return page("product", { title: `${data.name} · ${siteName()}`, description: data.summary, image: data.image }, { product });
  },

  thanks() {
    return page("message", { title: `Thank you · ${siteName()}` }, { heading: "Thank you for your order", text: "Stripe has emailed your receipt. We'll send tracking details as soon as it ships." });
  },

  notFound() {
    return page("message", { title: `Not found · ${siteName()}` }, { heading: "Product not found", text: "It may be sold out or no longer available." });
  },
};
