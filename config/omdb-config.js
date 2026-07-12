// OMDb API configuration
// Note: this is a demo/public key from OMDb docs — replace with your own for production.
const OMDB_API_KEY = "63860ce8";
const OMDB_BASE_URL = "https://www.omdbapi.com/";

const MOVIE_COLLECTIONS = {
  tamil: [
    "Leo",
    "Vikram",
    "Jailer",
    "Master",
    "Soorarai Pottru",
    "Amaran",
    "Dragon",
    "Good Bad Ugly",
  ],
  malayalam: [
    "Manjummel Boys",
    "Premalu",
    "Aavesham",
    "2018",
    "Bramayugam",
    "Lucifer",
    "Kannur Squad",
  ],
  english: [
    "Interstellar",
    "Inception",
    "Avengers Endgame",
    "Oppenheimer",
    "Dune",
    "John Wick",
    "The Batman",
    "Top Gun Maverick",
  ],
  action: [
    "John Wick",
    "Mad Max Fury Road",
    "The Dark Knight",
    "Gladiator",
    "Extraction",
    "The Raid",
  ],
  scifi: [
    "Interstellar",
    "Inception",
    "Dune",
    "The Matrix",
    "Blade Runner 2049",
    "Arrival",
    "Ex Machina",
  ],
};

const ROWS = [
  { title: "Trending Tamil Movies", key: "tamil" },
  { title: "Latest Tamil Releases", key: "tamil", reverse: true },
  { title: "Top Rated Tamil Movies", key: "tamil" },
  { title: "Tamil Action Collection", key: "tamil" },
  { title: "Trending Malayalam Movies", key: "malayalam" },
  { title: "Latest Malayalam Releases", key: "malayalam", reverse: true },
  { title: "Top Rated Malayalam Movies", key: "malayalam" },
  { title: "Malayalam Family Collection", key: "malayalam" },
  { title: "Trending Worldwide", key: "english" },
  { title: "Popular Hollywood Movies", key: "english" },
  { title: "Top Rated English Movies", key: "english", reverse: true },
  { title: "Action Blockbusters", key: "action" },
  { title: "Sci-Fi Collection", key: "scifi" },
];
