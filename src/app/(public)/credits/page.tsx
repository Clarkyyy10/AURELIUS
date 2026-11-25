import type { Metadata } from "next";

export const metadata: Metadata = { title: "Photo credits" };

/** Photo credits (footer link). Every picture on this site is a local drawing until the owner adds real photos. */
export default function CreditsPage() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-6 sm:px-6">
      <h1 className="type-hero">Photo credits</h1>
      <div className="mt-4 max-w-2xl space-y-4 text-base leading-7 text-grey-700">
        <p>The product pictures on this site are simple drawings made for the store. They stand in for real photos until the owner photographs each piece.</p>
        <p>The 3D pieces in the designer are drawn by the website from the options you choose. They are not photos of real items.</p>
      </div>
    </div>
  );
}
