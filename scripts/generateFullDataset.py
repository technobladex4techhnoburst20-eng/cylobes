import json
import os

# Complete structured templates extracted from the prompt
# Notice the 20 distinct statement/closer pairs that alternate across the categories:
pairs_a = [
    ("the future is not asking for perfection; it is asking for one honest step.", "So take the next step anyway."),
    ("courage is fear moving forward instead of fear disappearing.", "Keep the lesson. Release the weight."),
    ("a true bond is tested not by distance, but by what remains after distance.", "Maybe that is enough for today."),
    ("the person you are becoming deserves the chance to meet the person you dreamed of being.", "So take the next step anyway."),
    ("people remember how you made them feel long after they forget your words.", "Even the quietest heart deserves a little light."),
    ("the heart can carry both scars and hope without betraying either one.", "Somewhere beyond the fear, something beautiful is waiting."),
    ("the road becomes less frightening once you stop demanding that it be easy.", "That is how ordinary moments become unforgettable."),
    ("even a lonely dream becomes brighter when you keep walking toward it.", "Even the quietest heart deserves a little light."),
    ("some endings are painful because they are making room for a better beginning.", "Somewhere beyond the fear, something beautiful is waiting."),
    ("the world feels larger when curiosity defeats fear.", "Maybe that is enough for today."),
    ("you are stronger than the version of yourself that wanted to quit.", "So take the next step anyway."),
    ("not every battle deserves your anger, and not every silence deserves an answer.", "Keep the lesson. Release the weight."),
    ("real strength is often quiet enough to look ordinary.", "Maybe that is enough for today."),
    ("someone can become your light without ever realizing how dark your night was.", "So take the next step anyway."),
    ("kindness can be powerful without becoming loud.", "Even the quietest heart deserves a little light."),
    ("the things you survive can eventually become the wisdom you pass on.", "Somewhere beyond the fear, something beautiful is waiting."),
    ("you do not have to carry yesterday into every tomorrow.", "That is how ordinary moments become unforgettable."),
    ("the smallest choice can become the beginning of a completely different future.", "Even the quietest heart deserves a little light."),
    ("a broken chapter does not mean the whole story has to stay broken.", "Somewhere beyond the fear, something beautiful is waiting."),
    ("you can lose a moment without losing the meaning it gave you.", "Maybe that is enough for today.")
]

pairs_b = [
    ("you can lose a moment without losing the meaning it gave you.", "Even the quietest heart deserves a little light."),
    ("the future is not asking for perfection; it is asking for one honest step.", "Keep the lesson. Release the weight."),
    ("courage is fear moving forward instead of fear disappearing.", "So take the next step anyway."),
    ("a true bond is tested not by distance, but by what remains after distance.", "So take the next step anyway."),
    ("the person you are becoming deserves the chance to meet the person you dreamed of being.", "And sometimes, that is the real victory."),
    ("people remember how you made them feel long after they forget your words.", "Maybe that is enough for today."),
    ("the heart can carry both scars and hope without betraying either one.", "That is how ordinary moments become unforgettable."),
    ("the road becomes less frightening once you stop demanding that it be easy.", "Somewhere beyond the fear, something beautiful is waiting."),
    ("even a lonely dream becomes brighter when you keep walking toward it.", "Somewhere beyond the fear, something beautiful is waiting."),
    ("some endings are painful because they are making room for a better beginning.", "Let tomorrow see what you can become."),
    ("the world feels larger when curiosity defeats fear.", "Even the quietest heart deserves a little light."),
    ("you are stronger than the version of yourself that wanted to quit.", "Keep the lesson. Release the weight."),
    ("not every battle deserves your anger, and not every silence deserves an answer.", "So take the next step anyway."),
    ("real strength is often quiet enough to look ordinary.", "So take the next step anyway."),
    ("someone can become your light without ever realizing how dark your night was.", "And sometimes, that is the real victory."),
    ("kindness can be powerful without becoming loud.", "Maybe that is enough for today."),
    ("the things you survive can eventually become the wisdom you pass on.", "That is how ordinary moments become unforgettable."),
    ("you do not have to carry yesterday into every tomorrow.", "Somewhere beyond the fear, something beautiful is waiting."),
    ("the smallest choice can become the beginning of a completely different future.", "Somewhere beyond the fear, something beautiful is waiting."),
    ("a broken chapter does not mean the whole story has to stay broken.", "Let tomorrow see what you can become.")
]

