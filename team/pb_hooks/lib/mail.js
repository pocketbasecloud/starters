function send(app, { to, name, subject, html }) {
  const meta = app.settings().meta;
  try {
    const message = new MailerMessage({
      from: { address: meta.senderAddress, name: meta.senderName || meta.appName },
      to: [{ address: to, name }],
      subject,
      html,
    });
    app.newMailClient().send(message);
    return true;
  } catch (error) {
    app.logger().warn("email failed", "subject", subject, "error", String(error));
    return false;
  }
}

module.exports = { send };
