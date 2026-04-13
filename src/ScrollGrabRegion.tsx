import { type ComponentPropsWithoutRef } from "react";
import { useHorizontalOverflowGrabRef } from "./useHorizontalOverflowGrab";

/** Obal pro `overflow-x: auto`; při přetečení nastaví kurzor grab (viz `.scroll-x--overflow` v CSS). */
export function ScrollGrabRegion({ className, ...rest }: ComponentPropsWithoutRef<"div">) {
  const ref = useHorizontalOverflowGrabRef<HTMLDivElement>();
  return <div ref={ref} className={className} {...rest} />;
}