categories_specs = [
  ("Motivation", ["keep moving", "stand again", "take the next step", "your story continues", "rise after the fall"], {"char": "Rock Lee", "anime": "Naruto", "img": "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80"}),
  ("Success", ["victory", "achievement", "winning", "discipline", "growth"], {"char": "All Might", "anime": "My Hero Academia", "img": "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80"}),
  ("Failure", ["failure", "mistakes", "falling down", "learning", "starting again"], {"char": "Edward Elric", "anime": "Fullmetal Alchemist", "img": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80"}),
  ("Friends", ["true friends", "friendship", "together", "shared memories", "being there"], {"char": "Gon Freecss", "anime": "Hunter x Hunter", "img": "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80"}),
  ("Best Friends", ["best friends", "soul friends", "partners in chaos", "forever friends", "unbreakable bond"], {"char": "Monkey D. Luffy", "anime": "One Piece", "img": "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80"}),
  ("Brotherhood", ["brothers", "brotherhood", "standing together", "protecting each other", "shared purpose"], {"char": "Portgas D. Ace", "anime": "One Piece", "img": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80"}),
  ("Sisterhood", ["sisters", "sisterhood", "strong hearts", "supporting each other", "growing together"], {"char": "Shinobu Kocho", "anime": "Demon Slayer", "img": "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=600&q=80"}),
  ("Loyalty", ["loyalty", "keeping promises", "standing beside someone", "trusting the bond", "never abandoning"], {"char": "Roronoa Zoro", "anime": "One Piece", "img": "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80"}),
  ("Trust", ["trust", "faith", "believing someone", "opening your heart", "keeping confidence"], {"char": "Kakashi Hatake", "anime": "Naruto Shippuden", "img": "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80"}),
  ("Love", ["love", "heart", "devotion", "affection", "soul connection"], {"char": "Kaori Miyazono", "anime": "Your Lie in April", "img": "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=600&q=80"}),
  ("Romantic", ["romance", "stolen glances", "late-night thoughts", "warm smiles", "quiet affection"], {"char": "Taki Tachibana", "anime": "Your Name", "img": "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80"}),
  ("Crush", ["crush", "first feelings", "butterflies", "nervous smiles", "hidden feelings"], {"char": "Marin Kitagawa", "anime": "My Dress-Up Darling", "img": "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80"}),
  ("Breakup", ["goodbye", "letting go", "moving on", "separate paths", "last memories"], {"char": "Spike Spiegel", "anime": "Cowboy Bebop", "img": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80"}),
  ("Heartbreak", ["broken heart", "loneliness", "tears", "missing someone", "healing pain"], {"char": "Ken Kaneki", "anime": "Tokyo Ghoul", "img": "https://images.unsplash.com/photo-1514533450685-4493e01d1fdc?auto=format&fit=crop&w=600&q=80"}),
  ("Care", ["caring", "protecting", "checking in", "gentle support", "being present"], {"char": "Tanjiro Kamado", "anime": "Demon Slayer", "img": "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80"}),
  ("Kindness", ["kindness", "gentle hearts", "helping", "small good deeds", "compassion"], {"char": "Shigeo Kageyama (Mob)", "anime": "Mob Psycho 100", "img": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80"}),
  ("Family", ["family", "home", "parents", "siblings", "belonging"], {"char": "Loid Forger", "anime": "Spy x Family", "img": "https://images.unsplash.com/photo-1569701813229-33284b643e3c?auto=format&fit=crop&w=600&q=80"}),
  ("Sad", ["sadness", "quiet tears", "lonely nights", "unsaid feelings", "empty rooms"], {"char": "Violet Evergarden", "anime": "Violet Evergarden", "img": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80"}),
  ("Emotional", ["emotions", "memories", "tears", "feelings", "inner scars"], {"char": "Kyojuro Rengoku", "anime": "Demon Slayer", "img": "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80"}),
  ("Drama", ["difficult choices", "conflict", "secrets", "sacrifice", "unexpected turns"], {"char": "Lelouch Lamperouge", "anime": "Code Geass", "img": "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80"}),
  ("Hope", ["hope", "light", "tomorrow", "second chances", "believing again"], {"char": "Madoka Kaname", "anime": "Madoka Magica", "img": "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80"}),
  ("Healing", ["healing", "recovery", "peace within", "growing slowly", "finding yourself"], {"char": "Frieren", "anime": "Frieren: Beyond Journey's End", "img": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80"}),
  ("Peace", ["peace", "calm", "forgiveness", "quiet strength", "a peaceful heart"], {"char": "Thorfinn", "anime": "Vinland Saga", "img": "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80"}),
  ("Freedom", ["freedom", "open skies", "breaking chains", "choosing your path", "living honestly"], {"char": "Eren Yeager", "anime": "Attack on Titan", "img": "https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=600&q=80"}),
  ("Courage", ["courage", "facing fear", "bravery", "standing up", "moving despite fear"], {"char": "Erwin Smith", "anime": "Attack on Titan", "img": "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80"}),
  ("Wisdom", ["wisdom", "lessons", "understanding", "patience", "life knowledge"], {"char": "Uncle Iroh", "anime": "Avatar / Anime Legend", "img": "https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=600&q=80"}),
  ("Life", ["life", "time", "change", "moments", "the journey"], {"char": "Gintoki Sakata", "anime": "Gintama", "img": "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80"}),
  ("Dark", ["darkness", "shadows", "night", "inner conflict", "cold silence"], {"char": "Guts", "anime": "Berserk", "img": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80"}),
  ("Psycho", ["unstable thoughts", "obsession", "a fractured mind", "fear inside", "distorted reality"], {"char": "Johan Liebert", "anime": "Monster", "img": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80"}),
  ("Psychopathic Villain", ["cold villain", "ruthless mind", "empty smile", "calculated cruelty", "dangerous obsession"], {"char": "Ryomen Sukuna", "anime": "Jujutsu Kaisen", "img": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80"}),
  ("Manipulation", ["manipulation", "mind games", "hidden motives", "false smiles", "psychological traps"], {"char": "Sosuke Aizen", "anime": "Bleach", "img": "https://images.unsplash.com/photo-1514533450685-4493e01d1fdc?auto=format&fit=crop&w=600&q=80"}),
  ("Revenge", ["revenge", "justice", "anger", "old wounds", "payback"], {"char": "Sasuke Uchiha", "anime": "Naruto Shippuden", "img": "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80"}),
  ("Villain", ["villains", "dark ambition", "power", "corruption", "the fallen"], {"char": "Madara Uchiha", "anime": "Naruto Shippuden", "img": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80"}),
  ("Hero", ["heroes", "protecting others", "selfless courage", "saving someone", "becoming better"], {"char": "Izuku Midoriya", "anime": "My Hero Academia", "img": "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80"}),
  ("Anti-Hero", ["anti-hero", "gray morality", "doing the wrong thing for a reason", "choosing the lesser evil", "walking alone"], {"char": "Shadow (Cid Kagenou)", "anime": "The Eminence in Shadow", "img": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80"}),
  ("Mystery", ["mystery", "clues", "hidden truth", "unknown rooms", "secrets"], {"char": "L Lawliet", "anime": "Death Note", "img": "https://images.unsplash.com/photo-1514533450685-4493e01d1fdc?auto=format&fit=crop&w=600&q=80"}),
  ("Horror", ["horror", "fear", "whispers", "dark corridors", "monsters"], {"char": "Alucard", "anime": "Hellsing Ultimate", "img": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80"}),
  ("Comedy", ["comedy", "chaos", "bad luck", "funny disasters", "laughing at life"], {"char": "Kazuma Satou", "anime": "KonoSuba", "img": "https://images.unsplash.com/photo-1569701813229-33284b643e3c?auto=format&fit=crop&w=600&q=80"}),
  ("Meme", ["meme", "chaotic energy", "unexpected timing", "pure nonsense", "internet humor"], {"char": "Anya Forger", "anime": "Spy x Family", "img": "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80"}),
  ("School", ["school", "classmates", "exams", "school days", "after-class memories"], {"char": "Koro-sensei", "anime": "Assassination Classroom", "img": "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80"}),
  ("Fantasy", ["fantasy", "enchanted worlds", "ancient legends", "impossible kingdoms", "magical journeys"], {"char": "Rimuru Tempest", "anime": "That Time I Got Reincarnated as a Slime", "img": "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80"}),
  ("Fairy", ["fairies", "tiny magic", "enchanted forests", "wishes", "glowing wings"], {"char": "Lucy Heartfilia", "anime": "Fairy Tail", "img": "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80"}),
  ("Magic", ["magic", "spells", "mystic power", "hidden gifts", "arcane worlds"], {"char": "Megumin", "anime": "KonoSuba", "img": "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80"}),
  ("Adventure", ["adventure", "unknown roads", "new worlds", "treasure", "exploration"], {"char": "Monkey D. Luffy", "anime": "One Piece", "img": "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80"}),
  ("Gaming", ["gaming", "leveling up", "boss battles", "grinding", "player mindset"], {"char": "Sora & Shiro", "anime": "No Game No Life", "img": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80"}),
  ("Games", ["games", "winning", "losing", "strategy", "one more match"], {"char": "Yugi Muto", "anime": "Yu-Gi-Oh!", "img": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80"}),
  ("Sports", ["sports", "training", "teamwork", "competition", "the final whistle"], {"char": "Shoyo Hinata", "anime": "Haikyuu!!", "img": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=600&q=80"}),
  ("Football", ["football", "the pitch", "goals", "team spirit", "match day"], {"char": "Yoichi Isagi", "anime": "Blue Lock", "img": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=600&q=80"}),
  ("Basketball", ["basketball", "the court", "the shot", "teamwork", "the final seconds"], {"char": "Tetsuya Kuroko", "anime": "Kuroko's Basketball", "img": "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=600&q=80"}),
  ("Racing", ["racing", "speed", "the finish line", "acceleration", "one last lap"], {"char": "Takumi Fujiwara", "anime": "Initial D", "img": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80"}),
  ("Fighting", ["fighting", "combat", "training", "strength", "the next round"], {"char": "Baki Hanma", "anime": "Baki", "img": "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80"}),
  ("Nature", ["nature", "leaves", "seasons", "wild beauty", "earth"], {"char": "Princess Mononoke (San)", "anime": "Princess Mononoke", "img": "https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=600&q=80"}),
  ("Forest", ["forest", "trees", "moss", "hidden paths", "green silence"], {"char": "Ginko", "anime": "Mushishi", "img": "https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=600&q=80"}),
  ("Ocean", ["ocean", "waves", "deep blue", "sailing", "the horizon"], {"char": "Jinbe", "anime": "One Piece", "img": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80"}),
  ("Mountains", ["mountains", "peaks", "climbing", "cold air", "the summit"], {"char": "Tanjiro Kamado", "anime": "Demon Slayer", "img": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80"}),
  ("Birds", ["birds", "wings", "flight", "songs", "open skies"], {"char": "Hawks", "anime": "My Hero Academia", "img": "https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=600&q=80"}),
  ("Cats", ["cats", "whiskers", "quiet paws", "curiosity", "night prowls"], {"char": "Happy", "anime": "Fairy Tail", "img": "https://images.unsplash.com/photo-151488828697-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80"}),
  ("Dogs", ["dogs", "loyal paws", "playfulness", "companionship", "happy tails"], {"char": "Bond Forger", "anime": "Spy x Family", "img": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=600&q=80"}),
  ("Animals", ["animals", "wild hearts", "gentle creatures", "instinct", "the natural world"], {"char": "Tony Tony Chopper", "anime": "One Piece", "img": "https://images.unsplash.com/photo-1484406566174-9da000fda645?auto=format&fit=crop&w=600&q=80"}),
  ("Space", ["space", "stars", "planets", "the void", "infinite distance"], {"char": "Spike Spiegel", "anime": "Cowboy Bebop", "img": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80"}),
  ("Galaxy", ["galaxy", "nebulas", "cosmic roads", "starlight", "distant worlds"], {"char": "Simon the Digger", "anime": "Gurren Lagann", "img": "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=600&q=80"}),
  ("Dreams", ["dreams", "night dreams", "goals", "imagination", "impossible wishes"], {"char": "Naruto Uzumaki", "anime": "Naruto", "img": "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80"}),
  ("Night", ["night", "moonlight", "dark skies", "midnight thoughts", "quiet streets"], {"char": "Itachi Uchiha", "anime": "Naruto Shippuden", "img": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80"}),
  ("Stars", ["stars", "starlight", "constellations", "distant lights", "night skies"], {"char": "Taki & Mitsuha", "anime": "Your Name", "img": "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=600&q=80"}),
  ("Sunrise", ["sunrise", "dawn", "new beginnings", "morning light", "a fresh day"], {"char": "Tanjiro & Nezuko", "anime": "Demon Slayer", "img": "https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=600&q=80"}),
  ("Sunset", ["sunset", "evening glow", "goodbyes", "golden skies", "the day ending"], {"char": "Spike Spiegel", "anime": "Cowboy Bebop", "img": "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&w=600&q=80"}),
  ("Rain", ["rain", "raindrops", "storms", "wet streets", "rainy memories"], {"char": "Roy Mustang", "anime": "Fullmetal Alchemist", "img": "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=600&q=80"}),
  ("Winter", ["winter", "snow", "cold nights", "warm scarves", "frozen landscapes"], {"char": "Frieren", "anime": "Frieren: Beyond Journey's End", "img": "https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?auto=format&fit=crop&w=600&q=80"}),
  ("Summer", ["summer", "sunlight", "warm days", "vacation", "golden afternoons"], {"char": "Shinichi Kudo", "anime": "Detective Conan", "img": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80"}),
  ("Travel", ["travel", "journeys", "new places", "roads", "wandering"], {"char": "Kino", "anime": "Kino's Journey", "img": "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80"}),
  ("Warrior", ["warriors", "discipline", "battle spirit", "honor", "endurance"], {"char": "Miyamoto Musashi", "anime": "Vagabond", "img": "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80"}),
  ("Samurai", ["samurai", "honor", "sword discipline", "quiet strength", "bushido spirit"], {"char": "Himura Kenshin", "anime": "Rurouni Kenshin", "img": "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80"}),
  ("Ninja", ["ninja", "stealth", "focus", "shadow steps", "silent determination"], {"char": "Minato Namikaze", "anime": "Naruto Shippuden", "img": "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80"}),
  ("King", ["king", "leadership", "responsibility", "a crown", "protecting a kingdom"], {"char": "Gilgamesh", "anime": "Fate/Zero", "img": "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80"}),
  ("Queen", ["queen", "grace", "leadership", "royal strength", "a fearless ruler"], {"char": "Artoria Pendragon (Saber)", "anime": "Fate/stay night", "img": "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80"}),
  ("Princess", ["princess", "royal dreams", "courageous hearts", "hidden strength", "a brave princess"], {"char": "Princess Yona", "anime": "Yona of the Dawn", "img": "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=600&q=80"}),
  ("Dragon", ["dragons", "ancient fire", "wings", "legendary power", "mythic beasts"], {"char": "Kaido", "anime": "One Piece", "img": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80"}),
  ("Demon", ["demons", "dark power", "inner monsters", "cursed strength", "fighting darkness"], {"char": "Meliodas", "anime": "The Seven Deadly Sins", "img": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80"}),
  ("Angel", ["angels", "wings", "guidance", "light", "heavenly calm"], {"char": "Kanade Tachibana", "anime": "Angel Beats!", "img": "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80"}),
  ("Sci-Fi", ["sci-fi", "future worlds", "machines", "space cities", "technology"], {"char": "Motoko Kusanagi", "anime": "Ghost in the Shell", "img": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80"}),
  ("Cyberpunk", ["cyberpunk", "neon nights", "digital rain", "augmented dreams", "city lights"], {"char": "David Martinez", "anime": "Cyberpunk: Edgerunners", "img": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80"}),
  ("Apocalypse", ["apocalypse", "survival", "ruined cities", "last hope", "a world after the fall"], {"char": "Eren Yeager (Rumbling)", "anime": "Attack on Titan", "img": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80"})
]

def build_all():
  total_quotes = []
  global_idx = 1
  
  for cat, subjects, meta in categories_specs:
    # 40 items per category
    for i in range(40):
      subj = subjects[i % 5]
      pair_idx = i % 20
      
      # Select pairs_a for first 20, or variation
      pair = pairs_a[pair_idx]
      statement, closer = pair
      
      # Prefix and verb structure
      prefix_type = i % 10
      if i < 20:
        if prefix_type == 0:
          text = f"Sometimes, {subj} teaches you that {statement} {closer}"
        elif prefix_type == 1:
          text = f"In a world full of noise, {subj} reminds you that {statement} {closer}"
        elif prefix_type == 2:
          text = f"The strange thing about {subj} is that {statement} {closer}"
        elif prefix_type == 3:
          text = f"Even when everything changes, {subj} can prove that {statement} {closer}"
        elif prefix_type == 4:
          text = f"One lesson hidden inside {subj} is that {statement} {closer}"
        elif prefix_type == 5:
          text = f"On the hardest days, {subj} whispers that {statement} {closer}"
        elif prefix_type == 6:
          text = f"Behind every {subj}, there is a moment when {statement} {closer}"
        elif prefix_type == 7:
          text = f"Perhaps {subj} exists to show us that {statement} {closer}"
        elif prefix_type == 8:
          text = f"When the night gets long, {subj} says that {statement} {closer}"
        else:
          text = f"At the edge of fear, {subj} reveals that {statement} {closer}"
      else:
        # Items 21-40 with "There are days when" prefix on first item
        if prefix_type == 0:
          text = f"There are days when, {subj} teaches you that {statement} {closer}"
        elif prefix_type == 1:
          text = f"In a world full of noise, {subj} reminds you that {statement} {closer}"
        elif prefix_type == 2:
          text = f"The strange thing about {subj} is that {statement} {closer}"
        elif prefix_type == 3:
          text = f"Even when everything changes, {subj} can prove that {statement} {closer}"
        elif prefix_type == 4:
          text = f"One lesson hidden inside {subj} is that {statement} {closer}"
        elif prefix_type == 5:
          text = f"On the hardest days, {subj} whispers that {statement} {closer}"
        elif prefix_type == 6:
          text = f"Behind every {subj}, there is a moment when {statement} {closer}"
        elif prefix_type == 7:
          text = f"Perhaps {subj} exists to show us that {statement} {closer}"
        elif prefix_type == 8:
          text = f"When the night gets long, {subj} says that {statement} {closer}"
        else:
          text = f"At the edge of fear, {subj} reveals that {statement} {closer}"

      quote_item = {
        "id": f"q-{global_idx:04d}",
        "author": f"{meta['char']} ({meta['anime']})",
        "character": meta["char"],
        "animeTitle": meta["anime"],
        "category": cat,
        "imageUrl": meta["img"],
        "text": text,
        "createdAt": 1741500000000 + global_idx * 1000
      }
      total_quotes.append(quote_item)
      global_idx += 1

  print(f"Total generated quotes: {len(total_quotes)}")
  
  os.makedirs("/src/data", exist_ok=True)
  with open("/src/data/allAnimeQuotes.json", "w", encoding="utf-8") as f:
    json.dump(total_quotes, f, indent=2)

  # Update database.json
  os.makedirs("/data", exist_ok=True)
  db_file = "/data/database.json"
  try:
    with open(db_file, "r", encoding="utf-8") as f:
      db = json.load(f)
  except:
    db = {"users": [], "quotes": [], "publicMessages": [], "privateMessages": []}

  db["quotes"] = total_quotes
  with open(db_file, "w", encoding="utf-8") as f:
    json.dump(db, f, indent=2)
  print(f"Wrote {len(total_quotes)} quotes to /data/database.json and /src/data/allAnimeQuotes.json successfully!")

if __name__ == "__main__":
  build_all()
