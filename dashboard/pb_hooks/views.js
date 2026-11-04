const icons = require(`${__hooks}/zen.js`);

const STATUSES = ["pending", "paid", "shipped", "cancelled"];
const STATUS_TONES = { pending: "yellow", paid: "green", shipped: "blue", cancelled: "neutral" };
const PAGE_LIMIT = 100;

const button = (label, attrs, level, size) => {
  const labelStyle = { sm: "s", md: "m" }[size || "md"];
  return `<button class="zen-button" data-size="${size || "md"}" data-appearance="main" data-level="${level || "primary"}" data-variant="${level || "primary"}" ${attrs}><span class="zen-button__label zen-type-button-label-${labelStyle}">${label}</span></button>`;
};

const field = (id, label, input) => `<div class="zen-input-field" data-size="medium" data-state="default">
  <span class="zen-input-label zen-type-body-small-regular" data-state="default"><span class="zen-input-label__content"><label class="zen-input-label__text" for="${id}">${label}</label></span></span>
  <div class="zen-input__control">${input}</div>
</div>`;

const SEGMENTS = [["", "All"], ...STATUSES.map((value) => [value, value[0].toUpperCase() + value.slice(1)])]
  .map(([value, label], index) => `<button type="button" class="zen-segmented__item" data-size="medium" data-state="default" data-value="${value}" data-selected="${index === 0}" aria-pressed="${index === 0}"><span class="zen-segmented__label zen-type-body-base-bold">${label}</span></button>`)
  .join("");

const PAGE = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{.site}}</title>
  <link rel="stylesheet" href="/zen.css">
  <link rel="stylesheet" href="/style.css">
  <script src="/htmx.min.js"></script>
  <script type="module" src="/app.js"></script>
</head>
<body>
  <template id="alert-icon">${icons.alert}</template>
  <div class="zen-provider app" data-paint="true" data-component-theme="brand-s1">
    <section id="signin" class="auth" hidden>
      <div class="zen-card auth-card" data-tone="shadow" data-spacing="large"><div class="zen-card__content">
        <div class="auth-heading">
          <span class="mark" aria-hidden="true"></span>
          <h1 class="zen-text zen-heading zen-type-heading-2" data-tone="strongest">Sign in to {{.site}}</h1>
          <p class="zen-text zen-type-body-base-regular" data-tone="base">Staff accounts are added by an admin in PocketBase.</p>
        </div>
        <form id="signin-form" class="stack">
          ${field("email", "Email", '<input id="email" class="zen-input__native zen-type-body-base-medium" name="email" type="email" autocomplete="username" required>')}
          ${field("password", "Password", '<input id="password" class="zen-input__native zen-type-body-base-medium" name="password" type="password" autocomplete="current-password" required>')}
          <div class="error-slot"></div>
          ${button("Sign in", 'type="submit"')}
        </form>
      </div></div>
    </section>

    <div id="dashboard" hidden>
      <header class="topbar">
        <div class="wrap topbar-row">
          <a class="brand" href="/"><span class="mark" aria-hidden="true"></span><span class="zen-text zen-type-heading-4" data-tone="strongest">{{.site}}</span></a>
          <div class="account">
            <span id="who" class="zen-text zen-type-body-small-regular" data-tone="base"></span>
            <button id="signout" type="button" class="zen-button" data-size="sm" data-appearance="main" data-level="secondary" data-variant="secondary"><span class="zen-button__icon" aria-hidden="true">${icons.logOut}</span><span class="zen-button__label zen-type-button-label-s">Sign out</span></button>
          </div>
        </div>
      </header>

      <main class="wrap page">
        <header class="zen-page-header"><div class="zen-page-header__row"><div class="zen-page-header__titles"><h1 class="zen-text zen-heading zen-type-heading-1" data-tone="strongest">Orders</h1></div></div><p class="zen-text zen-type-body-base-regular zen-page-header__description" data-tone="base">Track revenue and move orders through fulfilment.</p></header>

        <div class="error-slot"></div>

        <div class="metrics" hx-get="/app/stats" hx-trigger="signed-in from:body, orders-changed from:body"></div>

        <div class="zen-card" data-tone="shadow" data-spacing="medium"><div class="zen-card__content">
          <form id="filters" class="toolbar" onsubmit="return false">
            <input type="hidden" id="status" name="status" value="">
            <div class="zen-segmented" data-level="secondary" data-size="medium" role="group" aria-label="Filter by status">${SEGMENTS}</div>
            <div class="zen-input-field zen-search" data-size="medium" data-state="default">
              <span class="zen-input-label zen-type-body-small-regular zen-visually-hidden" data-state="default"><span class="zen-input-label__content"><label class="zen-input-label__text" for="search">Search orders</label></span></span>
              <div class="zen-input__control"><span class="zen-input__affordance zen-input__affordance--leading">${icons.search.replace('data-size="base"', 'data-size="sm"')}</span><input id="search" class="zen-input__native zen-type-body-base-medium" name="q" type="search" placeholder="Search name or email" data-tone="default"></div>
            </div>
          </form>
          <div class="zen-table">
            <table class="zen-table__table" aria-label="Orders">
              <thead><tr>
                <th scope="col" class="zen-table__header" data-align="left"><span class="zen-table__head"><span class="zen-table__label zen-type-all-caps-s">Customer</span></span></th>
                <th scope="col" class="zen-table__header" data-align="left"><span class="zen-table__head"><span class="zen-table__label zen-type-all-caps-s">Status</span></span></th>
                <th scope="col" class="zen-table__header hide-sm" data-align="left"><span class="zen-table__head"><span class="zen-table__label zen-type-all-caps-s">Date</span></span></th>
                <th scope="col" class="zen-table__header" data-align="right"><span class="zen-table__head"><span class="zen-table__label zen-type-all-caps-s">Amount</span></span></th>
                <th scope="col" class="zen-table__header" data-align="right"><span class="zen-table__head"><span class="zen-table__label zen-type-all-caps-s">Update</span></span></th>
              </tr></thead>
              <tbody id="orders" hx-get="/app/orders" hx-include="#filters" hx-disinherit="hx-include"
                hx-trigger="signed-in from:body, change from:#filters, input changed delay:300ms from:#search"></tbody>
            </table>
          </div>
        </div></div>
      </main>
    </div>
  </div>
