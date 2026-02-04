import React from "react";

const Graphics = () => {
  return (
    <>
      <div className="absolute right-0 top-0 -z-10">
        <svg
          width="602"
          height="1154"
          viewBox="0 0 602 1154"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g opacity="0.25" filter="url(#filter0_f_26_84)">
            <circle
              cx="577"
              cy="577"
              r="317"
              fill="url(#paint0_linear_26_84)"
            />
          </g>
          <defs>
            <filter
              id="filter0_f_26_84"
              x="0"
              y="0"
              width="1154"
              height="1154"
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend
                mode="normal"
                in="SourceGraphic"
                in2="BackgroundImageFix"
                result="shape"
              />
              <feGaussianBlur
                stdDeviation="130"
                result="effect1_foregroundBlur_26_84"
              />
            </filter>
            <linearGradient
              id="paint0_linear_26_84"
              x1="183.787"
              y1="894"
              x2="970.173"
              y2="346.491"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#d35400" />
              <stop offset="0.541667" stopColor="#e67e22" />
              <stop offset="1" stopColor="#8aa0b3" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="absolute -bottom-1/2 left-0 -z-10 hidden md:block">
        <svg
          width="622"
          height="1236"
          viewBox="0 0 622 1236"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g opacity="0.2" filter="url(#filter0_f_26_85)">
            <circle cx="4" cy="618" r="368" fill="url(#paint0_linear_26_85)" />
          </g>
          <defs>
            <filter
              id="filter0_f_26_85"
              x="-614"
              y="0"
              width="1236"
              height="1236"
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend
                mode="normal"
                in="SourceGraphic"
                in2="BackgroundImageFix"
                result="shape"
              />
              <feGaussianBlur
                stdDeviation="125"
                result="effect1_foregroundBlur_26_85"
              />
            </filter>
            <linearGradient
              id="paint0_linear_26_85"
              x1="-364"
              y1="250"
              x2="506.12"
              y2="754.835"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#d35400" />
              <stop offset="1" stopColor="#2c3e50" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </>
  );
};

export default Graphics;
