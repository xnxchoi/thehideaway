/**
 * Demimonde — skeleton copy.
 *
 * Lorem ipsum placeholders for every user-facing string on the page.
 * Real party copy will overwrite this. Keep shapes stable so swapping
 * text is a one-file change.
 *
 * Athens-26 reference influence: text-first, plain Q&A FAQ, shorthand
 * facts, no marketing chrome. Lorem feels intentionally light.
 */

export const HERO = {
  eyebrow: "Vol. VI · An Invitation",
  titleLead: "lorem ipsum",
  titleAccent: "dolor sit amet",
  sub: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua — one Sunday, in the garden, before summer admits it has arrived.",
  meta: [
    { label: "When", value: "Sunday · 25 May 2026" },
    { label: "Where", value: "Hannam · garden floor" },
    { label: "Doors", value: "From 14:00, sun to dusk" },
    { label: "Dress", value: "Linen, sandals, no jackets" }
  ]
};

export const TURNTABLE = {
  eyebrow: "The soundtrack",
  titleLead: "spinning all",
  titleAccent: "afternoon",
  blurb:
    "Lorem ipsum dolor sit amet — a slow rotation of summer staples, low-stakes B-sides, and a few records the host can't stop replaying. Press play; it'll keep going through the toasts.",
  creditsLabel: "Curated by",
  credits: "YM.FM · seven hours, on loop",
  label: { line1: "YM", line2: "FM" },
  cta: {
    href: "/radio",
    aria: "Open the YM.FM radio in a new window"
  }
};

export const FACTS = [
  {
    label: "The date",
    value: "Sun, 25 May",
    note: "single afternoon, sun to dusk"
  },
  {
    label: "The address",
    value: "Lorem garden, ipsum-dong",
    link: { href: "https://maps.google.com", text: "Open in maps →" }
  },
  {
    label: "The headcount",
    value: "32 names, 4 dogs",
    note: "RSVP by Friday"
  },
  {
    label: "The asks",
    value: "A bottle, a bowl, a song",
    note: "details below"
  }
];

export const WELCOME = {
  eyebrow: "Welcome",
  title: "The longest afternoon",
  blockquote:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit — no work, only fruit, only friends, only fire.",
  paragraphs: [
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. **Excepteur sint occaecat** cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis."
  ]
};

export const PACKING = {
  eyebrow: "Bring",
  title: "What to put in the basket",
  lede: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Six things, none of them difficult.",
  items: [
    {
      head: "A bottle of something cold",
      body: "Lorem ipsum dolor sit — wine, soju, sparkling tea, whatever you'd actually drink in the sun."
    },
    {
      head: "A bowl or a dish",
      body: "Consectetur adipiscing — one thing to share, room temperature is fine, no reheating."
    },
    {
      head: "A song, on paper",
      body: "Sed do eiusmod tempor — write down one track and a sentence about why; we'll play through them after dinner."
    },
    {
      head: "Slippers or sandals",
      body: "Ut enim ad minim veniam — the grass is the floor, the floor is the grass."
    },
    {
      head: "Something to sit on",
      body: "Quis nostrud exercitation — a cushion, a blanket, a towel. There are not enough chairs and we like it that way."
    },
    {
      head: "A camera, optionally",
      body: "Duis aute irure — film preferred, phones acceptable, posting elsewhere strongly discouraged."
    }
  ]
};

export const SCHEDULE = {
  eyebrow: "The day",
  title: "An afternoon, four chapters",
  lede: "Lorem ipsum — times are suggestions, the only fixed point is the second course at sundown.",
  days: [
    {
      label: "Chapter I",
      title: "Arrival & sun",
      date: "14:00 — 16:00",
      blocks: [
        {
          time: "14:00",
          head: "Doors, lemonade, hammocks",
          body: "Lorem ipsum dolor sit amet. Come in, leave your shoes by the gate, find the cold water on the side table.",
          link: { href: "https://maps.google.com", text: "Garden gate ↗" }
        },
        {
          time: "14:30",
          head: "Garden tour (optional)",
          body: "Consectetur adipiscing — the tomato bed, the fig tree, the part of the lawn we accidentally killed last year."
        },
        {
          time: "15:30",
          head: "First course — cold things",
          body: "Sed do eiusmod tempor incididunt — ceviche, melon, cucumber salt, the first round of the bottle you brought."
        }
      ]
    },
    {
      label: "Chapter II",
      title: "Cookout proper",
      date: "16:00 — 19:00",
      blocks: [
        {
          time: "16:00",
          head: "Fire is lit",
          body: "Lorem ipsum — coals, smoke, the smell that ends a workweek faster than anything else."
        },
        {
          time: "17:30",
          head: "Main course — second course ★",
          body: "Excepteur sint occaecat — grilled fish, lamb shoulder, two kinds of bread, the salad nobody can stop eating.",
          star: true
        },
        {
          time: "18:30",
          head: "Toasts (brief, please)",
          body: "Ut perspiciatis unde omnis — three minutes maximum, no slideshows, no business updates, no apologies."
        }
      ]
    },
    {
      label: "Chapter III",
      title: "Music & dessert",
      date: "19:00 — 21:30",
      blocks: [
        {
          time: "19:00",
          head: "Songs you brought, in order",
          body: "Voluptatem accusantium — we play the records in the order you arrive, one each, no skipping."
        },
        {
          time: "20:00",
          head: "Dessert, slowly",
          body: "Doloremque laudantium — peaches in wine, cheese, espresso, the second bottle that always shows up."
        },
        {
          time: "21:00",
          head: "Lanterns on",
          body: "Eaque ipsa quae — the string lights go up, the music turns down, the talkers find each other."
        }
      ]
    },
    {
      label: "Chapter IV",
      title: "Embers",
      date: "21:30 — late",
      blocks: [
        {
          time: "21:30",
          head: "Fire pit, second wind",
          body: "Ab illo inventore — whiskey, marshmallows for the children among us, a quieter room indoors for the rest."
        },
        {
          time: "23:00",
          head: "Soft close",
          body: "Veritatis et quasi — last train is 23:42; cabs in 8 min; spare bed in the back room if you've had too much sun."
        }
      ]
    }
  ]
};

