"use client";

import { useTranslations } from "next-intl";

const Contact = () => {
  const t = useTranslations("Contact");

  return (
    <>
      <section id="support" className="pt-[100px] pb-[110px]">
        <div className="container">
          <div
            className="wow fadeInUp mx-auto mb-10 max-w-[690px] text-center"
            data-wow-delay=".2s"
          >
            <h2 className="mb-4 text-3xl font-bold text-black sm:text-4xl md:text-[44px] md:leading-tight dark:text-white">
              {t("title")}
            </h2>
            <p className="text-body text-base">{t("subtitle")}</p>
          </div>
        </div>

        <div className="container">
          <div
            className="wow fadeInUp shadow-card dark:shadow-card-dark mx-auto w-full max-w-[925px] rounded-lg bg-[#F8FAFB] px-8 py-10 sm:px-10 dark:bg-[#15182B]"
            data-wow-delay=".3s"
          >
            <form>
              <div className="-mx-[22px] flex flex-wrap">
                <div className="w-full px-[22px] md:w-1/2">
                  <div className="mb-8">
                    <input
                      type="text"
                      name="name"
                      id="name"
                      placeholder={t("namePh")}
                      className="border-stroke text-body focus:border-primary dark:focus:border-primary w-full rounded-sm border bg-white px-[30px] py-4 text-base outline-hidden dark:border-[#34374A] dark:bg-[#2A2E44]"
                    />
                  </div>
                </div>

                <div className="w-full px-[22px] md:w-1/2">
                  <div className="mb-8">
                    <input
                      type="text"
                      name="company"
                      id="company"
                      placeholder={t("companyPh")}
                      className="border-stroke text-body focus:border-primary dark:focus:border-primary w-full rounded-sm border bg-white px-[30px] py-4 text-base outline-hidden dark:border-[#34374A] dark:bg-[#2A2E44]"
                    />
                  </div>
                </div>

                <div className="w-full px-[22px] md:w-1/2">
                  <div className="mb-8">
                    <input
                      type="email"
                      name="email"
                      id="email"
                      placeholder={t("emailPh")}
                      className="border-stroke text-body focus:border-primary dark:focus:border-primary w-full rounded-sm border bg-white px-[30px] py-4 text-base outline-hidden dark:border-[#34374A] dark:bg-[#2A2E44]"
                    />
                  </div>
                </div>

                <div className="w-full px-[22px] md:w-1/2">
                  <div className="mb-8">
                    <input
                      type="text"
                      name="phone"
                      id="phone"
                      placeholder={t("phonePh")}
                      className="border-stroke text-body focus:border-primary dark:focus:border-primary w-full rounded-sm border bg-white px-[30px] py-4 text-base outline-hidden dark:border-[#34374A] dark:bg-[#2A2E44]"
                    />
                  </div>
                </div>

                <div className="w-full px-[22px]">
                  <div className="mb-8">
                    <textarea
                      rows={6}
                      name="message"
                      id="message"
                      placeholder={t("messagePh")}
                      className="border-stroke text-body focus:border-primary dark:focus:border-primary w-full rounded-sm border bg-white px-[30px] py-4 text-base outline-hidden dark:border-[#34374A] dark:bg-[#2A2E44]"
                    ></textarea>
                  </div>
                </div>

                <div className="w-full px-[22px]">
                  <div className="text-center">
                    <p className="text-body mb-5 text-center text-base">
                      {t("consent")}
                    </p>
                    <button
                      type="submit"
                      className="bg-primary hover:bg-primary/90 inline-block rounded-md px-11 py-[14px] text-base font-medium text-white"
                    >
                      {t("submit")}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>
    </>
  );
};

export default Contact;
