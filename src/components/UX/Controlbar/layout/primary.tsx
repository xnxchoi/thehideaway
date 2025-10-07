"use client";
import { Link } from "@/components/UX/Link/Link";
import { MainButton } from "@/components/UX/Controlbar/layout/buttons/MainButton";

export const PrimaryLayout = (props) => {
  return (
    <div className="menu-float__layout menu-float__layout--primary" {...props}>
      <div className="menu-float__content">
        <Link href="/public" className="menu-float__logo">
          <svg
            id="ha_cb"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 45 45"
          >
            <path
              d="m10.17,42.82l-.05-40.63c0-.27.29-.5.64-.5h3.14c.35,0,.64.22.64.5l.03,25.87c0,.27.29.5.64.5h13.63c.35,0,.64-.23.64-.52v-10.96c-.01-.27.27-.5.63-.5h3.14c.35,0,.64.22.64.5l.03,25.74c0,.27-.29.5-.64.5h-3.14c-.35,0-.64-.22-.64-.5v-12.39c-.01-.27-.3-.5-.65-.5h-13.63c-.35,0-.64.23-.64.52v12.39c.01.27-.27.5-.63.5h-3.14c-.35,0-.64-.22-.64-.5h0Z"
              fill="currentColor"
              strokeWidth="0"
            />
            <g id="cl">
              <circle
                cx="31.97"
                cy="7"
                r="2.91"
                fill="currentColor"
                strokeWidth="0"
              />
            </g>
          </svg>
        </Link>
        <div className="ha-breadcrumb">
          <span className="menu-float__subtitle" />
        </div>
        <MainButton />
      </div>
    </div>
  );
};
