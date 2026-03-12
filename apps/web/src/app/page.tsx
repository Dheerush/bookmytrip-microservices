import Hero from "@/components/PageComponents/HomePageComponents/Hero/Hero";
import TopDestinations from "@/components/PageComponents/HomePageComponents/TopDestinations/TopDestinations";
import TravelDiaries from "@/components/PageComponents/HomePageComponents/TravelDiaries/TravelDiaries";

export default function Home() {
  return (
    <div>
      <Hero />
      <div id="destinations">
        <TopDestinations />
      </div>
      <div id="diaries">
        <TravelDiaries />
      </div>
    </div>
  );
}
