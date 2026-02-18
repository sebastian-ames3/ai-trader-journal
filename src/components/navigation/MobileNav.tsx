"use client";

import { useState } from "react";
import { MobileHeader } from "./MobileHeader";
import GlobalSearch from "@/components/GlobalSearch";

export function MobileNav() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <MobileHeader onSearchOpen={() => setIsSearchOpen(true)} />
      <GlobalSearch
        externalOpen={isSearchOpen}
        onExternalClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}
