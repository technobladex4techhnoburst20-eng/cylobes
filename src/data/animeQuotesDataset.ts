export interface AnimeQuoteItem {
  id: string;
  category: string;
  text: string;
  character: string;
  animeTitle: string;
  author: string;
  imageUrl: string;
  createdAt: number;
}

// Category mapping with anime characters & aesthetic portrait images
export const ANIME_CATEGORY_META: Record<string, { character: string; animeTitle: string; image: string }> = {
  Motivation: {
    character: "Rock Lee",
    animeTitle: "Naruto",
    image: "https://www.ghibli.jp/gallery/howl005.jpg",
  },
  Success: {
    character: "All Might (Toshinori Yagi)",
    animeTitle: "My Hero Academia",
    image: "https://www.ghibli.jp/gallery/chihiro014.jpg",
  },
  Failure: {
    character: "Edward Elric",
    animeTitle: "Fullmetal Alchemist: Brotherhood",
    image: "https://www.ghibli.jp/gallery/ponyo001.jpg",
  },
  Friends: {
    character: "Gon Freecss & Killua",
    animeTitle: "Hunter x Hunter",
    image: "https://www.ghibli.jp/gallery/mononoke001.jpg",
  },
  "Best Friends": {
    character: "Monkey D. Luffy & Roronoa Zoro",
    animeTitle: "One Piece",
    image: "https://www.ghibli.jp/gallery/totoro001.jpg",
  },
  Brotherhood: {
    character: "Portgas D. Ace & Sabo & Luffy",
    animeTitle: "One Piece",
    image: "https://www.ghibli.jp/gallery/marnie014.jpg",
  },
  Sisterhood: {
    character: "Shinobu Kocho & Kanao",
    animeTitle: "Demon Slayer",
    image: "https://www.ghibli.jp/gallery/kaguya001.jpg",
  },
  Loyalty: {
    character: "Roronoa Zoro",
    animeTitle: "One Piece",
    image: "https://www.ghibli.jp/gallery/kazetachinu001.jpg",
  },
  Trust: {
    character: "Kakashi Hatake",
    animeTitle: "Naruto Shippuden",
    image: "https://www.ghibli.jp/gallery/kokurikozaka001.jpg",
  },
  Love: {
    character: "Kaori Miyazono",
    animeTitle: "Your Lie in April",
    image: "https://www.ghibli.jp/gallery/karigurashi001.jpg",
  },
  Romantic: {
    character: "Taki Tachibana & Mitsuha Miyamizu",
    animeTitle: "Your Name (Kimi no Na wa)",
    image: "https://www.ghibli.jp/gallery/porco001.jpg",
  },
  Crush: {
    character: "Marin Kitagawa",
    animeTitle: "My Dress-Up Darling",
    image: "https://www.ghibli.jp/gallery/majo001.jpg",
  },
  Breakup: {
    character: "Spike Spiegel",
    animeTitle: "Cowboy Bebop",
    image: "https://www.ghibli.jp/gallery/howl042.jpg",
  },
  Heartbreak: {
    character: "Ken Kaneki",
    animeTitle: "Tokyo Ghoul",
    image: "https://www.ghibli.jp/gallery/chihiro043.jpg",
  },
  Care: {
    character: "Tanjiro Kamado",
    animeTitle: "Demon Slayer: Kimetsu no Yaiba",
    image: "https://www.ghibli.jp/gallery/ged001.jpg",
  },
  Kindness: {
    character: "Shigeo Kageyama (Mob)",
    animeTitle: "Mob Psycho 100",
    image: "https://www.ghibli.jp/gallery/yamada001.jpg",
  },
  Family: {
    character: "Loid, Anya & Yor Forger",
    animeTitle: "Spy x Family",
    image: "https://www.ghibli.jp/gallery/mimi001.jpg",
  },
  Sad: {
    character: "Violet Evergarden",
    animeTitle: "Violet Evergarden",
    image: "https://www.ghibli.jp/gallery/heisei001.jpg",
  },
  Emotional: {
    character: "Kyojuro Rengoku",
    animeTitle: "Demon Slayer: Mugen Train",
    image: "https://www.ghibli.jp/gallery/omoide001.jpg",
  },
  Drama: {
    character: "Lelouch Lamperouge",
    animeTitle: "Code Geass: Lelouch of the Rebellion",
    image: "https://www.ghibli.jp/gallery/laputa001.jpg",
  },
  Hope: {
    character: "Madoka Kaname",
    animeTitle: "Puella Magi Madoka Magica",
    image: "https://www.ghibli.jp/gallery/nausicaa001.jpg",
  },
  Healing: {
    character: "Frieren",
    animeTitle: "Frieren: Beyond Journey's End",
    image: "https://www.ghibli.jp/gallery/howl005.jpg",
  },
  Peace: {
    character: "Thorfinn Karlsefni",
    animeTitle: "Vinland Saga",
    image: "https://www.ghibli.jp/gallery/chihiro014.jpg",
  },
  Freedom: {
    character: "Eren Yeager",
    animeTitle: "Attack on Titan",
    image: "https://www.ghibli.jp/gallery/ponyo001.jpg",
  },
  Courage: {
    character: "Erwin Smith",
    animeTitle: "Attack on Titan",
    image: "https://www.ghibli.jp/gallery/mononoke001.jpg",
  },
  Wisdom: {
    character: "Uncle Iroh",
    animeTitle: "Avatar: The Last Airbender",
    image: "https://www.ghibli.jp/gallery/totoro001.jpg",
  },
  Life: {
    character: "Gintoki Sakata",
    animeTitle: "Gintama",
    image: "https://www.ghibli.jp/gallery/marnie014.jpg",
  },
  Dark: {
    character: "Guts",
    animeTitle: "Berserk",
    image: "https://www.ghibli.jp/gallery/kaguya001.jpg",
  },
  Psycho: {
    character: "Johan Liebert",
    animeTitle: "Monster",
    image: "https://www.ghibli.jp/gallery/kazetachinu001.jpg",
  },
  "Psychopathic Villain": {
    character: "Ryomen Sukuna",
    animeTitle: "Jujutsu Kaisen",
    image: "https://www.ghibli.jp/gallery/kokurikozaka001.jpg",
  },
  Manipulation: {
    character: "Sosuke Aizen",
    animeTitle: "Bleach",
    image: "https://www.ghibli.jp/gallery/karigurashi001.jpg",
  },
  Revenge: {
    character: "Sasuke Uchiha",
    animeTitle: "Naruto Shippuden",
    image: "https://www.ghibli.jp/gallery/porco001.jpg",
  },
  Villain: {
    character: "Madara Uchiha",
    animeTitle: "Naruto Shippuden",
    image: "https://www.ghibli.jp/gallery/majo001.jpg",
  },
  Hero: {
    character: "Izuku Midoriya (Deku)",
    animeTitle: "My Hero Academia",
    image: "https://www.ghibli.jp/gallery/howl042.jpg",
  },
  "Anti-Hero": {
    character: "Shadow (Cid Kagenou)",
    animeTitle: "The Eminence in Shadow",
    image: "https://www.ghibli.jp/gallery/chihiro043.jpg",
  },
  Mystery: {
    character: "L Lawliet",
    animeTitle: "Death Note",
    image: "https://www.ghibli.jp/gallery/ged001.jpg",
  },
  Horror: {
    character: "Alucard",
    animeTitle: "Hellsing Ultimate",
    image: "https://www.ghibli.jp/gallery/yamada001.jpg",
  },
  Comedy: {
    character: "Kazuma Satou",
    animeTitle: "KonoSuba: God's Blessing on this Wonderful World!",
    image: "https://www.ghibli.jp/gallery/mimi001.jpg",
  },
  Meme: {
    character: "Anya Forger",
    animeTitle: "Spy x Family",
    image: "https://www.ghibli.jp/gallery/heisei001.jpg",
  },
  School: {
    character: "Koro-sensei",
    animeTitle: "Assassination Classroom",
    image: "https://www.ghibli.jp/gallery/omoide001.jpg",
  },
  Fantasy: {
    character: "Rimuru Tempest",
    animeTitle: "That Time I Got Reincarnated as a Slime",
    image: "https://www.ghibli.jp/gallery/laputa001.jpg",
  },
  Fairy: {
    character: "Lucy Heartfilia & Natsu Dragneel",
    animeTitle: "Fairy Tail",
    image: "https://www.ghibli.jp/gallery/nausicaa001.jpg",
  },
  Magic: {
    character: "Megumin",
    animeTitle: "KonoSuba",
    image: "https://www.ghibli.jp/gallery/howl005.jpg",
  },
  Adventure: {
    character: "Monkey D. Luffy",
    animeTitle: "One Piece",
    image: "https://www.ghibli.jp/gallery/chihiro014.jpg",
  },
  Gaming: {
    character: "Sora & Shiro (Blank)",
    animeTitle: "No Game No Life",
    image: "https://www.ghibli.jp/gallery/ponyo001.jpg",
  },
  Games: {
    character: "Yugi Muto & Yami Yugi",
    animeTitle: "Yu-Gi-Oh!",
    image: "https://www.ghibli.jp/gallery/mononoke001.jpg",
  },
  Sports: {
    character: "Shoyo Hinata",
    animeTitle: "Haikyuu!!",
    image: "https://www.ghibli.jp/gallery/totoro001.jpg",
  },
  Football: {
    character: "Yoichi Isagi",
    animeTitle: "Blue Lock",
    image: "https://www.ghibli.jp/gallery/marnie014.jpg",
  },
  Basketball: {
    character: "Tetsuya Kuroko & Kagami",
    animeTitle: "Kuroko's Basketball",
    image: "https://www.ghibli.jp/gallery/kaguya001.jpg",
  },
  Racing: {
    character: "Takumi Fujiwara",
    animeTitle: "Initial D",
    image: "https://www.ghibli.jp/gallery/kazetachinu001.jpg",
  },
  Fighting: {
    character: "Baki Hanma",
    animeTitle: "Baki the Grappler",
    image: "https://www.ghibli.jp/gallery/kokurikozaka001.jpg",
  },
  Nature: {
    character: "San & Ashitaka",
    animeTitle: "Princess Mononoke (Studio Ghibli)",
    image: "https://www.ghibli.jp/gallery/karigurashi001.jpg",
  },
  Forest: {
    character: "Ginko",
    animeTitle: "Mushishi",
    image: "https://www.ghibli.jp/gallery/porco001.jpg",
  },
  Ocean: {
    character: "Jinbe & Straw Hat Crew",
    animeTitle: "One Piece",
    image: "https://www.ghibli.jp/gallery/majo001.jpg",
  },
  Mountains: {
    character: "Tanjiro Kamado (Mt. Sagiri)",
    animeTitle: "Demon Slayer",
    image: "https://www.ghibli.jp/gallery/howl042.jpg",
  },
  Birds: {
    character: "Hawks (Keigo Takami)",
    animeTitle: "My Hero Academia",
    image: "https://www.ghibli.jp/gallery/chihiro043.jpg",
  },
  Cats: {
    character: "Happy",
    animeTitle: "Fairy Tail",
    image: "https://www.ghibli.jp/gallery/ged001.jpg",
  },
  Dogs: {
    character: "Bond Forger",
    animeTitle: "Spy x Family",
    image: "https://www.ghibli.jp/gallery/yamada001.jpg",
  },
  Animals: {
    character: "Tony Tony Chopper",
    animeTitle: "One Piece",
    image: "https://www.ghibli.jp/gallery/mimi001.jpg",
  },
  Space: {
    character: "Spike Spiegel",
    animeTitle: "Cowboy Bebop",
    image: "https://www.ghibli.jp/gallery/heisei001.jpg",
  },
  Galaxy: {
    character: "Simon the Digger",
    animeTitle: "Tengen Toppa Gurren Lagann",
    image: "https://www.ghibli.jp/gallery/omoide001.jpg",
  },
  Dreams: {
    character: "Naruto Uzumaki",
    animeTitle: "Naruto",
    image: "https://www.ghibli.jp/gallery/laputa001.jpg",
  },
  Night: {
    character: "Itachi Uchiha",
    animeTitle: "Naruto Shippuden",
    image: "https://www.ghibli.jp/gallery/nausicaa001.jpg",
  },
  Stars: {
    character: "Taki & Mitsuha (Starfall)",
    animeTitle: "Your Name",
    image: "https://www.ghibli.jp/gallery/howl005.jpg",
  },
  Sunrise: {
    character: "Tanjiro & Nezuko",
    animeTitle: "Demon Slayer: Swordsmith Village",
    image: "https://www.ghibli.jp/gallery/chihiro014.jpg",
  },
  Sunset: {
    character: "Spike Spiegel (Sunset Farewell)",
    animeTitle: "Cowboy Bebop",
    image: "https://www.ghibli.jp/gallery/ponyo001.jpg",
  },
  Rain: {
    character: "Roy Mustang (In the Rain)",
    animeTitle: "Fullmetal Alchemist",
    image: "https://www.ghibli.jp/gallery/mononoke001.jpg",
  },
  Winter: {
    character: "Frieren & Fern (Winter Crossing)",
    animeTitle: "Frieren: Beyond Journey's End",
    image: "https://www.ghibli.jp/gallery/totoro001.jpg",
  },
  Summer: {
    character: "Shinichi & Ran",
    animeTitle: "Detective Conan",
    image: "https://www.ghibli.jp/gallery/marnie014.jpg",
  },
  Travel: {
    character: "Kino & Hermes",
    animeTitle: "Kino's Journey",
    image: "https://www.ghibli.jp/gallery/kaguya001.jpg",
  },
  Warrior: {
    character: "Miyamoto Musashi",
    animeTitle: "Vagabond",
    image: "https://www.ghibli.jp/gallery/kazetachinu001.jpg",
  },
  Samurai: {
    character: "Himura Kenshin",
    animeTitle: "Rurouni Kenshin",
    image: "https://www.ghibli.jp/gallery/kokurikozaka001.jpg",
  },
  Ninja: {
    character: "Naruto Uzumaki & Minato",
    animeTitle: "Naruto Shippuden",
    image: "https://www.ghibli.jp/gallery/karigurashi001.jpg",
  },
  King: {
    character: "Gilgamesh",
    animeTitle: "Fate/stay night & Fate/Zero",
    image: "https://www.ghibli.jp/gallery/porco001.jpg",
  },
  Queen: {
    character: "Artoria Pendragon (Saber)",
    animeTitle: "Fate/stay night",
    image: "https://www.ghibli.jp/gallery/majo001.jpg",
  },
  Princess: {
    character: "Yona",
    animeTitle: "Yona of the Dawn (Akatsuki no Yona)",
    image: "https://www.ghibli.jp/gallery/howl042.jpg",
  },
  Dragon: {
    character: "Kaido (Dragon Form)",
    animeTitle: "One Piece",
    image: "https://www.ghibli.jp/gallery/chihiro043.jpg",
  },
  Demon: {
    character: "Meliodas (Demon Form)",
    animeTitle: "The Seven Deadly Sins",
    image: "https://www.ghibli.jp/gallery/ged001.jpg",
  },
  Angel: {
    character: "Kanade Tachibana (Angel)",
    animeTitle: "Angel Beats!",
    image: "https://www.ghibli.jp/gallery/yamada001.jpg",
  },
  "Sci-Fi": {
    character: "Motoko Kusanagi",
    animeTitle: "Ghost in the Shell",
    image: "https://www.ghibli.jp/gallery/mimi001.jpg",
  },
  Cyberpunk: {
    character: "David Martinez & Lucy",
    animeTitle: "Cyberpunk: Edgerunners",
    image: "https://www.ghibli.jp/gallery/heisei001.jpg",
  },
  Apocalypse: {
    character: "Eren Yeager (The Rumbling)",
    animeTitle: "Attack on Titan: The Final Season",
    image: "https://www.ghibli.jp/gallery/omoide001.jpg",
  },
};

export const ANIME_CATEGORIES_LIST = [
  "Motivation", "Success", "Failure", "Friends", "Best Friends", "Brotherhood", "Sisterhood",
  "Loyalty", "Trust", "Love", "Romantic", "Crush", "Breakup", "Heartbreak", "Care", "Kindness",
  "Family", "Sad", "Emotional", "Drama", "Hope", "Healing", "Peace", "Freedom", "Courage",
  "Wisdom", "Life", "Dark", "Psycho", "Psychopathic Villain", "Manipulation", "Revenge", "Villain",
  "Hero", "Anti-Hero", "Mystery", "Horror", "Comedy", "Meme", "School", "Fantasy", "Fairy", "Magic",
  "Adventure", "Gaming", "Games", "Sports", "Football", "Basketball", "Racing", "Fighting",
  "Nature", "Forest", "Ocean", "Mountains", "Birds", "Cats", "Dogs", "Animals", "Space", "Galaxy",
  "Dreams", "Night", "Stars", "Sunrise", "Sunset", "Rain", "Winter", "Summer", "Travel", "Warrior",
  "Samurai", "Ninja", "King", "Queen", "Princess", "Dragon", "Demon", "Angel", "Sci-Fi", "Cyberpunk",
  "Apocalypse"
];
