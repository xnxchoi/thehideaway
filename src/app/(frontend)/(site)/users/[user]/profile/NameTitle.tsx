import { Name } from "./Name.client";

export const NameTitle = (props: { title: string }) => {
  return (
    <>
      <Name
        colorMatrix={
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="	1 0 0 0 0
				        0 1 0 0 0
				        1 0 1 0 0
				        0 0 0 12 -4"
            result="goo"
          />
        }
        composite={
          <feComposite in="SourceGraphic" in2="displacement" operator="atop" />
        }
      >
        {props.title}
      </Name>
    </>
  );
};