</body>
</html>`;

const METRIC = (label, value) => `<div class="zen-card zen-metric-card" data-tone="shadow" data-spacing="medium"><div class="zen-card__content"><div class="zen-metric" data-size="xlarge" data-layout="stacked"><div class="zen-metric__contents"><div class="zen-metric__content"><span class="zen-metric__label zen-type-body-base-regular">${label}</span><span class="zen-metric__value zen-type-display-4">${value}</span></div></div></div></div></div>`;

const STATS = [
  METRIC("Total orders", "{{.count}}"),
  METRIC("Awaiting payment", "{{.pending}}"),
  METRIC("Revenue", "{{.revenue}}"),
  METRIC("Average order", "{{.average}}"),
].join("");

const ROW = `<tr class="zen-table__row" id="order-{{.id}}">
  <td class="zen-table__cell" data-align="left"><span class="zen-table-text"><span class="zen-table-text__label zen-type-body-base-regular">{{.customer}}</span><span class="zen-table-text__caption zen-type-caption-regular">{{.email}}</span></span></td>
  <td class="zen-table__cell" data-align="left"><span class="zen-badge" data-size="medium" data-tone="{{.tone}}" data-background="subtle"><span class="zen-badge__text zen-type-body-base-medium">{{.label}}</span></span></td>
  <td class="zen-table__cell hide-sm" data-align="left"><span class="zen-text zen-type-body-base-regular" data-tone="base">{{.date}}</span></td>
  <td class="zen-table__cell amount" data-align="right">{{.total}}</td>
  <td class="zen-table__cell" data-align="right">
    <div class="zen-input-field compact" data-size="small" data-state="default"><div class="zen-input__control">
      <select class="zen-input__native zen-type-body-small-medium" name="status" aria-label="Set status for {{.customer}}"
        hx-patch="/app/orders/{{.id}}" hx-target="#order-{{.id}}" hx-swap="outerHTML">
        {{range .statuses}}<option value="{{.value}}" {{if .selected}}selected{{end}}>{{.label}}</option>{{end}}
      </select>
    </div></div>
  </td>
</tr>`;

const EMPTY = `<tr class="zen-table__row"><td class="zen-table__cell" colspan="5"><section class="zen-empty-state"><div class="zen-empty-state__body"><div class="zen-empty-state__content"><h3 class="zen-empty-state__title zen-type-heading-4">No orders match</h3><p class="zen-empty-state__caption zen-type-body-base-regular">Try another status or search.</p></div></div></section></td></tr>`;

function money(amount) {
  const [whole, cents] = amount.toFixed(2).split(".");
  return `$${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${cents}`;
}

function label(status) {
  return status[0].toUpperCase() + status.slice(1);
}

function render(template, data) {
  return $template.loadString(template).render(data);
}

function scalar(sql) {
  const result = new DynamicModel({ value: 0 });
  $app.db().newQuery(sql).one(result);
  return result.value;
}

function row(order) {
  const status = order.getString("status");
  return render(ROW, {
    id: order.id,
    customer: order.getString("customer"),
    email: order.getString("email"),
    total: money(order.getFloat("total")),
    date: order.getDateTime("created").time().format("Jan 2, 2006"),
    tone: STATUS_TONES[status] || "neutral",
    label: label(status),
    statuses: STATUSES.map((value) => ({ value, label: label(value), selected: value === status })),
  });
}

module.exports = {
  STATUSES,
  row,

  page() {
    return render(PAGE, { site: $app.settings().meta.appName || "Orders" });
  },

  stats() {
    const count = scalar("SELECT COUNT(*) AS value FROM orders");
    const pending = scalar("SELECT COUNT(*) AS value FROM orders WHERE status = 'pending'");
    const earning = scalar("SELECT COUNT(*) AS value FROM orders WHERE status IN ('paid', 'shipped')");
    const cents = scalar(
      "SELECT CAST(ROUND(COALESCE(SUM(total), 0) * 100) AS INTEGER) AS value FROM orders WHERE status IN ('paid', 'shipped')",
    );
    return render(STATS, {
      count,
      pending,
      revenue: money(cents / 100),
      average: money(earning === 0 ? 0 : cents / 100 / earning),
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
    return orders.length === 0 ? EMPTY : orders.map(row).join("");
  },

  order(e) {
    try {
      return $app.findRecordById("orders", e.request.pathValue("id"));
    } catch {
      throw new NotFoundError("Order not found");
    }
  },
};
