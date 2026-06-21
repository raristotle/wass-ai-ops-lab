import { redirect } from "next/navigation";

// The apex domain IS the product — send visitors straight to the recommender.
// (The standalone AI-ops-lab demo lives at /ops-lab so it isn't orphaned.)
export default function Home() {
  redirect("/product-finder");
}
