type ProviderWelcomeTemplateInput = {
  fullName: string;
};

export function getProviderWelcomeTemplate({
  fullName,
}: ProviderWelcomeTemplateInput) {
  const html = `
    <div style="background:#f8fafb;padding:24px 0;font-family:Arial,sans-serif;color:#111827;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;">
              <tr>
                <td style="background:#d35400;padding:20px 24px;color:#ffffff;">
                  <h1 style="margin:0;font-size:22px;line-height:1.3;">Bine ai venit pe AInevoie</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:24px;">
                  <p style="margin:0 0 12px;">Salut, <strong>${fullName}</strong>!</p>
                  <p style="margin:0 0 12px;">
                    Contul tau de prestator a fost creat cu succes si este salvat in baza noastra comuna.
                  </p>
                  <p style="margin:0 0 18px;">
                    Urmatorii pasi:
                  </p>
                  <ol style="margin:0 0 18px 20px;padding:0;">
                    <li style="margin-bottom:8px;">Echipa verifica datele trimise.</li>
                    <li style="margin-bottom:8px;">Daca e nevoie, primesti cereri de completare.</li>
                    <li>La lansare, te autentifici direct cu acest cont.</li>
                  </ol>
                  <p style="margin:0;">Cu drag,<br/>Echipa AInevoie</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;

  const text = [
    `Salut, ${fullName}!`,
    "",
    "Contul tau de prestator AInevoie a fost creat cu succes.",
    "Datele tale sunt deja salvate in baza comuna, compatibila cu aplicatia mobila.",
    "",
    "Urmatorii pasi:",
    "1) Echipa verifica datele trimise.",
    "2) Daca lipsesc informatii, te contactam pentru completare.",
    "3) La lansare, te autentifici direct cu acest cont.",
    "",
    "Suport: contact@ainevoie.ro",
    "",
    "Cu drag,",
    "Echipa AInevoie",
  ].join("\n");

  return { html, text };
}
