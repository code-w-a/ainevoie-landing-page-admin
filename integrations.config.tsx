const integrations = {
  // Sanity removed from this app.
  isSanityEnabled: false,
  isStripeEnabled: true,
  isAlgoliaEnabled: true,
  isMailchimpEnabled: false,
  isAuthEnabled: false,
};

const messages = {
  sanity: (
    <div style={{ whiteSpace: "pre-wrap" }}>
      Blog-ul nu este disponibil momentan.
    </div>
  ),
  stripe: (
    <div style={{ whiteSpace: "pre-wrap" }}>
      Plățile nu sunt configurate momentan.
    </div>
  ),
  algolia: (
    <div style={{ whiteSpace: "pre-wrap" }}>
      Căutarea globală nu este disponibilă momentan.
    </div>
  ),
  mailchimp: (
    <div style={{ whiteSpace: "pre-wrap" }}>
      Abonarea la newsletter nu este disponibilă momentan.
    </div>
  ),
  auth: (
    <div style={{ whiteSpace: "pre-wrap" }}>
      Autentificarea nu este disponibilă momentan.
    </div>
  ),

  // Add more messages here
};

export { integrations, messages };
