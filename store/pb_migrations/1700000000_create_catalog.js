/// <reference path="../pb_data/types.d.ts" />

const CATEGORIES = [
  { name: "Apparel", slug: "apparel", sort: 1 },
  { name: "Home", slug: "home", sort: 2 },
  { name: "Accessories", slug: "accessories", sort: 3 },
];

const PRODUCTS = [
  { name: "Everyday Tee", slug: "everyday-tee", category: "apparel", price: 2800, summary: "Heavyweight organic cotton with a relaxed fit.", featured: true },
  { name: "Weekend Hoodie", slug: "weekend-hoodie", category: "apparel", price: 6400, summary: "Brushed fleece inside, clean finish outside." },
  { name: "Stoneware Mug", slug: "stoneware-mug", category: "home", price: 2200, summary: "Hand-glazed, holds a generous 350 ml.", featured: true },
  { name: "Linen Throw", slug: "linen-throw", category: "home", price: 8900, summary: "Washed linen that softens with every wash." },
  { name: "Canvas Tote", slug: "canvas-tote", category: "accessories", price: 3400, summary: "Waxed canvas with leather handles.", featured: true },
  { name: "Wool Beanie", slug: "wool-beanie", category: "accessories", price: 2600, summary: "Merino rib knit, warm without the itch." },
];

const DESCRIPTION =
  "<p>Replace this text with the story of the product: what it is made of, how it fits and why people love it.</p>" +
  "<ul><li>Add a <strong>payment link</strong> in PocketBase to start selling</li><li>Upload up to four images</li><li>Untick <strong>active</strong> to hide it</li></ul>";

migrate((app) => {
  const categories = new Collection({
    type: "base",
    name: "categories",
    listRule: "",
    viewRule: "",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "text", name: "name", required: true, max: 60 },
      { type: "text", name: "slug", required: true, max: 60, pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
      { type: "number", name: "sort", onlyInt: true },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_categories_slug ON categories (slug)"],
  });
  app.save(categories);

  const products = new Collection({
    type: "base",
    name: "products",
    listRule: "active = true",
    viewRule: "active = true",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "text", name: "name", required: true, max: 120 },
      { type: "text", name: "slug", required: true, max: 120, pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
      { type: "relation", name: "category", collectionId: categories.id, maxSelect: 1, cascadeDelete: false },
      { type: "number", name: "price", required: true, onlyInt: true, min: 0, help: "In cents: 2800 is 28.00" },
      { type: "text", name: "summary", max: 200 },
      { type: "editor", name: "description" },
      {
        type: "file",
        name: "images",
        maxSelect: 4,
        maxSize: 5242880,
        mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
        thumbs: ["600x600", "1200x1200"],
      },
      { type: "url", name: "checkout", help: "A Stripe Payment Link or any https checkout page" },
      { type: "bool", name: "featured" },
      { type: "bool", name: "active" },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_products_slug ON products (slug)"],
  });
  app.save(products);

  const ids = {};
  for (const sample of CATEGORIES) {
    const category = new Record(categories);
    category.load(sample);
    app.save(category);
    ids[sample.slug] = category.id;
  }
  for (const sample of PRODUCTS) {
    const product = new Record(products);
    product.load({ ...sample, category: ids[sample.category], description: DESCRIPTION, active: true, featured: !!sample.featured });
    app.save(product);
  }
}, (app) => {
  for (const name of ["products", "categories"]) app.delete(app.findCollectionByNameOrId(name));
});
