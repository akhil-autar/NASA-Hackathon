// Quick space questions for ages 7-12, in English and Bahasa Melayu.
// Used by Bolt's quiz during a mission and by the Class mode quiz round.
// Every answer is checked against the game's own NASA sources.
import type { Lang } from "../i18n";

export interface QuizQuestion {
  id: string;
  q: Record<Lang, string>;
  options: { icon: string; text: Record<Lang, string> }[];
  /** Index of the right option. */
  answer: number;
  why: Record<Lang, string>;
}

export const QUIZ: QuizQuestion[] = [
  {
    id: "source",
    q: { en: "Where do solar storms come from?", ms: "Dari manakah ribut suria datang?" },
    options: [
      { icon: "☀️", text: { en: "The Sun", ms: "Matahari" } },
      { icon: "🌍", text: { en: "Earth", ms: "Bumi" } },
      { icon: "🌙", text: { en: "The Moon", ms: "Bulan" } },
    ],
    answer: 0,
    why: {
      en: "A flare is a giant flash on the Sun. It can throw out tiny, fast particles.",
      ms: "Nyalaan ialah kilatan gergasi pada Matahari. Ia boleh melontarkan zarah kecil yang laju.",
    },
  },
  {
    id: "walls",
    q: { en: "What stops radiation best?", ms: "Apakah yang paling baik menghalang radiasi?" },
    options: [
      { icon: "🪟", text: { en: "A glass window", ms: "Tingkap kaca" } },
      { icon: "🧱", text: { en: "Thick walls and water", ms: "Dinding tebal dan air" } },
      { icon: "🎈", text: { en: "A balloon", ms: "Belon" } },
    ],
    answer: 1,
    why: {
      en: "Thick, heavy walls and tanks of water soak up the particles. That is what a storm shelter is for.",
      ms: "Dinding yang tebal dan tangki air menyerap zarah. Itulah guna tempat perlindungan ribut.",
    },
  },
  {
    id: "night",
    q: {
      en: "Why does the battery matter at night?",
      ms: "Kenapa bateri penting pada waktu malam?",
    },
    options: [
      { icon: "🥶", text: { en: "Batteries like the cold", ms: "Bateri suka sejuk" } },
      { icon: "👽", text: { en: "Aliens come out", ms: "Makhluk asing keluar" } },
      { icon: "🌙", text: { en: "Solar panels need sunlight", ms: "Panel solar perlukan cahaya matahari" } },
    ],
    answer: 2,
    why: {
      en: "Solar panels only make power in daylight. At night the base runs on what is saved in the battery.",
      ms: "Panel solar hanya menghasilkan kuasa pada waktu siang. Pada waktu malam pangkalan guna kuasa yang disimpan dalam bateri.",
    },
  },
  {
    id: "message",
    q: {
      en: "How long does a message from Earth take to reach Mars?",
      ms: "Berapa lama mesej dari Bumi mengambil masa untuk sampai ke Marikh?",
    },
    options: [
      { icon: "⚡", text: { en: "No time at all", ms: "Serta-merta" } },
      { icon: "⏱️", text: { en: "3 to 22 minutes", ms: "3 hingga 22 minit" } },
      { icon: "📅", text: { en: "One whole year", ms: "Setahun penuh" } },
    ],
    answer: 1,
    why: {
      en: "Even light needs minutes to cross the space between the planets, so Mars crews must think for themselves.",
      ms: "Cahaya pun memerlukan beberapa minit untuk merentas ruang antara planet, jadi kru Marikh mesti berfikir sendiri.",
    },
  },
  {
    id: "plants",
    q: {
      en: "What do greenhouse plants give the crew?",
      ms: "Apakah yang diberi oleh tanaman rumah hijau kepada kru?",
    },
    options: [
      { icon: "🥗", text: { en: "Food and fresh air", ms: "Makanan dan udara segar" } },
      { icon: "📺", text: { en: "Television", ms: "Televisyen" } },
      { icon: "🧊", text: { en: "Ice", ms: "Ais" } },
    ],
    answer: 0,
    why: {
      en: "Plants make oxygen and food. In 2015 astronauts ate lettuce they grew in space!",
      ms: "Tanaman menghasilkan oksigen dan makanan. Pada tahun 2015 angkasawan makan salad yang mereka tanam di angkasa!",
    },
  },
  {
    id: "sol",
    q: { en: "What is one day on Mars called?", ms: "Apakah nama untuk satu hari di Marikh?" },
    options: [
      { icon: "🔴", text: { en: "A sol", ms: "Sol" } },
      { icon: "🌑", text: { en: "A moonday", ms: "Hari bulan" } },
      { icon: "🪐", text: { en: "A planetday", ms: "Hari planet" } },
    ],
    answer: 0,
    why: {
      en: "A sol is one day on Mars. It is a little longer than a day on Earth.",
      ms: "Sol ialah satu hari di Marikh. Ia lebih panjang sedikit daripada sehari di Bumi.",
    },
  },
  {
    id: "allScience",
    q: {
      en: "What happens if you give ALL the power to science?",
      ms: "Apa berlaku jika SEMUA kuasa diberi kepada sains?",
    },
    options: [
      { icon: "😀", text: { en: "Everything is fine", ms: "Semuanya baik" } },
      { icon: "🚀", text: { en: "The base flies away", ms: "Pangkalan terbang" } },
      { icon: "🥶", text: { en: "The crew gets cold and unsafe", ms: "Kru kesejukan dan tidak selamat" } },
    ],
    answer: 2,
    why: {
      en: "Every job needs power. More for one job always means less for the others.",
      ms: "Setiap tugas perlukan kuasa. Lebih untuk satu tugas bermaksud kurang untuk yang lain.",
    },
  },
  {
    id: "limit",
    q: {
      en: "NASA's number 250 mSv is about…",
      ms: "Nombor NASA 250 mSv adalah tentang…",
    },
    options: [
      { icon: "🌡️", text: { en: "How hot Mars is", ms: "Betapa panas Marikh" } },
      { icon: "☢️", text: { en: "The most radiation allowed in one storm", ms: "Radiasi paling banyak dibenarkan dalam satu ribut" } },
      { icon: "🏎️", text: { en: "How fast the rover drives", ms: "Kelajuan rover" } },
    ],
    answer: 1,
    why: {
      en: "NASA keeps each astronaut under 250 mSv in one big solar storm, to keep them healthy.",
      ms: "NASA memastikan setiap angkasawan kurang daripada 250 mSv dalam satu ribut suria besar, supaya mereka kekal sihat.",
    },
  },
];

/** A question picked from a number (e.g. the storm seed), so it is fair and repeatable. */
export function quizFor(n: number): QuizQuestion {
  return QUIZ[Math.abs(Math.floor(n)) % QUIZ.length];
}
