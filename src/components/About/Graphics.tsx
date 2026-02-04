import React from "react";

const Graphics = () => {
  return (
    <>
      <div className="absolute right-0 top-36 -z-10">
        <svg
          width="95"
          height="190"
          viewBox="0 0 95 190"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="95"
            cy="95"
            r="77"
            stroke="url(#paint0_linear_47_27)"
            strokeWidth="36"
          />
          <defs>
            <linearGradient
              id="paint0_linear_47_27"
              x1="0"
              y1="0"
              x2="224.623"
              y2="130.324"
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
