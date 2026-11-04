/// <reference path="../pb_data/types.d.ts" />

const STAFF = '@request.auth.collectionName = "users"';

migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  users.createRule = null;
  app.save(users);

  const orders = new Collection({
    type: "base",
    name: "orders",
    listRule: STAFF,
    viewRule: STAFF,
    createRule: STAFF,
    updateRule: STAFF,
    deleteRule: null,
    fields: [
      { type: "text", name: "customer", required: true, max: 120 },
      { type: "email", name: "email" },
      { type: "number", name: "total", min: 0 },
      { type: "select", name: "status", required: true, maxSelect: 1, values: ["pending", "paid", "shipped", "cancelled"] },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
    ],
    indexes: ["CREATE INDEX idx_orders_status ON orders (status)"],
  });
  app.save(orders);

  const samples = [
    ["Ada Lovelace", "ada@example.com", 129, "paid"],
    ["Alan Turing", "alan@example.com", 54.5, "pending"],
    ["Grace Hopper", "grace@example.com", 310, "shipped"],
    ["Katherine Johnson", "katherine@example.com", 88, "paid"],
    ["Linus Torvalds", "linus@example.com", 19.99, "cancelled"],
    ["Margaret Hamilton", "margaret@example.com", 240, "pending"],
  ];
  for (const [customer, email, total, status] of samples) {
    const order = new Record(orders);
    order.set("customer", customer);
    order.set("email", email);
    order.set("total", total);
    order.set("status", status);
    app.save(order);
  }
}, (app) => {
  app.delete(app.findCollectionByNameOrId("orders"));
  const users = app.findCollectionByNameOrId("users");
  users.createRule = "";
  app.save(users);
});
