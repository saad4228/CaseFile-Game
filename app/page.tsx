import { Hero } from "@/components/landing/Hero";
import { SectionCase } from "@/components/landing/SectionCase";
import { SectionConnect } from "@/components/landing/SectionConnect";
import { Footer, SectionCTA } from "@/components/landing/SectionCTA";
import { SectionInvestigate } from "@/components/landing/SectionInvestigate";
import { SectionProve } from "@/components/landing/SectionProve";
import { SectionQuestion } from "@/components/landing/SectionQuestion";
import { SectionSolve } from "@/components/landing/SectionSolve";
import { TopNav } from "@/components/landing/TopNav";

export default function Landing() {
  return (
    <>
      <TopNav />
      <main>
        <Hero />
        <SectionCase />
        <SectionInvestigate />
        <SectionConnect />
        <SectionQuestion />
        <SectionProve />
        <SectionSolve />
        <SectionCTA />
      </main>
      <Footer />
    </>
  );
}
