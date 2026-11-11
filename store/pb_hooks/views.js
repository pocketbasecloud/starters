const cart = require(`${__hooks}/lib/cart.js`);
const orders = require(`${__hooks}/lib/orders.js`);
const settings = require(`${__hooks}/lib/settings.js`);
const stripe = require(`${__hooks}/lib/stripe.js`);

const VIEWS = `${__hooks}/views`;
const PARTIALS = [
  "partials/catalog.html",
  "partials/product-card.html",
  "partials/tile.html",
  "partials/cart-link.html",
  "partials/cart-panel.html",
  "partials/add-button.html",
  "partials/order-status.html",
  "partials/order-rows.html",
  "partials/order-row.html",
  "partials/error.html",
  "icons.html",
];
const LIMIT = 60;
const SORTS = {
  featured: ["Featured", "-featured,-created"],
  newest: ["Newest", "-created"],
  "price-asc": ["Price: low to high", "price,name"],
  "price-desc": ["Price: high to low", "-price,name"],
};
const STATUS_POLLS = 60;
const STATUS_TONES = { pending: "neutral", paid: "green", fulfilled: "blue", cancelled: "neutral" };

function siteName() {
  return $app.settings().meta.appName || "Store";
}

function render(files, data) {
  return $template.loadFiles(...files.map((file) => `${VIEWS}/${file}`)).render(data);
}

function fragment(name, data) {
  const entry = `partials/${name}.html`;
  return render([entry, ...PARTIALS.filter((file) => file !== entry)], data);
}

function money(cents) {
  return settings.money(cents, settings.current().currency);
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
    id: record.id,
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

function cartState(e, current) {
  const lines = current || cart.read(e);
  return { enabled: stripe.configured(), count: lines.reduce((sum, line) => sum + line.quantity, 0) };
}

function page(e, name, meta, data) {
  const store = settings.current();
  return render(["layout.html", `pages/${name}.html`, ...PARTIALS], {
    ...data,
    meta: { description: "", image: "", ...meta },
    site: siteName(),
    year: new Date().getFullYear(),
    store,
    cart: cartState(e),
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

function cartData(e, current) {
  const lines = cart.resolve(current || cart.read(e));
  const total = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  return {
    lines: lines.map((line) => ({
      ...card(line.product),
      quantity: line.quantity,
      lineTotal: money(line.price * line.quantity),
      options: Array.from({ length: cart.MAX_QUANTITY }, (_, index) => ({ value: index + 1, selected: index + 1 === line.quantity })),
    })),
    count: lines.reduce((sum, line) => sum + line.quantity, 0),
    total: money(total),
  };
}

function orderData(order) {
  const items = $app.findRecordsByFilter("order_items", "order = {:order}", "name", 100, 0, { order: order.id });
  const status = order.getString("status");
  return {
    id: order.id,
    number: orders.number(order),
    email: order.getString("email"),
    date: order.getDateTime("created").time().format("Jan 2, 2006"),
    total: settings.money(order.getInt("total"), order.getString("currency")),
    items: items.map((item) => `${item.getInt("quantity")} × ${item.getString("name")}`).join(", "),
    status,
    label: status[0].toUpperCase() + status.slice(1),
    tone: STATUS_TONES[status] || "neutral",
    statuses: orders.STAFF_STATUSES.map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1), selected: value === status })),
  };
}

function statusPoll(attempt) {
  const count = Math.max(0, Math.floor(Number(attempt) || 0));
  return { next: count + 1, expired: count >= STATUS_POLLS };
}

function orderById(id) {
  if (!/^[a-z0-9]{15}$/.test(id || "")) return null;
  try {
    return $app.findRecordById("orders", id);
  } catch {
    return null;
  }
}

module.exports = {
  shopUrl,

  home(e, categorySlug, sortKey) {
    const store = settings.current();
    return page(e, "home", { title: siteName(), description: store.tagline }, { catalog: catalogData(categorySlug, sortKey) });
  },

  catalog(categorySlug, sortKey) {
    return fragment("catalog", catalogData(categorySlug, sortKey));
  },

  product(e, slug) {
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
    return page(e, "product", { title: `${data.name} · ${siteName()}`, description: data.summary, image: data.image }, { product });
  },

  activeProduct(id) {
    try {
      const product = $app.findRecordById("products", id);
      return product.getBool("active") ? product : null;
    } catch {
      return null;
    }
  },

  addButton(product, added) {
    return fragment("add-button", { id: product.id, added });
  },

  cartPage(e) {
    return page(e, "cart", { title: `Cart · ${siteName()}` }, { basket: cartData(e) });
  },

  cartPanel(e, current) {
    return fragment("cart-panel", { basket: cartData(e, current), cart: cartState(e, current) });
  },

  cartLink(e) {
    return fragment("cart-link", { cart: cartState(e) });
  },

  error(text) {
    return fragment("error", { text });
  },

  thanks(e, orderId) {
    const order = orderById(orderId);
    return page(e, "thanks", { title: `Thank you · ${siteName()}` }, { order: order ? orderData(order) : null, poll: statusPoll(0) });
  },

  orderStatus(orderId, attempt) {
    const order = orderById(orderId);
    return order ? fragment("order-status", { order: orderData(order), poll: statusPoll(attempt) }) : "";
  },

  notFound(e) {
    return page(e, "message", { title: `Not found · ${siteName()}` }, { heading: "Product not found", text: "It may be sold out or no longer available." });
  },

  staffPage(e) {
    return page(e, "staff", { title: `Orders · ${siteName()}` }, {});
  },

  staffOrders(status) {
    const filter = orders.STATUSES.includes(status) ? "status = {:status}" : "status != 'pending'";
    const records = $app.findRecordsByFilter("orders", filter, "-created", 100, 0, { status });
    return fragment("order-rows", { orders: records.map(orderData) });
  },

  orderRow(order) {
    return fragment("order-row", orderData(order));
  },
};
