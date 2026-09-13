const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'database.json');
if (fs.existsSync(dbPath)) {
  const content = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  content.quotes = [];
  fs.writeFileSync(dbPath, JSON.stringify(content, null, 2));
  console.log("Quotes cleared from database.json");
} else {
  console.log("No database.json found");
}
