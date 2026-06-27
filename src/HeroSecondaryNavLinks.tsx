import React from "react";
import { HeroProfilSkolyTabLink } from "./HeroProfilSkolyTabLink";
import { HeroUserGuideTabLink } from "./HeroUserGuideTabLink";
import { HeroVyrocniZpravaTabLink } from "./HeroVyrocniZpravaTabLink";

/** Doplňkové odkazy v navigaci modulů (mimo kalkulačky PHmax). */
export function HeroSecondaryNavLinks() {
  return (
    <>
      <HeroProfilSkolyTabLink />
      <HeroVyrocniZpravaTabLink />
      <HeroUserGuideTabLink />
    </>
  );
}
