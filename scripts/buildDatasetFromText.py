import json
import re

# Category character and anime map
category_meta = {
  "Motivation": {"char": "Rock Lee", "anime": "Naruto", "img": "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80"},
  "Success": {"char": "All Might", "anime": "My Hero Academia", "img": "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80"},
  "Failure": {"char": "Edward Elric", "anime": "Fullmetal Alchemist", "img": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80"},
  "Friends": {"char": "Gon Freecss", "anime": "Hunter x Hunter", "img": "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80"},
  "Best Friends": {"char": "Monkey D. Luffy", "anime": "One Piece", "img": "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80"},
  "Brotherhood": {"char": "Portgas D. Ace", "anime": "One Piece", "img": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80"},
  "Sisterhood": {"char": "Shinobu Kocho", "anime": "Demon Slayer", "img": "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=600&q=80"},
  "Loyalty": {"char": "Roronoa Zoro", "anime": "One Piece", "img": "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80"},
  "Trust": {"char": "Kakashi Hatake", "anime": "Naruto Shippuden", "img": "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80"},
  "Love": {"char": "Kaori Miyazono", "anime": "Your Lie in April", "img": "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=600&q=80"},
  "Romantic": {"char": "Taki Tachibana", "anime": "Your Name", "img": "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80"},
  "Crush": {"char": "Marin Kitagawa", "anime": "My Dress-Up Darling", "img": "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80"},
  "Breakup": {"char": "Spike Spiegel", "anime": "Cowboy Bebop", "img": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80"},
  "Heartbreak": {"char": "Ken Kaneki", "anime": "Tokyo Ghoul", "img": "https://images.unsplash.com/photo-1514533450685-4493e01d1fdc?auto=format&fit=crop&w=600&q=80"},
  "Care": {"char": "Tanjiro Kamado", "anime": "Demon Slayer", "img": "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80"},
  "Kindness": {"char": "Shigeo Kageyama (Mob)", "anime": "Mob Psycho 100", "img": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80"},
  "Family": {"char": "Loid Forger", "anime": "Spy x Family", "img": "https://images.unsplash.com/photo-1569701813229-33284b643e3c?auto=format&fit=crop&w=600&q=80"},
  "Sad": {"char": "Violet Evergarden", "anime": "Violet Evergarden", "img": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80"},
  "Emotional": {"char": "Kyojuro Rengoku", "anime": "Demon Slayer", "img": "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80"},
  "Drama": {"char": "Lelouch Lamperouge", "anime": "Code Geass", "img": "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80"},
  "Hope": {"char": "Madoka Kaname", "anime": "Madoka Magica", "img": "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80"},
  "Healing": {"char": "Frieren", "anime": "Frieren: Beyond Journey's End", "img": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80"},
  "Peace": {"char": "Thorfinn", "anime": "Vinland Saga", "img": "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80"},
  "Freedom": {"char": "Eren Yeager", "anime": "Attack on Titan", "img": "https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=600&q=80"},
  "Courage": {"char": "Erwin Smith", "anime": "Attack on Titan", "img": "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80"},
  "Wisdom": {"char": "Uncle Iroh", "anime": "Avatar / Anime Legend", "img": "https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=600&q=80"},
  "Life": {"char": "Gintoki Sakata", "anime": "Gintama", "img": "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80"},
  "Dark": {"char": "Guts", "anime": "Berserk", "img": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80"},
  "Psycho": {"char": "Johan Liebert", "anime": "Monster", "img": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80"},
  "Psychopathic Villain": {"char": "Ryomen Sukuna", "anime": "Jujutsu Kaisen", "img": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80"},
  "Manipulation": {"char": "Sosuke Aizen", "anime": "Bleach", "img": "https://images.unsplash.com/photo-1514533450685-4493e01d1fdc?auto=format&fit=crop&w=600&q=80"},
  "Revenge": {"char": "Sasuke Uchiha", "anime": "Naruto Shippuden", "img": "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80"},
  "Villain": {"char": "Madara Uchiha", "anime": "Naruto Shippuden", "img": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80"},
  "Hero": {"char": "Izuku Midoriya", "anime": "My Hero Academia", "img": "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80"},
  "Anti-Hero": {"char": "Shadow (Cid Kagenou)", "anime": "The Eminence in Shadow", "img": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80"},
  "Mystery": {"char": "L Lawliet", "anime": "Death Note", "img": "https://images.unsplash.com/photo-1514533450685-4493e01d1fdc?auto=format&fit=crop&w=600&q=80"},
  "Horror": {"char": "Alucard", "anime": "Hellsing Ultimate", "img": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80"},
  "Comedy": {"char": "Kazuma Satou", "anime": "KonoSuba", "img": "https://images.unsplash.com/photo-1569701813229-33284b643e3c?auto=format&fit=crop&w=600&q=80"},
  "Meme": {"char": "Anya Forger", "anime": "Spy x Family", "img": "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80"},
  "School": {"char": "Koro-sensei", "anime": "Assassination Classroom", "img": "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80"},
  "Fantasy": {"char": "Rimuru Tempest", "anime": "That Time I Got Reincarnated as a Slime", "img": "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80"},
  "Fairy": {"char": "Lucy Heartfilia", "anime": "Fairy Tail", "img": "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80"},
  "Magic": {"char": "Megumin", "anime": "KonoSuba", "img": "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80"},
  "Adventure": {"char": "Monkey D. Luffy", "anime": "One Piece", "img": "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80"},
  "Gaming": {"char": "Sora & Shiro", "anime": "No Game No Life", "img": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80"},
  "Games": {"char": "Yugi Muto", "anime": "Yu-Gi-Oh!", "img": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80"},
  "Sports": {"char": "Shoyo Hinata", "anime": "Haikyuu!!", "img": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=600&q=80"},
  "Football": {"char": "Yoichi Isagi", "anime": "Blue Lock", "img": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=600&q=80"},
  "Basketball": {"char": "Tetsuya Kuroko", "anime": "Kuroko's Basketball", "img": "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=600&q=80"},
  "Racing": {"char": "Takumi Fujiwara", "anime": "Initial D", "img": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80"},
  "Fighting": {"char": "Baki Hanma", "anime": "Baki", "img": "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80"},
  "Nature": {"char": "Princess Mononoke (San)", "anime": "Princess Mononoke", "img": "https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=600&q=80"},
  "Forest": {"char": "Ginko", "anime": "Mushishi", "img": "https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=600&q=80"},
  "Ocean": {"char": "Jinbe", "anime": "One Piece", "img": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80"},
  "Mountains": {"char": "Tanjiro Kamado", "anime": "Demon Slayer", "img": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80"},
  "Birds": {"char": "Hawks", "anime": "My Hero Academia", "img": "https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=600&q=80"},
  "Cats": {"char": "Happy", "anime": "Fairy Tail", "img": "https://images.unsplash.com/photo-151488828697-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80"},
  "Dogs": {"char": "Bond Forger", "anime": "Spy x Family", "img": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=600&q=80"},
  "Animals": {"char": "Tony Tony Chopper", "anime": "One Piece", "img": "https://images.unsplash.com/photo-1484406566174-9da000fda645?auto=format&fit=crop&w=600&q=80"},
  "Space": {"char": "Spike Spiegel", "anime": "Cowboy Bebop", "img": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80"},
  "Galaxy": {"char": "Simon the Digger", "anime": "Gurren Lagann", "img": "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=600&q=80"},
  "Dreams": {"char": "Naruto Uzumaki", "anime": "Naruto", "img": "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80"},
  "Night": {"char": "Itachi Uchiha", "anime": "Naruto Shippuden", "img": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80"},
  "Stars": {"char": "Taki & Mitsuha", "anime": "Your Name", "img": "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=600&q=80"},
  "Sunrise": {"char": "Tanjiro & Nezuko", "anime": "Demon Slayer", "img": "https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=600&q=80"},
  "Sunset": {"char": "Spike Spiegel", "anime": "Cowboy Bebop", "img": "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&w=600&q=80"},
  "Rain": {"char": "Roy Mustang", "anime": "Fullmetal Alchemist", "img": "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=600&q=80"},
  "Winter": {"char": "Frieren", "anime": "Frieren: Beyond Journey's End", "img": "https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?auto=format&fit=crop&w=600&q=80"},
  "Summer": {"char": "Shinichi Kudo", "anime": "Detective Conan", "img": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80"},
  "Travel": {"char": "Kino", "anime": "Kino's Journey", "img": "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80"},
  "Warrior": {"char": "Miyamoto Musashi", "anime": "Vagabond", "img": "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80"},
  "Samurai": {"char": "Himura Kenshin", "anime": "Rurouni Kenshin", "img": "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80"},
  "Ninja": {"char": "Minato Namikaze", "anime": "Naruto Shippuden", "img": "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80"},
  "King": {"char": "Gilgamesh", "anime": "Fate/Zero", "img": "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80"},
  "Queen": {"char": "Artoria Pendragon (Saber)", "anime": "Fate/stay night", "img": "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80"},
  "Princess": {"char": "Princess Yona", "anime": "Yona of the Dawn", "img": "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=600&q=80"},
  "Dragon": {"char": "Kaido", "anime": "One Piece", "img": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80"},
  "Demon": {"char": "Meliodas", "anime": "The Seven Deadly Sins", "img": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80"},
  "Angel": {"char": "Kanade Tachibana", "anime": "Angel Beats!", "img": "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80"},
  "Sci-Fi": {"char": "Motoko Kusanagi", "anime": "Ghost in the Shell", "img": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80"},
  "Cyberpunk": {"char": "David Martinez", "anime": "Cyberpunk: Edgerunners", "img": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80"},
  "Apocalypse": {"char": "Eren Yeager (Rumbling)", "anime": "Attack on Titan", "img": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80"}
}

def parse_and_build():
  with open("/tmp/quotes_raw.txt", "r", encoding="utf-8") as f:
    lines = f.readlines()

  quotes = []
  count = 0
  for line in lines:
    line = line.strip()
    if not line:
      continue
    m = re.match(r"^(\d+)\.\s*\[(.*?)\]\s*(.*)$", line)
    if m:
      idx_str, category, text = m.groups()
      category = category.strip()
      text = text.strip()
      meta = category_meta.get(category, {
        "char": f"{category} Hero",
        "anime": "Campus Anime Chronicle",
        "img": "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80"
      })

      item = {
        "id": f"q-anime-{idx_str.zfill(4)}",
        "author": f"{meta['char']} ({meta['anime']})",
        "character": meta["char"],
        "animeTitle": meta["anime"],
        "category": category,
        "imageUrl": meta["img"],
        "text": text,
        "createdAt": 1741500000000 + int(idx_str) * 1000
      }
      quotes.append(item)
      count += 1

  print(f"Parsed {count} quotes successfully!")
  
  with open("/src/data/allAnimeQuotes.json", "w", encoding="utf-8") as f:
    json.dump(quotes, f, indent=2)

  # Update database.json directly so server serves all of them!
  db_path = "/data/database.json"
  try:
    with open(db_path, "r", encoding="utf-8") as f:
      db = json.load(f)
  except:
    db = {"users": [], "quotes": []}

  # Preserve any user custom quotes, merge with parsed quotes
  existing_user_quotes = [q for q in db.get("quotes", []) if not q.get("id", "").startswith("q-anime-")]
  db["quotes"] = quotes + existing_user_quotes
  
  with open(db_path, "w", encoding="utf-8") as f:
    json.dump(db, f, indent=2)
  print(f"Updated {db_path} with {len(db['quotes'])} total quotes!")

if __name__ == "__main__":
  parse_and_build()
