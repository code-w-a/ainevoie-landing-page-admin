import React from "react";

type FaqData = {
  activeFaq: number;
  id: number;
  handleFaqToggle: (id: number) => void;
  title: string;
  details: string;
};

const FAQItem = ({ faqData }: { faqData: FaqData }) => {
  const { activeFaq, id, handleFaqToggle, title, details } = faqData;

  return (
    <>
      <div className="faq border-b border-stroke last-of-type:border-none dark:border-stroke-dark">
        <button
          onClick={() => {
            handleFaqToggle(id);
          }}
          className="faq-btn relative flex w-full items-center justify-between px-[18px] py-6 text-left text-base font-medium text-black dark:text-white sm:px-[26px] sm:text-lg"
        >
          {title}

          {activeFaq === id ? (
            <svg
              className="fill-current"
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clipPath="url(#clip0_49_578)">
                <path
                  d="M22.1667 12.8333H15.1667H12.8333H5.83334V15.1666H12.8333H15.1667H22.1667V12.8333Z"
                  fill=""
                />
              </g>
              <defs>
                <clipPath id="clip0_49_578">
                  <rect width="28" height="28" fill="white" />
                </clipPath>
              </defs>
            </svg>
          ) : (
            <svg
              className="fill-current"
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clipPath="url(#clip0_49_588)">
                <path
                  d="M12.8333 12.8333V5.83325H15.1667V12.8333H22.1667V15.1666H15.1667V22.1666H12.8333V15.1666H5.83334V12.8333H12.8333Z"
                  fill=""
                />
              </g>
              <defs>
                <clipPath id="clip0_49_588">
                  <rect width="28" height="28" fill="white" />
                </clipPath>
              </defs>
            </svg>
          )}
        </button>
        <div
          className={`faq-content h-auto overflow-hidden border-t border-stroke px-[18px] dark:border-stroke-dark sm:px-[26px] ${
            activeFaq === id
              ? "max-h-fit py-[30px] opacity-100"
              : "max-h-0 py-0 opacity-0 transition-all duration-100 ease-in-out"
          }`}
        >
          <p className="text-base text-body">{details}</p>
        </div>
      </div>
    </>
  );
};

export default FAQItem;
