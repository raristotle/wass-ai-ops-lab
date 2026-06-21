import { ShellDemo } from "@/features/shell/ShellDemo";
import { ProductFinderCard } from "@/features/product-finder/ProductFinderCard";

// The standalone "AI ops lab" demo, kept reachable here (it used to render at the apex
// `/`, which now sends visitors to the actual product at /product-finder).
export default function OpsLab() {
  return (
    <>
      <ShellDemo />
      <ProductFinderCard />
    </>
  );
}
