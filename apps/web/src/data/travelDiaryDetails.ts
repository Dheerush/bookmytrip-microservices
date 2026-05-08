export interface TravelDiaryDetail {
  lead: string;
  sections: Array<{
    heading: string;
    body: string;
  }>;
  highlights: string[];
  takeaway: string;
}

export const travelDiaryDetails: Record<string, TravelDiaryDetail> = {
  "delhi-chandni-chowk": {
    lead: "Old Delhi does not unfold in a straight line. It reveals itself one lane at a time, through sizzling tawas, fading Mughal facades, temple bells, bicycle bells, and a thousand tiny storefronts that feel permanently alive.",
    sections: [
      {
        heading: "Where The Morning Begins",
        body: "I started near Jama Masjid just after sunrise, when the city was still stretching awake. Tea sellers were setting out steel kettles, the smell of cardamom drifted through the alleys, and shop shutters opened like a slow curtain. In that first hour, Chandni Chowk felt less like a market and more like a living museum with people, not walls, telling the story.",
      },
      {
        heading: "Markets That Never Sit Still",
        body: "The deeper you walk, the more the neighbourhood changes character. One lane is stacked with wedding fabrics, another with spice sacks, another with silver, books, or old camera parts. What makes the area unforgettable is not only the architecture, but the density of life around it. Traders know each other by name, customers bargain like it is an art form, and every corner feels like it has been important for generations.",
      },
      {
        heading: "Food As Local Memory",
        body: "Street food here is not a side attraction, it is part of the identity of the place. I stopped for jalebi, stuffed paratha, and a plate of chaat that somehow managed to taste both chaotic and perfectly balanced. That is what Chandni Chowk does best: it overwhelms you at first, then wins you over completely.",
      },
    ],
    highlights: ["Jama Masjid sunrise walk", "Spice market lanes", "Paratha and jalebi stops", "Haveli facades and old bazaars"],
    takeaway: "If you want to understand Delhi beyond monuments, spend a day walking Chandni Chowk with no strict plan. The best parts are often the turns you did not expect to take.",
  },
  "darjeeling-tiger-hill": {
    lead: "Darjeeling rewards patience. You wake before dawn, drive through cold mountain roads, and stand in the dark waiting for a horizon you cannot yet see. Then the light arrives, and suddenly every lost hour of sleep feels small.",
    sections: [
      {
        heading: "A Summit Before Sunrise",
        body: "Tiger Hill was already crowded when we reached, but it did not matter. Everyone was quiet in that mountain way, eyes fixed on the same line of sky. The first golden wash over Kanchenjunga came slowly, then all at once. People stopped talking, phones lowered, and the mountains took over the moment completely.",
      },
      {
        heading: "The Warmth After The Cold",
        body: "What stayed with me almost as much as the view was the feeling afterward. There is something deeply comforting about holding a paper cup of hot chai in freezing air while the sun finally warms your hands. In Darjeeling, even small rituals like that feel cinematic.",
      },
      {
        heading: "A Town Built For Slow Travel",
        body: "Back in town, the rest of the day unfolded gently. Tea gardens, colonial facades, the toy train, and the constant presence of mountain mist make Darjeeling feel like a place that asks you to slow down and actually look around.",
      },
    ],
    highlights: ["Tiger Hill viewpoint", "Kanchenjunga sunrise", "Hot chai after the climb", "Tea estates and toy train charm"],
    takeaway: "Darjeeling is best when you let it stay unhurried. Build one great sunrise into your trip and let the rest of the town fill in around it.",
  },
  "alleppey-houseboat": {
    lead: "Alleppey does not rush. The backwaters change your pace almost immediately, replacing traffic noise with the sound of water, birds, and long quiet stretches where nothing asks for your attention.",
    sections: [
      {
        heading: "Floating Through Village Life",
        body: "From the deck of the houseboat, Kerala feels intimate in a way cities rarely do. We passed school boats, tiny chapels, coconut groves, and homes that seemed to open directly onto the canals. It never felt staged. It felt like everyday life moving gently beside us.",
      },
      {
        heading: "Evenings On The Water",
        body: "By sunset, the sky turned copper and the boat slowed even more. Dinner was simple and fresh, with curry, rice, and fried fish, and the air smelled faintly of wet wood and jasmine. There is a softness to Alleppey nights that makes conversation naturally quieter and sleep come easier.",
      },
      {
        heading: "Why The Memory Lasts",
        body: "What makes a backwater stay memorable is not spectacle. It is the stillness. In a short trip, Alleppey creates the rare feeling that you have stepped outside the schedule of normal life and borrowed a calmer one instead.",
      },
    ],
    highlights: ["Houseboat stay", "Village canal scenes", "Fresh Kerala dinner", "Sunset over the backwaters"],
    takeaway: "Book at least one night on the water. Alleppey works best when you stop trying to do more and simply let the place slow you down.",
  },
  "jodhpur-blue-city": {
    lead: "Jodhpur is one of those cities that looks dramatic from a distance and even better up close. The blue walls are striking, but the real magic lives in the textures of daily life between them.",
    sections: [
      {
        heading: "A City Of Contrasts",
        body: "Mehrangarh Fort towers above everything, but below it the lanes feel personal and close-knit. You move from giant historic scale to tiny courtyards, doorways, and rooftop views within a few minutes. That contrast gives Jodhpur its energy.",
      },
      {
        heading: "Craft, Color, And Conversation",
        body: "I spent the best part of the afternoon simply wandering. Textile shops, spice sellers, antique corners, and little cafes appeared one after another. Nearly every conversation turned into a story about family, craft, or how the neighbourhood has changed over time.",
      },
      {
        heading: "Why Photographs Never Feel Enough",
        body: "Jodhpur is incredibly photogenic, but the camera only captures part of it. The city sounds alive, from temple chants to scooters to market chatter. You remember the colour first, but what stays is the atmosphere.",
      },
    ],
    highlights: ["Mehrangarh Fort views", "Blue-painted old city lanes", "Textiles and spice bazaars", "Sunset rooftops"],
    takeaway: "Spend time in the old city on foot. Jodhpur is not a place to rush through; its charm builds through small moments rather than one big checklist.",
  },
  "spiti-valley-camping": {
    lead: "Spiti feels stripped down in the best possible way. There is very little distraction, very little softness, and very little between you and the landscape. That is exactly what makes it unforgettable.",
    sections: [
      {
        heading: "Roads Into Another World",
        body: "The drive itself sets the tone. Roads cling to cliffs, villages appear unexpectedly, and every bend opens to a landscape that feels larger and barer than the last. By the time we reached camp, the valley already felt unlike anywhere else in India.",
      },
      {
        heading: "Night Under A Bigger Sky",
        body: "Camping here changes the scale of everything. The silence is deeper, the air thinner, and the night sky more crowded with stars than most people ever see. You stop speaking as much because the setting does not really need commentary.",
      },
      {
        heading: "Beauty With Edge",
        body: "Spiti is not polished travel. It asks a little more from you, whether that is long drives, unpredictable weather, or basic comforts. But in return, it gives something rarer: a sense of rawness that feels honest and deeply restorative.",
      },
    ],
    highlights: ["High-altitude valley roads", "Remote village stops", "Milky Way night skies", "Raw Himalayan terrain"],
    takeaway: "Go prepared, travel light, and leave space in your itinerary for pauses. Spiti’s strongest moments usually happen when you stop trying to rush to the next view.",
  },
  "marrakech-souks": {
    lead: "Marrakech is a city that works through sensation. Color, scent, music, heat, shadow, and movement all compete for your attention, and together they create something far more memorable than a simple sightseeing route.",
    sections: [
      {
        heading: "The Souk As A Maze",
        body: "Getting lost here is part of the experience. Turn one corner and you are in a lane of copper lamps, turn another and it is leather bags, pottery, woven rugs, or pyramids of spices. The medina rewards curiosity more than planning.",
      },
      {
        heading: "Rooftops, Riads, And Pause Points",
        body: "What balances the market intensity are the quiet pockets around it. Small courtyards, tiled riads, and rooftop cafes create breathing room. One moment you are in a packed alley, the next you are above it all with mint tea and the call to prayer echoing across the city.",
      },
      {
        heading: "Why It Feels So Distinct",
        body: "Marrakech has a strong visual identity, but it is the rhythm that stays with you. The city constantly shifts between intensity and calm, making even a short visit feel richly layered.",
      },
    ],
    highlights: ["Lamp and rug souks", "Mint tea rooftops", "Historic riads", "Spice and leather lanes"],
    takeaway: "Do not fight the maze. Pick a direction, stay aware of landmarks, and let Marrakech reveal itself in fragments.",
  },
  "kyoto-autumn": {
    lead: "Kyoto in autumn feels carefully composed without ever seeming artificial. Temples, gardens, lantern paths, and maple leaves come together so naturally that the city almost seems designed for quiet reflection.",
    sections: [
      {
        heading: "Walking Through Layers Of Time",
        body: "Kyoto is remarkable because it lets history feel present. Wooden facades, shrine gates, stone paths, and ritual spaces do not sit apart from everyday life. They are woven directly into it, which makes even a simple walk feel meaningful.",
      },
      {
        heading: "Autumn As Atmosphere",
        body: "The red and amber foliage is beautiful, of course, but it is more than a visual event. It changes the city’s mood. The light becomes softer, temple grounds feel quieter, and every garden looks even more deliberate than usual.",
      },
      {
        heading: "Small Moments That Stay",
        body: "What I remember most are the in-between moments: sipping matcha near a wooden teahouse, hearing leaves move across a temple courtyard, and turning a corner to find a near-empty lane glowing in late afternoon light.",
      },
    ],
    highlights: ["Temple gardens in autumn", "Fushimi Inari walks", "Teahouse pauses", "Historic lanes and shrines"],
    takeaway: "Kyoto is best experienced with light plans. Choose a few anchor sites and leave room for quiet wandering between them.",
  },
  "iceland-golden-circle": {
    lead: "Iceland makes dramatic scenery feel normal. On the Golden Circle, geysers, waterfalls, tectonic landscapes, and shifting skies appear so quickly that the route feels less like a road trip and more like a sequence of natural reveals.",
    sections: [
      {
        heading: "Every Stop Feels Elemental",
        body: "The first thing that struck me was the power of the landscape. Water, steam, lava fields, and wind shape everything. Even short stops feel cinematic because the environment is constantly moving or changing around you.",
      },
      {
        heading: "The Joy Of The Drive",
        body: "Some trips are about the destinations; this one is also about the distance between them. The road itself is part of the reward. You keep pulling over for one more ridge, one more patch of moss, one more impossible sky.",
      },
      {
        heading: "Why Iceland Feels Bigger Than Photos",
        body: "Pictures capture the color and scale, but not the atmosphere. The cold air, sulphur from geothermal zones, and the sheer emptiness of certain stretches give Iceland an emotional texture that is difficult to reproduce outside the experience itself.",
      },
    ],
    highlights: ["Geysir geothermal area", "Gullfoss waterfall", "Roadside volcanic landscapes", "Long scenic drive stretches"],
    takeaway: "Give yourself time between major stops. In Iceland, the unscheduled pullovers often become the strongest memories.",
  },
  "santorini-sunsets": {
    lead: "Santorini can seem almost unreal at first glance, but what makes it stay with you is not only the famous view. It is the way the island moves slowly through bright afternoons and soft, glowing evenings.",
    sections: [
      {
        heading: "Clifftop Beauty That Actually Delivers",
        body: "The whitewashed villages and blue domes are exactly as striking as people say. But being there in person gives them depth. Narrow stairways, small chapels, sea breeze, and the sound of plates and conversation from terrace restaurants make the scene feel lived in, not staged.",
      },
      {
        heading: "Sunset As A Shared Ritual",
        body: "By evening, everyone seems drawn toward the same edge of the island. Santorini sunsets are communal without feeling crowded. There is an unspoken understanding that everyone is there for the same reason and willing to pause for it.",
      },
      {
        heading: "A Good Place For Slow Indulgence",
        body: "Long lunches, sea views, cliffside paths, and unhurried nights are really the point here. Santorini works when you stop trying to optimize the experience and let the island feel generous on its own terms.",
      },
    ],
    highlights: ["Oia sunset viewpoints", "Clifftop village walks", "Terrace dining", "Island-hopping mood"],
    takeaway: "Plan one or two big viewpoints, but save time for cafe terraces and simple walks. Santorini’s luxury is often just the pace.",
  },
  "patagonia-argentina": {
    lead: "Patagonia feels immense in a way that changes your sense of distance. Mountains, glaciers, and open land do not frame the horizon here; they dominate it, making you feel small in the best possible way.",
    sections: [
      {
        heading: "The Scale Of The Landscape",
        body: "The first glacier view was almost disorienting because it felt too large to understand immediately. Ice, water, wind, and rock all seemed to move on a completely different scale than the one I am used to in daily life.",
      },
      {
        heading: "Adventure Without Noise",
        body: "Even when the trip is active, Patagonia never feels frantic. Hikes, boat rides, and long drives happen inside a landscape that keeps you mentally quiet. You are alert, but not crowded by distraction.",
      },
      {
        heading: "A Place That Resets Perspective",
        body: "That is probably Patagonia’s strongest gift. It makes ordinary concerns feel smaller for a while. The weather is wild, the terrain is dramatic, and the silence feels earned. You leave carrying a different scale inside your head.",
      },
    ],
    highlights: ["Perito Moreno glacier views", "Windy Patagonian trails", "Turquoise lakes", "Condor-filled skies"],
    takeaway: "Build extra time into a Patagonia itinerary. Weather, distance, and landscape all deserve more space than a tightly packed schedule allows.",
  },
};
