import type { AppLocale } from "@/lib/apiLocale";

type ProviderWelcomeTemplateInput = {
  fullName: string;
  locale?: AppLocale;
};

export function getProviderWelcomeTemplate({
  fullName,
  locale = "ro",
}: ProviderWelcomeTemplateInput) {
  if (locale === "en") {
    const html = `
    <div style="margin:0;padding:0;background:#ffffff;font-family:Arial,sans-serif;color:#111827;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;padding:0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background:#ffffff;border:0;border-radius:0;overflow:visible;">
              <tr>
                <td style="background:#d35400;padding:20px 24px;color:#ffffff;">
                  <h1 style="margin:0;font-size:22px;line-height:1.3;">Welcome to AInevoie</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:24px;">
                  <p style="margin:0 0 12px;">Hi <strong>${fullName}</strong>,</p>
                  <p style="margin:0 0 12px;">
                    Thank you for signing up as a provider. Your account is created and your details are on file with AInevoie — they will carry through to the mobile app when we launch.
                  </p>
                  <p style="margin:0 0 18px;">
                    What happens next:
                  </p>
                  <ol style="margin:0 0 18px 20px;padding:0;">
                    <li style="margin-bottom:8px;">Our team reviews the information you submitted.</li>
                    <li style="margin-bottom:8px;">If we need anything else, we will contact you.</li>
                    <li>When the app goes live, sign in with this same account.</li>
                  </ol>
                  <p style="margin:0;">Kind regards,<br/>The AInevoie team</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;

    const text = [
      `Hi ${fullName},`,
      "",
      "Thank you for signing up as a provider. Your AInevoie account is created and your details are on file — they will carry through to the mobile app when we launch.",
      "",
      "What happens next:",
      "1) Our team reviews the information you submitted.",
      "2) If we need anything else, we will contact you.",
      "3) When the app goes live, sign in with this account.",
      "",
      "Support: contact@ai-nevoie.ro",
      "",
      "Kind regards,",
      "The AInevoie team",
    ].join("\n");

    return { html, text };
  }

  const html = `
    <div style="margin:0;padding:0;background:#ffffff;font-family:Arial,sans-serif;color:#111827;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;padding:0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background:#ffffff;border:0;border-radius:0;overflow:visible;">
              <tr>
                <td style="background:#d35400;padding:20px 24px;color:#ffffff;">
                  <h1 style="margin:0;font-size:22px;line-height:1.3;">Bine ai venit pe AInevoie</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:24px;">
                  <p style="margin:0 0 12px;">Salut, <strong>${fullName}</strong>!</p>
                  <p style="margin:0 0 12px;">
                    Contul tău de prestator a fost creat cu succes și este salvat în baza noastră comună.
                  </p>
                  <p style="margin:0 0 18px;">
                    Următorii pași:
                  </p>
                  <ol style="margin:0 0 18px 20px;padding:0;">
                    <li style="margin-bottom:8px;">Echipa verifică datele trimise.</li>
                    <li style="margin-bottom:8px;">Dacă e nevoie, primești cereri de completare.</li>
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
    "Contul tău de prestator AInevoie a fost creat cu succes.",
    "Datele tale sunt deja salvate în baza comună, compatibilă cu aplicația mobilă.",
    "",
    "Următorii pași:",
    "1) Echipa verifică datele trimise.",
    "2) Dacă lipsesc informații, te contactăm pentru completare.",
    "3) La lansare, te autentifici direct cu acest cont.",
    "",
    "Suport: contact@ai-nevoie.ro",
    "",
    "Cu drag,",
    "Echipa AInevoie",
  ].join("\n");

  return { html, text };
}

export function getProviderWelcomeEmailSubject(locale: AppLocale): string {
  return locale === "en" ? "Welcome to AInevoie" : "Bine ai venit pe AInevoie";
}
