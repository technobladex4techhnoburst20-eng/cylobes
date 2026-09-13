const fs = require('fs');

const ghibliImages = [
  "https://www.ghibli.jp/gallery/howl005.jpg",
  "https://www.ghibli.jp/gallery/chihiro014.jpg",
  "https://www.ghibli.jp/gallery/ponyo001.jpg",
  "https://www.ghibli.jp/gallery/mononoke001.jpg",
  "https://www.ghibli.jp/gallery/totoro001.jpg",
  "https://www.ghibli.jp/gallery/marnie014.jpg",
  "https://www.ghibli.jp/gallery/kaguya001.jpg",
  "https://www.ghibli.jp/gallery/kazetachinu001.jpg",
  "https://www.ghibli.jp/gallery/kokurikozaka001.jpg",
  "https://www.ghibli.jp/gallery/karigurashi001.jpg",
  "https://www.ghibli.jp/gallery/porco001.jpg",
  "https://www.ghibli.jp/gallery/majo001.jpg",
  "https://www.ghibli.jp/gallery/howl042.jpg",
  "https://www.ghibli.jp/gallery/chihiro043.jpg",
  "https://www.ghibli.jp/gallery/ged001.jpg",
  "https://www.ghibli.jp/gallery/yamada001.jpg",
  "https://www.ghibli.jp/gallery/mimi001.jpg",
  "https://www.ghibli.jp/gallery/heisei001.jpg",
  "https://www.ghibli.jp/gallery/omoide001.jpg",
  "https://www.ghibli.jp/gallery/laputa001.jpg",
  "https://www.ghibli.jp/gallery/nausicaa001.jpg"
];

let content = fs.readFileSync('src/data/animeQuotesDataset.ts', 'utf-8');

let count = 0;
content = content.replace(/image: "https:\/\/images\.unsplash\.com\/[^"]+"/g, (match) => {
  const ghibliImg = ghibliImages[count % ghibliImages.length];
  count++;
  return `image: "${ghibliImg}"`;
});

fs.writeFileSync('src/data/animeQuotesDataset.ts', content);
console.log(`Replaced ${count} images.`);
