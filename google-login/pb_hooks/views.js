const VIEWS = `${__hooks}/views`;

function render(files, data) {
  return $template.loadFiles(...[...files, "icons.html"].map((file) => `${VIEWS}/${file}`)).render(data);
}

function avatarUrl(user) {
  const file = user.getString("avatar");
  return file ? `/api/files/${user.collection().id}/${user.id}/${file}?thumb=96x96` : "";
}

module.exports = {
  page() {
    return render(["layout.html", "pages/home.html"], { site: $app.settings().meta.appName || "Google sign-in" });
  },

  profile(user) {
    return render(["partials/profile.html"], {
      name: user.getString("name") || user.email(),
      email: user.email(),
      verified: user.verified(),
      avatar: avatarUrl(user),
      joined: user.getDateTime("created").time().format("2 January 2006"),
    });
  },
};
