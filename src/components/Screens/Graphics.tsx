import React from "react";

const Graphics = () => {
  return (
    <>
      <div className="absolute left-0 top-0 -z-10">
        <svg
          width="95"
          height="190"
          viewBox="0 0 95 190"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cy="95"
            r="77"
            stroke="url(#paint0_linear_47_26)"
            strokeWidth="36"
          />
          <defs>
            <linearGradient
              id="paint0_linear_47_26"
              x1="-117.84"
              y1="190"
              x2="117.828"
              y2="25.9199"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#d35400" />
              <stop offset="0.541667" stopColor="#e67e22" />
              <stop offset="1" stopColor="#8aa0b3" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </>
  );
};

export default Graphics;