export const MAP = {
  eyebrow: "Where",
  title: "Find the garden",
  lede: "Lorem ipsum — twelve minutes from the station, eight by cab, two from the convenience store on the corner. The gate is the one with the lemon tree.",
  address: {
    line1: "12 Lorem-gil, Hannam-dong",
    line2: "Yongsan-gu, Seoul · 04400"
  },
  caption: "Hannam · garden floor · approx.",
  legend: [
    { mark: "STATION", value: "Hannam — line 6" },
    { mark: "PARK", value: "across the road, on the south side" },
    { mark: "RIVER", value: "the Han, three blocks south" }
  ],
  metadata: [
    { label: "Coordinates", value: "37.534° N · 126.998° E" },
    { label: "Closest station", value: "Hannam — line 6, 12 min" },
    { label: "Last train", value: "23:42 · weeknights 00:08" }
  ],
  ctas: [
    {
      text: "Open in Google Maps",
      href: "https://maps.google.com/?q=Hannam-dong+Seoul"
    },
    {
      text: "Naver Map",
      href: "https://map.naver.com"
    }
  ]
};

export const DIRECTIONS = {
  eyebrow: "Getting there",
  title: "Four ways in",
  items: [
    {
      label: "By subway",
      body: "Lorem ipsum — 12 minutes' walk from the closest station, mostly downhill. The route is signposted poorly; follow the bakery smell.",
      link: { href: "https://maps.google.com", text: "Walking route ↗" }
    },
    {
      label: "By taxi",
      body: "Consectetur adipiscing — drivers know the alley mouth but not the gate. Tell them to stop at the convenience store; the rest is 90 seconds on foot.",
      link: { href: "https://maps.google.com", text: "Drop pin ↗" }
    },
    {
      label: "By car",
      body: "Sed do eiusmod — three spots on the side road, first come first parked. After that, the public lot two blocks east is free on Sundays."
    },
    {
      label: "On foot",
      body: "Ut enim ad minim veniam — if you live in the neighborhood, the back gate is the more interesting walk. Ask the host for the unmarked path."
    }
  ]
};

export const PHRASES = {
  eyebrow: "Phrases",
  title: "Things to say, in order",
  lede: "Lorem ipsum — call them out loud during the toast, or save them for the awkward middle stretch.",
  rows: [
    { en: "Cheers / to the table", say: "geon-bae", native: "건배" },
    { en: "Eat well", say: "jal meo-geo-yo", native: "잘 먹어요" },
    {
      en: "It's the second bottle",
      say: "doo-bbeon-jjae byeong",
      native: "두 번째 병"
    },
    { en: "More fire, please", say: "bul jom deo", native: "불 좀 더" },
    {
      en: "I love this song",
      say: "i no-rae jo-ah-yo",
      native: "이 노래 좋아요"
    },
    {
      en: "One more, then home",
      say: "han-jan deo, jip-eu-ro",
      native: "한 잔 더, 집으로"
    },
    {
      en: "It's still light outside",
      say: "ba-kkat-i a-jik bal-ga-yo",
      native: "바깥이 아직 밝아요"
    }
  ]
};

export const FAQ = {
  eyebrow: "Practicals",
  title: "Things you'll wonder about",
  items: [
    {
      q: "How do I get there?",
      a: [
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. The address is on the Facts strip above; tap it to open in Google Maps.",
        "The closest station is 12 minutes' walk; taxis drop at the alley mouth. If you're driving, the side road has space for three cars — first come, first parked."
      ]
    },
    {
      q: "What if it rains?",
      a: [
        "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. The fire moves under the canopy and the music moves inside. We've done it before; it's actually better."
      ]
    },
    {
      q: "Can I bring a +1?",
      a: [
        "Ut enim ad minim veniam, quis nostrud exercitation. Yes, but text first so we know the count for the second course. Romantic partners assumed; new friends okay; people you owe favors to discouraged."
      ]
    },
    {
      q: "Dogs?",
      a: [
        "Duis aute irure dolor in reprehenderit. There will be four. Yours is welcome if it gets along with four; otherwise leave it home with someone it loves."
      ]
    },
    {
      q: "What about photos?",
      a: [
        "Excepteur sint occaecat cupidatat non proident. Take whatever you want. Don't post anything with someone else in it without asking; the group folder for swap-after will be linked in the day-of thread."
      ]
    },
    {
      q: "What if I can't make it?",
      a: [
        "Sunt in culpa qui officia deserunt mollit anim id est laborum. Send a song anyway — we'll play it for you and tell you later who was in the room when it came on."
      ]
    },
    {
      q: "Who do I text the day of?",
      a: [
        "The host. The number is in the original message. If you've lost the message you've also lost your invitation; ask the person who forwarded it to you."
      ]
    }
  ]
};

export const CLOSING = {
  mark: "And that's the whole page",
  line: "See you in the garden, then. Bring something cold.",
  meta: "RSVP by Friday — yes / no / late. No emoji.",
  cta: {
    text: "RSVP — yes, count me in",
    href: "mailto:host@example.com?subject=RSVP%20%E2%80%94%20yes",
    aria: "Send an RSVP email"
  },
  hosts: {
    label: "Hosted by",
    names: "Lorem & Ipsum",
    contact: "host@example.com"
  }
};
