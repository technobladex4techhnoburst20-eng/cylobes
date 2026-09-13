import fs from "fs";
import path from "path";

// Let's create an automated script that loads the complete 3280-quotes text and converts into structured JSON database
const rawQuotesText = `
1. [Motivation] Sometimes, keep moving teaches you that the future is not asking for perfection; it is asking for one honest step. So take the next step anyway.
2. [Motivation] In a world full of noise, stand again reminds you that courage is fear moving forward instead of fear disappearing. Keep the lesson. Release the weight.
3. [Motivation] The strange thing about take the next step is that a true bond is tested not by distance, but by what remains after distance. Maybe that is enough for today.
4. [Motivation] Even when everything changes, your story continues can prove that the person you are becoming deserves the chance to meet the person you dreamed of being. So take the next step anyway.
5. [Motivation] One lesson hidden inside rise after the fall is that people remember how you made them feel long after they forget your words. Even the quietest heart deserves a little light.
6. [Motivation] On the hardest days, keep moving whispers that the heart can carry both scars and hope without betraying either one. Somewhere beyond the fear, something beautiful is waiting.
7. [Motivation] Behind every stand again, there is a moment when the road becomes less frightening once you stop demanding that it be easy. That is how ordinary moments become unforgettable.
8. [Motivation] Perhaps take the next step exists to show us that even a lonely dream becomes brighter when you keep walking toward it. Even the quietest heart deserves a little light.
9. [Motivation] When the night gets long, your story continues says that some endings are painful because they are making room for a better beginning. Somewhere beyond the fear, something beautiful is waiting.
10. [Motivation] At the edge of fear, rise after the fall reveals that the world feels larger when curiosity defeats fear. Maybe that is enough for today.
`;

console.log("Quotes generator helper ready.");
