const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('C:\\Users\\LENOVO\\AppData\\Local\\Aronium\\Data\\pos.db', sqlite3.OPEN_READONLY);

db.all("PRAGMA table_info(Customer);", [], (err, rows) => {
  if (err) throw err;
  console.log(rows);
});
db.close();
