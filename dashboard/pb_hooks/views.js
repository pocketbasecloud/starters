const VIEWS = `${__hooks}/views`;
const STATUSES = ["pending", "paid", "shipped", "cancelled"];
const STATUS_TONES = { pending: "yellow", paid: "green", shipped: "blue", cancelled: "neutral" };
const PAGE_LIMIT = 100;

function money(amount) {
  const [whole, cents] = amount.toFixed(2).split(".");
  return `$${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${cents}`;
}

function label(status) {
  return status[0].toUpperCase() + status.slice(1);
}

function render(files, data) {
  return $template.loadFiles(...[...files, "icons.html"].map((file) => `${VIEWS}/${file}`)).render(data);
}

function scalar(sql) {
  const result = new DynamicModel({ value: 0 });
  $app.db().newQuery(sql).one(result);
  return result.value;
}

function orderData(order) {
  const status = order.getString("status");
  return {
    id: order.id,
    customer: order.getString("customer"),
    email: order.getString("email"),
    total: money(order.getFloat("total")),
    date: order.getDateTime("created").time().format("Jan 2, 2006"),
    tone: STATUS_TONES[status] || "neutral",
    label: label(status),
    statuses: STATUSES.map((value) => ({ value, label: label(value), selected: value === status })),
  };
}

function row(order) {
  return render(["partials/order-row.html"], orderData(order));
}

module.exports = {
  STATUSES,
  row,

  page() {
    return render(["layout.html", "pages/orders.html"], {
      site: $app.settings().meta.appName || "Orders",
      segments: [{ value: "", label: "All" }, ...STATUSES.map((value) => ({ value, label: label(value) }))],
    });
  },

  stats() {
    const count = scalar("SELECT COUNT(*) AS value FROM orders");
    const pending = scalar("SELECT COUNT(*) AS value FROM orders WHERE status = 'pending'");
    const earning = scalar("SELECT COUNT(*) AS value FROM orders WHERE status IN ('paid', 'shipped')");
    const cents = scalar(
      "SELECT CAST(ROUND(COALESCE(SUM(total), 0) * 100) AS INTEGER) AS value FROM orders WHERE status IN ('paid', 'shipped')",
    );
    return render(["partials/stats.html"], {
      metrics: [
        { label: "Total orders", value: count },
        { label: "Awaiting payment", value: pending },
        { label: "Revenue", value: money(cents / 100) },
        { label: "Average order", value: money(earning === 0 ? 0 : cents / 100 / earning) },
      ],
    });
  },

  rows(status, search) {
    const parts = [];
    const params = {};
    if (STATUSES.includes(status)) {
      parts.push("status = {:status}");
      params.status = status;
    }
    const q = (search || "").trim();
    if (q) {
      parts.push("(customer ~ {:q} || email ~ {:q})");
      params.q = q;
    }
    const orders = $app.findRecordsByFilter("orders", parts.join(" && ") || "id != ''", "-created", PAGE_LIMIT, 0, params);
    return render(["partials/order-rows.html", "partials/order-row.html"], { orders: orders.map(orderData) });
  },

  order(e) {
    try {
      return $app.findRecordById("orders", e.request.pathValue("id"));
    } catch {
      throw new NotFoundError("Order not found");
    }
  },
};
