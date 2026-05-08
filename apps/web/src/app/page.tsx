import Hero from "@/components/PageComponents/HomePageComponents/Hero/Hero";
import TopDestinations from "@/components/PageComponents/HomePageComponents/TopDestinations/TopDestinations";
import TravelDiaries from "@/components/PageComponents/HomePageComponents/TravelDiaries/TravelDiaries";
import TestimonialsCarousel from "@/components/PageComponents/HomePageComponents/TestimonialsCarousel/TestimonialsCarousel";
import DealsBanner from "@/components/PageComponents/HomePageComponents/DealsBanner/DealsBanner";

export default function Home() {
  return (
    <div>
      <Hero />
      <div id="destinations">
        <TopDestinations />
      </div>
      <DealsBanner />
      <div id="diaries">
        <TravelDiaries />
      </div>
      <TestimonialsCarousel />
    </div>
  );
}
