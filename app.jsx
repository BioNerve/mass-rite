const { useState, useEffect, useCallback } = React;

// ─── EASTER & LITURGICAL CALENDAR ────────────────────────────────────────────
function getEasterDate(year) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function getLiturgicalYear(date) {
  // Liturgical year starts on First Sunday of Advent
  const year = date.getFullYear();
  const xmas = new Date(year, 11, 25);
  const xmasDay = xmas.getDay();
  const advent1 = new Date(xmas.getTime() - ((xmasDay === 0 ? 7 : xmasDay) + 21) * 86400000);
  // If we're in or past Advent, liturgical year is year+1
  const litYear = date >= advent1 ? year + 1 : year;
  // Cycle A: litYear divisible by 3 (2025 = Year C, 2026 = Year A, 2027 = Year B)
  const cycles = ["C", "A", "B"];
  const sundayCycle = cycles[litYear % 3];
  // Weekday cycle: odd litYear = I, even = II
  const weekdayCycle = litYear % 2 === 1 ? "I" : "II";
  return { litYear, sundayCycle, weekdayCycle };
}

function getLiturgicalInfo(date) {
  const year = date.getFullYear();
  const easter = getEasterDate(year);
  const easterMs = easter.getTime(), dateMs = date.getTime(), dayMs = 86400000;
  const ashWed = new Date(easterMs - 46 * dayMs);
  const palmSun = new Date(easterMs - 7 * dayMs);
  const holyThu = new Date(easterMs - 3 * dayMs);
  const goodFri = new Date(easterMs - 2 * dayMs);
  const holySat = new Date(easterMs - dayMs);
  const pentecost = new Date(easterMs + 49 * dayMs);
  const ascension = new Date(easterMs + 39 * dayMs);
  const xmas = new Date(year, 11, 25);
  const xmasDay = xmas.getDay();
  const advent1 = new Date(xmas.getTime() - ((xmasDay === 0 ? 7 : xmasDay) + 21) * dayMs);
  const xmasPrev = new Date(year - 1, 11, 25);
  const xmasPrevDay = xmasPrev.getDay();
  const advent1Prev = new Date(xmasPrev.getTime() - ((xmasPrevDay === 0 ? 7 : xmasPrevDay) + 21) * dayMs);
  const isSame = (a, b) => a.toDateString() === b.toDateString();
  const isBetween = (d, s, e) => d >= s && d <= e;
  let season = "ordinary", seasonName = "Ordinary Time";
  let hasGloria = true, hasAlleluia = true, weekNumber = null, specialDay = null;
  if (isSame(date, new Date(year, 11, 25))) { specialDay = "Christmas Day"; season = "christmas"; seasonName = "Christmas"; }
  else if (isBetween(date, advent1, new Date(year, 11, 24))) { season = "advent"; seasonName = "Advent"; hasGloria = false; hasAlleluia = false; weekNumber = Math.min(Math.floor((dateMs - advent1.getTime()) / (7 * dayMs)) + 1, 4); }
  else if (isBetween(date, advent1Prev, new Date(year, 0, 6))) { season = "christmas"; seasonName = "Christmas"; }
  else if (isSame(date, ashWed)) { specialDay = "Ash Wednesday"; season = "lent"; seasonName = "Lent"; hasGloria = false; hasAlleluia = false; }
  else if (isBetween(date, ashWed, new Date(palmSun.getTime() - dayMs))) { season = "lent"; seasonName = "Lent"; hasGloria = false; hasAlleluia = false; weekNumber = Math.min(Math.floor((dateMs - ashWed.getTime()) / (7 * dayMs)) + 1, 5); }
  else if (isSame(date, palmSun)) { specialDay = "Palm Sunday of the Passion of the Lord"; season = "holy_week"; seasonName = "Holy Week"; hasGloria = false; hasAlleluia = false; }
  else if (isBetween(date, palmSun, holySat)) {
    season = "holy_week"; seasonName = "Holy Week"; hasGloria = false; hasAlleluia = false;
    if (isSame(date, holyThu)) specialDay = "Holy Thursday – Mass of the Lord's Supper";
    else if (isSame(date, goodFri)) specialDay = "Good Friday";
    else if (isSame(date, holySat)) specialDay = "Holy Saturday";
  } else if (isSame(date, easter)) { specialDay = "Easter Sunday – Resurrection of the Lord"; season = "easter"; seasonName = "Easter"; }
  else if (isBetween(date, easter, pentecost)) {
    season = "easter"; seasonName = "Easter Time";
    if (isSame(date, ascension)) specialDay = "The Ascension of the Lord";
    else if (isSame(date, pentecost)) specialDay = "Pentecost Sunday";
    else weekNumber = Math.min(Math.floor((dateMs - easterMs) / (7 * dayMs)) + 1, 7);
  }
  const m = date.getMonth() + 1, d2 = date.getDate();
  if (m === 1 && d2 === 1) specialDay = "Solemnity of Mary, Mother of God";
  if (m === 8 && d2 === 15) { specialDay = "Assumption of the Blessed Virgin Mary"; hasGloria = true; }
  if (m === 11 && d2 === 1) specialDay = "All Saints Day";
  if (m === 12 && d2 === 8) { specialDay = "Immaculate Conception"; hasGloria = true; }
  const vestmentMap = { advent: { label: "Violet", hex: "#6b3fa0" }, lent: { label: "Violet", hex: "#6b3fa0" }, holy_week: { label: "Violet / Red", hex: "#6b3fa0" }, easter: { label: "White / Gold", hex: "#D4AF37" }, christmas: { label: "White / Gold", hex: "#c0a060" }, ordinary: { label: "Green", hex: "#3a7a3a" } };
  const accentMap = { advent: "#9b59b6", lent: "#9b59b6", holy_week: "#9b59b6", easter: "#D4AF37", christmas: "#c0a060", ordinary: "#4a8c4a" };
  return { season, seasonName, hasGloria, hasAlleluia, weekNumber, specialDay, vestment: vestmentMap[season] || vestmentMap.ordinary, accent: accentMap[season] || "#D4AF37" };
}

// ─── LECTIONARY ENGINE ────────────────────────────────────────────────────────
// Roman Rite Lectionary — Sunday cycles A/B/C, Weekday cycles I/II
// This table is used for liturgical cycle computation (season, vestments, year).
// Readings are now fetched directly from Universalis for any day of the year.

const SUNDAY_LECTIONARY = {
  // Advent
  "Advent-1-A": { r1: "Isaiah 2:1-5", ps: "Psalms 122:1-9", r2: "Romans 13:11-14", gospel: "Matthew 24:37-44" },
  "Advent-1-B": { r1: "Isaiah 63:16-17,19;64:2-7", ps: "Psalms 80:2-3,15-16,18-19", r2: "1 Corinthians 1:3-9", gospel: "Mark 13:33-37" },
  "Advent-1-C": { r1: "Jeremiah 33:14-16", ps: "Psalms 25:4-5,8-10,14", r2: "1 Thessalonians 3:12-4:2", gospel: "Luke 21:25-28,34-36" },
  "Advent-2-A": { r1: "Isaiah 11:1-10", ps: "Psalms 72:1-2,7-8,12-13,17", r2: "Romans 15:4-9", gospel: "Matthew 3:1-12" },
  "Advent-2-B": { r1: "Isaiah 40:1-5,9-11", ps: "Psalms 85:9-14", r2: "2 Peter 3:8-14", gospel: "Mark 1:1-8" },
  "Advent-2-C": { r1: "Baruch 5:1-9", ps: "Psalms 126:1-6", r2: "Philippians 1:4-6,8-11", gospel: "Luke 3:1-6" },
  "Advent-3-A": { r1: "Isaiah 35:1-6,10", ps: "Psalms 146:6-10", r2: "James 5:7-10", gospel: "Matthew 11:2-11" },
  "Advent-3-B": { r1: "Isaiah 61:1-2,10-11", ps: "Luke 1:46-50,53-54", r2: "1 Thessalonians 5:16-24", gospel: "John 1:6-8,19-28" },
  "Advent-3-C": { r1: "Zephaniah 3:14-18", ps: "Isaiah 12:2-6", r2: "Philippians 4:4-7", gospel: "Luke 3:10-18" },
  "Advent-4-A": { r1: "Isaiah 7:10-14", ps: "Psalms 24:1-6", r2: "Romans 1:1-7", gospel: "Matthew 1:18-24" },
  "Advent-4-B": { r1: "2 Samuel 7:1-5,8-12,14,16", ps: "Psalms 89:2-5,27,29", r2: "Romans 16:25-27", gospel: "Luke 1:26-38" },
  "Advent-4-C": { r1: "Micah 5:1-4", ps: "Psalms 80:2-3,15-16,18-19", r2: "Hebrews 10:5-10", gospel: "Luke 1:39-45" },
  // Christmas
  "Christmas-Day": { r1: "Isaiah 52:7-10", ps: "Psalms 98:1-6", r2: "Hebrews 1:1-6", gospel: "John 1:1-18" },
  // Lent
  "Lent-1-A": { r1: "Genesis 2:7-9;3:1-7", ps: "Psalms 51:3-6,12-14,17", r2: "Romans 5:12-19", gospel: "Matthew 4:1-11" },
  "Lent-1-B": { r1: "Genesis 9:8-15", ps: "Psalms 25:4-9", r2: "1 Peter 3:18-22", gospel: "Mark 1:12-15" },
  "Lent-1-C": { r1: "Deuteronomy 26:4-10", ps: "Psalms 91:1-2,10-15", r2: "Romans 10:8-13", gospel: "Luke 4:1-13" },
  "Lent-2-A": { r1: "Genesis 12:1-4", ps: "Psalms 33:4-5,18-20,22", r2: "2 Timothy 1:8-10", gospel: "Matthew 17:1-9" },
  "Lent-2-B": { r1: "Genesis 22:1-2,9,10-13,15-18", ps: "Psalms 116:10,15-19", r2: "Romans 8:31-34", gospel: "Mark 9:2-10" },
  "Lent-2-C": { r1: "Genesis 15:5-12,17-18", ps: "Psalms 27:1,7-9,13-14", r2: "Philippians 3:17-4:1", gospel: "Luke 9:28-36" },
  "Lent-3-A": { r1: "Exodus 17:3-7", ps: "Psalms 95:1-2,6-9", r2: "Romans 5:1-2,5-8", gospel: "John 4:5-42" },
  "Lent-3-B": { r1: "Exodus 20:1-17", ps: "Psalms 19:8-11", r2: "1 Corinthians 1:22-25", gospel: "John 2:13-25" },
  "Lent-3-C": { r1: "Exodus 3:1-8,13-15", ps: "Psalms 103:1-4,6-8,11", r2: "1 Corinthians 10:1-6,10-12", gospel: "Luke 13:1-9" },
  "Lent-4-A": { r1: "1 Samuel 16:1,6-7,10-13", ps: "Psalms 23:1-6", r2: "Ephesians 5:8-14", gospel: "John 9:1-41" },
  "Lent-4-B": { r1: "2 Chronicles 36:14-16,19-23", ps: "Psalms 137:1-6", r2: "Ephesians 2:4-10", gospel: "John 3:14-21" },
  "Lent-4-C": { r1: "Joshua 5:9,10-12", ps: "Psalms 34:2-7", r2: "2 Corinthians 5:17-21", gospel: "Luke 15:1-3,11-32" },
  "Lent-5-A": { r1: "Ezekiel 37:12-14", ps: "Psalms 130:1-8", r2: "Romans 8:8-11", gospel: "John 11:1-45" },
  "Lent-5-B": { r1: "Jeremiah 31:31-34", ps: "Psalms 51:3-4,12-15", r2: "Hebrews 5:7-9", gospel: "John 12:20-33" },
  "Lent-5-C": { r1: "Isaiah 43:16-21", ps: "Psalms 126:1-6", r2: "Philippians 3:8-14", gospel: "John 8:1-11" },
  // Palm Sunday
  "Palm-A": { r1: "Isaiah 50:4-7", ps: "Psalms 22:8-9,17-20,23-24", r2: "Philippians 2:6-11", gospel: "Matthew 26:14-27:66" },
  "Palm-B": { r1: "Isaiah 50:4-7", ps: "Psalms 22:8-9,17-20,23-24", r2: "Philippians 2:6-11", gospel: "Mark 14:1-15:47" },
  "Palm-C": { r1: "Isaiah 50:4-7", ps: "Psalms 22:8-9,17-20,23-24", r2: "Philippians 2:6-11", gospel: "Luke 22:14-23:56" },
  // Easter
  "Easter-A": { r1: "Acts 10:34,37-43", ps: "Psalms 118:1-2,16-17,22-23", r2: "Colossians 3:1-4", gospel: "John 20:1-9" },
  "Easter-B": { r1: "Acts 10:34,37-43", ps: "Psalms 118:1-2,16-17,22-23", r2: "1 Corinthians 5:6-8", gospel: "Mark 16:1-7" },
  "Easter-C": { r1: "Acts 10:34,37-43", ps: "Psalms 118:1-2,16-17,22-23", r2: "Colossians 3:1-4", gospel: "John 20:1-9" },
  "Easter-2-A": { r1: "Acts 2:42-47", ps: "Psalms 118:2-4,13-15,22-24", r2: "1 Peter 1:3-9", gospel: "John 20:19-31" },
  "Easter-2-B": { r1: "Acts 4:32-35", ps: "Psalms 118:2-4,13-15,22-24", r2: "1 John 5:1-6", gospel: "John 20:19-31" },
  "Easter-2-C": { r1: "Acts 5:12-16", ps: "Psalms 118:2-4,13-15,22-24", r2: "Revelation 1:9-11,12-13,17-19", gospel: "John 20:19-31" },
  "Easter-3-A": { r1: "Acts 2:14,22-33", ps: "Psalms 16:1-2,5,7-11", r2: "1 Peter 1:17-21", gospel: "Luke 24:13-35" },
  "Easter-3-B": { r1: "Acts 3:13-15,17-19", ps: "Psalms 4:2,4,7-9", r2: "1 John 2:1-5", gospel: "Luke 24:35-48" },
  "Easter-3-C": { r1: "Acts 5:27-32,40-41", ps: "Psalms 30:2,4-6,11-13", r2: "Revelation 5:11-14", gospel: "John 21:1-19" },
  "Easter-4-A": { r1: "Acts 2:14,36-41", ps: "Psalms 23:1-6", r2: "1 Peter 2:20-25", gospel: "John 10:1-10" },
  "Easter-4-B": { r1: "Acts 4:8-12", ps: "Psalms 118:1,8-9,21-23,26,28-29", r2: "1 John 3:1-2", gospel: "John 10:11-18" },
  "Easter-4-C": { r1: "Acts 13:14,43-52", ps: "Psalms 100:1-3,5", r2: "Revelation 7:9,14-17", gospel: "John 10:27-30" },
  "Easter-5-A": { r1: "Acts 6:1-7", ps: "Psalms 33:1-2,4-5,18-19", r2: "1 Peter 2:4-9", gospel: "John 14:1-12" },
  "Easter-5-B": { r1: "Acts 9:26-31", ps: "Psalms 22:26-28,30-32", r2: "1 John 3:18-24", gospel: "John 15:1-8" },
  "Easter-5-C": { r1: "Acts 14:21-27", ps: "Psalms 145:8-13", r2: "Revelation 21:1-5", gospel: "John 13:31-35" },
  "Easter-6-A": { r1: "Acts 8:5-8,14-17", ps: "Psalms 66:1-7,16,20", r2: "1 Peter 3:15-18", gospel: "John 14:15-21" },
  "Easter-6-B": { r1: "Acts 10:25-26,34-35,44-48", ps: "Psalms 98:1-4", r2: "1 John 4:7-10", gospel: "John 15:9-17" },
  "Easter-6-C": { r1: "Acts 15:1-2,22-29", ps: "Psalms 67:2-3,5-6,8", r2: "Revelation 21:10-14,22-23", gospel: "John 14:23-29" },
  "Easter-7-A": { r1: "Acts 1:12-14", ps: "Psalms 27:1,4,7-8", r2: "1 Peter 4:13-16", gospel: "John 17:1-11" },
  "Easter-7-B": { r1: "Acts 1:15-17,20-26", ps: "Psalms 103:1-2,11-12,19-20", r2: "1 John 4:11-16", gospel: "John 17:11-19" },
  "Easter-7-C": { r1: "Acts 7:55-60", ps: "Psalms 97:1-2,6-7,9", r2: "Revelation 22:12-14,16-17,20", gospel: "John 17:20-26" },
  "Pentecost-A": { r1: "Acts 2:1-11", ps: "Psalms 104:1,24,29-31,34", r2: "1 Corinthians 12:3-7,12-13", gospel: "John 20:19-23" },
  "Pentecost-B": { r1: "Acts 2:1-11", ps: "Psalms 104:1,24,29-31,34", r2: "Galatians 5:16-25", gospel: "John 15:26-27;16:12-15" },
  "Pentecost-C": { r1: "Acts 2:1-11", ps: "Psalms 104:1,24,29-31,34", r2: "Romans 8:8-17", gospel: "John 14:15-16,23-26" },
  // Trinity Sunday
  "Trinity-A": { r1: "Exodus 34:4-6,8-9", ps: "Daniel 3:52-56", r2: "2 Corinthians 13:11-13", gospel: "John 3:16-18" },
  "Trinity-B": { r1: "Deuteronomy 4:32-34,39-40", ps: "Psalms 33:4-6,9,18-20,22", r2: "Romans 8:14-17", gospel: "Matthew 28:16-20" },
  "Trinity-C": { r1: "Proverbs 8:22-31", ps: "Psalms 8:4-9", r2: "Romans 5:1-5", gospel: "John 16:12-15" },
  // Ordinary Time — Sundays (Year A)
  "OT-2-A": { r1: "Isaiah 49:3,5-6", ps: "Psalms 40:2,4,7-10", r2: "1 Corinthians 1:1-3", gospel: "John 1:29-34" },
  "OT-3-A": { r1: "Isaiah 8:23-9:3", ps: "Psalms 27:1,4,13-14", r2: "1 Corinthians 1:10-13,17", gospel: "Matthew 4:12-23" },
  "OT-4-A": { r1: "Zephaniah 2:3;3:12-13", ps: "Psalms 146:6-10", r2: "1 Corinthians 1:26-31", gospel: "Matthew 5:1-12" },
  "OT-5-A": { r1: "Isaiah 58:7-10", ps: "Psalms 112:4-9", r2: "1 Corinthians 2:1-5", gospel: "Matthew 5:13-16" },
  "OT-6-A": { r1: "Sirach 15:15-20", ps: "Psalms 119:1-2,4-5,17-18,33-34", r2: "1 Corinthians 2:6-10", gospel: "Matthew 5:17-37" },
  "OT-7-A": { r1: "Leviticus 19:1-2,17-18", ps: "Psalms 103:1-4,8,10,12-13", r2: "1 Corinthians 3:16-23", gospel: "Matthew 5:38-48" },
  "OT-8-A": { r1: "Isaiah 49:14-15", ps: "Psalms 62:2-3,6-9", r2: "1 Corinthians 4:1-5", gospel: "Matthew 6:24-34" },
  "OT-9-A": { r1: "Deuteronomy 11:18,26-28,32", ps: "Psalms 31:2-4,17,25", r2: "Romans 3:21-25,28", gospel: "Matthew 7:21-27" },
  "OT-10-A": { r1: "Hosea 6:3-6", ps: "Psalms 50:1,8,12-15", r2: "Romans 4:18-25", gospel: "Matthew 9:9-13" },
  "OT-11-A": { r1: "Exodus 19:2-6", ps: "Psalms 100:1-3,5", r2: "Romans 5:6-11", gospel: "Matthew 9:36-10:8" },
  "OT-12-A": { r1: "Jeremiah 20:10-13", ps: "Psalms 69:8-10,14,17,33-35", r2: "Romans 5:12-15", gospel: "Matthew 10:26-33" },
  "OT-13-A": { r1: "2 Kings 4:8-11,14-16", ps: "Psalms 89:2-3,16-19", r2: "Romans 6:3-4,8-11", gospel: "Matthew 10:37-42" },
  "OT-14-A": { r1: "Zechariah 9:9-10", ps: "Psalms 145:1-2,8-11,13-14", r2: "Romans 8:9,11-13", gospel: "Matthew 11:25-30" },
  "OT-15-A": { r1: "Isaiah 55:10-11", ps: "Psalms 65:10-14", r2: "Romans 8:18-23", gospel: "Matthew 13:1-23" },
  "OT-16-A": { r1: "Wisdom 12:13,16-19", ps: "Psalms 86:5-6,9-10,15-16", r2: "Romans 8:26-27", gospel: "Matthew 13:24-43" },
  "OT-17-A": { r1: "1 Kings 3:5,7-12", ps: "Psalms 119:57,72,76-77,127-130", r2: "Romans 8:28-30", gospel: "Matthew 13:44-52" },
  "OT-18-A": { r1: "Isaiah 55:1-3", ps: "Psalms 145:8-9,15-18", r2: "Romans 8:35,37-39", gospel: "Matthew 14:13-21" },
  "OT-19-A": { r1: "1 Kings 19:9,11-13", ps: "Psalms 85:9,11-14", r2: "Romans 9:1-5", gospel: "Matthew 14:22-33" },
  "OT-20-A": { r1: "Isaiah 56:1,6-7", ps: "Psalms 67:2-3,5-6,8", r2: "Romans 11:13-15,29-32", gospel: "Matthew 15:21-28" },
  "OT-21-A": { r1: "Isaiah 22:19-23", ps: "Psalms 138:1-3,6,8", r2: "Romans 11:33-36", gospel: "Matthew 16:13-20" },
  "OT-22-A": { r1: "Jeremiah 20:7-9", ps: "Psalms 63:2-6,8-9", r2: "Romans 12:1-2", gospel: "Matthew 16:21-27" },
  "OT-23-A": { r1: "Ezekiel 33:7-9", ps: "Psalms 95:1-2,6-9", r2: "Romans 13:8-10", gospel: "Matthew 18:15-20" },
  "OT-24-A": { r1: "Sirach 27:30-28:7", ps: "Psalms 103:1-4,9-12", r2: "Romans 14:7-9", gospel: "Matthew 18:21-35" },
  "OT-25-A": { r1: "Isaiah 55:6-9", ps: "Psalms 145:2-3,8-9,17-18", r2: "Philippians 1:20-24,27", gospel: "Matthew 20:1-16" },
  "OT-26-A": { r1: "Ezekiel 18:25-28", ps: "Psalms 25:4-9", r2: "Philippians 2:1-11", gospel: "Matthew 21:28-32" },
  "OT-27-A": { r1: "Isaiah 5:1-7", ps: "Psalms 80:9,12-16,19-20", r2: "Philippians 4:6-9", gospel: "Matthew 21:33-43" },
  "OT-28-A": { r1: "Isaiah 25:6-10", ps: "Psalms 23:1-6", r2: "Philippians 4:12-14,19-20", gospel: "Matthew 22:1-14" },
  "OT-29-A": { r1: "Isaiah 45:1,4-6", ps: "Psalms 96:1,3-5,7-10", r2: "1 Thessalonians 1:1-5", gospel: "Matthew 22:15-21" },
  "OT-30-A": { r1: "Exodus 22:20-26", ps: "Psalms 18:2-4,47,51", r2: "1 Thessalonians 1:5-10", gospel: "Matthew 22:34-40" },
  "OT-31-A": { r1: "Malachi 1:14-2:2,8-10", ps: "Psalms 131:1-3", r2: "1 Thessalonians 2:7-9,13", gospel: "Matthew 23:1-12" },
  "OT-32-A": { r1: "Wisdom 6:12-16", ps: "Psalms 63:2-8", r2: "1 Thessalonians 4:13-18", gospel: "Matthew 25:1-13" },
  "OT-33-A": { r1: "Proverbs 31:10-13,19-20,30-31", ps: "Psalms 128:1-5", r2: "1 Thessalonians 5:1-6", gospel: "Matthew 25:14-30" },
  "OT-Christ-A": { r1: "Ezekiel 34:11-12,15-17", ps: "Psalms 23:1-3,5-6", r2: "1 Corinthians 15:20-26,28", gospel: "Matthew 25:31-46" },
  // Ordinary Time — Sundays (Year B)
  "OT-2-B": { r1: "1 Samuel 3:3-10,19", ps: "Psalms 40:2,4,7-10", r2: "1 Corinthians 6:13-15,17-20", gospel: "John 1:35-42" },
  "OT-3-B": { r1: "Jonah 3:1-5,10", ps: "Psalms 25:4-9", r2: "1 Corinthians 7:29-31", gospel: "Mark 1:14-20" },
  "OT-4-B": { r1: "Deuteronomy 18:15-20", ps: "Psalms 95:1-2,6-9", r2: "1 Corinthians 7:32-35", gospel: "Mark 1:21-28" },
  "OT-5-B": { r1: "Job 7:1-4,6-7", ps: "Psalms 147:1-6", r2: "1 Corinthians 9:16-19,22-23", gospel: "Mark 1:29-39" },
  "OT-6-B": { r1: "Leviticus 13:1-2,44-46", ps: "Psalms 32:1-2,5,11", r2: "1 Corinthians 10:31-11:1", gospel: "Mark 1:40-45" },
  "OT-7-B": { r1: "Isaiah 43:18-19,21-22,24-25", ps: "Psalms 41:2-5,13-14", r2: "2 Corinthians 1:18-22", gospel: "Mark 2:1-12" },
  "OT-8-B": { r1: "Hosea 2:16,17,21-22", ps: "Psalms 103:1-4,8,10,12-13", r2: "2 Corinthians 3:1-6", gospel: "Mark 2:18-22" },
  "OT-9-B": { r1: "Deuteronomy 5:12-15", ps: "Psalms 81:3-8,10-11", r2: "2 Corinthians 4:6-11", gospel: "Mark 2:23-3:6" },
  "OT-10-B": { r1: "Genesis 3:9-15", ps: "Psalms 130:1-8", r2: "2 Corinthians 4:13-5:1", gospel: "Mark 3:20-35" },
  "OT-11-B": { r1: "Ezekiel 17:22-24", ps: "Psalms 92:2-3,13-16", r2: "2 Corinthians 5:6-10", gospel: "Mark 4:26-34" },
  "OT-12-B": { r1: "Job 38:1,8-11", ps: "Psalms 107:23-26,28-31", r2: "2 Corinthians 5:14-17", gospel: "Mark 4:35-41" },
  "OT-13-B": { r1: "Wisdom 1:13-15;2:23-24", ps: "Psalms 30:2,4-6,11-13", r2: "2 Corinthians 8:7,9,13-15", gospel: "Mark 5:21-43" },
  "OT-14-B": { r1: "Ezekiel 2:2-5", ps: "Psalms 123:1-4", r2: "2 Corinthians 12:7-10", gospel: "Mark 6:1-6" },
  "OT-15-B": { r1: "Amos 7:12-15", ps: "Psalms 85:9-14", r2: "Ephesians 1:3-14", gospel: "Mark 6:7-13" },
  "OT-16-B": { r1: "Jeremiah 23:1-6", ps: "Psalms 23:1-6", r2: "Ephesians 2:13-18", gospel: "Mark 6:30-34" },
  "OT-17-B": { r1: "2 Kings 4:42-44", ps: "Psalms 145:10-11,15-18", r2: "Ephesians 4:1-6", gospel: "John 6:1-15" },
  "OT-18-B": { r1: "Exodus 16:2-4,12-15", ps: "Psalms 78:3-4,23-25,54", r2: "Ephesians 4:17,20-24", gospel: "John 6:24-35" },
  "OT-19-B": { r1: "1 Kings 19:4-8", ps: "Psalms 34:2-9", r2: "Ephesians 4:30-5:2", gospel: "John 6:41-51" },
  "OT-20-B": { r1: "Proverbs 9:1-6", ps: "Psalms 34:2-7", r2: "Ephesians 5:15-20", gospel: "John 6:51-58" },
  "OT-21-B": { r1: "Joshua 24:1-2,15-17,18", ps: "Psalms 34:2-3,16-21", r2: "Ephesians 5:21-32", gospel: "John 6:60-69" },
  "OT-22-B": { r1: "Deuteronomy 4:1-2,6-8", ps: "Psalms 15:2-5", r2: "James 1:17-18,21-22,27", gospel: "Mark 7:1-8,14-15,21-23" },
  "OT-23-B": { r1: "Isaiah 35:4-7", ps: "Psalms 146:7-10", r2: "James 2:1-5", gospel: "Mark 7:31-37" },
  "OT-24-B": { r1: "Isaiah 50:5-9", ps: "Psalms 116:1-6,8-9", r2: "James 2:14-18", gospel: "Mark 8:27-35" },
  "OT-25-B": { r1: "Wisdom 2:12,17-20", ps: "Psalms 54:3-6,8", r2: "James 3:16-4:3", gospel: "Mark 9:30-37" },
  "OT-26-B": { r1: "Numbers 11:25-29", ps: "Psalms 19:8,10,12-14", r2: "James 5:1-6", gospel: "Mark 9:38-43,45,47-48" },
  "OT-27-B": { r1: "Genesis 2:18-24", ps: "Psalms 128:1-6", r2: "Hebrews 2:9-11", gospel: "Mark 10:2-16" },
  "OT-28-B": { r1: "Wisdom 7:7-11", ps: "Psalms 90:12-17", r2: "Hebrews 4:12-13", gospel: "Mark 10:17-30" },
  "OT-29-B": { r1: "Isaiah 53:10-11", ps: "Psalms 33:4-5,18-20,22", r2: "Hebrews 4:14-16", gospel: "Mark 10:35-45" },
  "OT-30-B": { r1: "Jeremiah 31:7-9", ps: "Psalms 126:1-6", r2: "Hebrews 5:1-6", gospel: "Mark 10:46-52" },
  "OT-31-B": { r1: "Deuteronomy 6:2-6", ps: "Psalms 18:2-4,47,51", r2: "Hebrews 7:23-28", gospel: "Mark 12:28-34" },
  "OT-32-B": { r1: "1 Kings 17:10-16", ps: "Psalms 146:7-10", r2: "Hebrews 9:24-28", gospel: "Mark 12:38-44" },
  "OT-33-B": { r1: "Daniel 12:1-3", ps: "Psalms 16:5,8-11", r2: "Hebrews 10:11-14,18", gospel: "Mark 13:24-32" },
  "OT-Christ-B": { r1: "Daniel 7:13-14", ps: "Psalms 93:1-2,5", r2: "Revelation 1:5-8", gospel: "John 18:33-37" },
  // Ordinary Time — Sundays (Year C)
  "OT-2-C": { r1: "Isaiah 62:1-5", ps: "Psalms 96:1-3,7-10", r2: "1 Corinthians 12:4-11", gospel: "John 2:1-11" },
  "OT-3-C": { r1: "Nehemiah 8:2-4,5-6,8-10", ps: "Psalms 19:8-10,15", r2: "1 Corinthians 12:12-30", gospel: "Luke 1:1-4;4:14-21" },
  "OT-4-C": { r1: "Jeremiah 1:4-5,17-19", ps: "Psalms 71:1-6,15,17", r2: "1 Corinthians 12:31-13:13", gospel: "Luke 4:21-30" },
  "OT-5-C": { r1: "Isaiah 6:1-2,3-8", ps: "Psalms 138:1-5,7-8", r2: "1 Corinthians 15:1-11", gospel: "Luke 5:1-11" },
  "OT-6-C": { r1: "Jeremiah 17:5-8", ps: "Psalms 1:1-4,6", r2: "1 Corinthians 15:12,16-20", gospel: "Luke 6:17,20-26" },
  "OT-7-C": { r1: "1 Samuel 26:2,7-9,12-13,22-23", ps: "Psalms 103:1-4,8,10,12-13", r2: "1 Corinthians 15:45-49", gospel: "Luke 6:27-38" },
  "OT-8-C": { r1: "Sirach 27:4-7", ps: "Psalms 92:2-3,13-16", r2: "1 Corinthians 15:54-58", gospel: "Luke 6:39-45" },
  "OT-9-C": { r1: "1 Kings 8:41-43", ps: "Psalms 117:1-2", r2: "Galatians 1:1-2,6-10", gospel: "Luke 7:1-10" },
  "OT-10-C": { r1: "1 Kings 17:17-24", ps: "Psalms 30:2,4-6,11-13", r2: "Galatians 1:11-19", gospel: "Luke 7:11-17" },
  "OT-11-C": { r1: "2 Samuel 12:7-10,13", ps: "Psalms 32:1-2,5,7,11", r2: "Galatians 2:16,19-21", gospel: "Luke 7:36-8:3" },
  "OT-12-C": { r1: "Zechariah 12:10-11;13:1", ps: "Psalms 63:2-6,8-9", r2: "Galatians 3:26-29", gospel: "Luke 9:18-24" },
  "OT-13-C": { r1: "1 Kings 19:16,19-21", ps: "Psalms 16:1-2,5,7-11", r2: "Galatians 5:1,13-18", gospel: "Luke 9:51-62" },
  "OT-14-C": { r1: "Isaiah 66:10-14", ps: "Psalms 66:1-7,16,20", r2: "Galatians 6:14-18", gospel: "Luke 10:1-12,17-20" },
  "OT-15-C": { r1: "Deuteronomy 30:10-14", ps: "Psalms 69:14,17,30-31,33-34,36-37", r2: "Colossians 1:15-20", gospel: "Luke 10:25-37" },
  "OT-16-C": { r1: "Genesis 18:1-10", ps: "Psalms 15:2-5", r2: "Colossians 1:24-28", gospel: "Luke 10:38-42" },
  "OT-17-C": { r1: "Genesis 18:20-32", ps: "Psalms 138:1-3,6-8", r2: "Colossians 2:12-14", gospel: "Luke 11:1-13" },
  "OT-18-C": { r1: "Ecclesiastes 1:2;2:21-23", ps: "Psalms 90:3-6,12-14,17", r2: "Colossians 3:1-5,9-11", gospel: "Luke 12:13-21" },
  "OT-19-C": { r1: "Wisdom 18:6-9", ps: "Psalms 33:1,12,18-20,22", r2: "Hebrews 11:1-2,8-19", gospel: "Luke 12:32-48" },
  "OT-20-C": { r1: "Jeremiah 38:4-6,8-10", ps: "Psalms 40:2-4,18", r2: "Hebrews 12:1-4", gospel: "Luke 12:49-53" },
  "OT-21-C": { r1: "Isaiah 66:18-21", ps: "Psalms 117:1-2", r2: "Hebrews 12:5-7,11-13", gospel: "Luke 13:22-30" },
  "OT-22-C": { r1: "Sirach 3:17-18,20,28-29", ps: "Psalms 68:4-7,10-11", r2: "Hebrews 12:18-19,22-24", gospel: "Luke 14:1,7-14" },
  "OT-23-C": { r1: "Wisdom 9:13-18", ps: "Psalms 90:3-6,12-14,17", r2: "Philemon 9-10,12-17", gospel: "Luke 14:25-33" },
  "OT-24-C": { r1: "Exodus 32:7-11,13-14", ps: "Psalms 51:3-4,12-13,17,19", r2: "1 Timothy 1:12-17", gospel: "Luke 15:1-32" },
  "OT-25-C": { r1: "Amos 8:4-7", ps: "Psalms 113:1-2,4-8", r2: "1 Timothy 2:1-8", gospel: "Luke 16:1-13" },
  "OT-26-C": { r1: "Amos 6:1,4-7", ps: "Psalms 146:7-10", r2: "1 Timothy 6:11-16", gospel: "Luke 16:19-31" },
  "OT-27-C": { r1: "Habakkuk 1:2-3;2:2-4", ps: "Psalms 95:1-2,6-9", r2: "2 Timothy 1:6-8,13-14", gospel: "Luke 17:5-10" },
  "OT-28-C": { r1: "2 Kings 5:14-17", ps: "Psalms 98:1-4", r2: "2 Timothy 2:8-13", gospel: "Luke 17:11-19" },
  "OT-29-C": { r1: "Exodus 17:8-13", ps: "Psalms 121:1-8", r2: "2 Timothy 3:14-4:2", gospel: "Luke 18:1-8" },
  "OT-30-C": { r1: "Sirach 35:12-14,16-18", ps: "Psalms 34:2-3,17-19,23", r2: "2 Timothy 4:6-8,16-18", gospel: "Luke 18:9-14" },
  "OT-31-C": { r1: "Wisdom 11:22-12:2", ps: "Psalms 145:1-2,8-11,13-14", r2: "2 Thessalonians 1:11-2:2", gospel: "Luke 19:1-10" },
  "OT-32-C": { r1: "2 Maccabees 7:1-2,9-14", ps: "Psalms 17:1,5-6,8,15", r2: "2 Thessalonians 2:16-3:5", gospel: "Luke 20:27-38" },
  "OT-33-C": { r1: "Malachi 3:19-20", ps: "Psalms 98:5-9", r2: "2 Thessalonians 3:7-12", gospel: "Luke 21:5-19" },
  "OT-Christ-C": { r1: "2 Samuel 5:1-3", ps: "Psalms 122:1-5", r2: "Colossians 1:12-20", gospel: "Luke 23:35-43" },
};

// Map a date to a lectionary key
function getLectionaryKey(date) {
  const { sundayCycle } = getLiturgicalYear(date);
  const year = date.getFullYear();
  const easter = getEasterDate(year);
  const easterMs = easter.getTime();
  const dayMs = 86400000;
  const isSame = (a, b) => a.toDateString() === b.toDateString();
  const isBetween = (d, s, e) => d >= s && d <= e;
  const dow = date.getDay(); // 0=Sun

  // Special fixed feasts
  const m = date.getMonth() + 1, d = date.getDate();
  if (m === 12 && d === 25) return "Christmas-Day";
  if (m === 11 && d === 1) return null; // All Saints — skip for now

  // Moveable feasts
  const ashWed = new Date(easterMs - 46 * dayMs);
  const palmSun = new Date(easterMs - 7 * dayMs);
  const pentecost = new Date(easterMs + 49 * dayMs);
  const trinity = new Date(easterMs + 56 * dayMs);
  const ascension = new Date(easterMs + 39 * dayMs);

  if (dow !== 0) return null; // Only handle Sundays for now

  if (isSame(date, easter)) return `Easter-${sundayCycle}`;
  if (isSame(date, palmSun)) return `Palm-${sundayCycle}`;
  if (isSame(date, pentecost)) return `Pentecost-${sundayCycle}`;
  if (isSame(date, trinity)) return `Trinity-${sundayCycle}`;
  if (isSame(date, ascension)) return null;

  // Easter weeks
  if (isBetween(date, easter, pentecost)) {
    const w = Math.round((date.getTime() - easterMs) / (7 * dayMs));
    if (w >= 2 && w <= 7) return `Easter-${w}-${sundayCycle}`;
  }

  // Lent
  const xmas = new Date(year, 11, 25);
  const xmasDay = xmas.getDay();
  const advent1 = new Date(xmas.getTime() - ((xmasDay === 0 ? 7 : xmasDay) + 21) * dayMs);
  if (isBetween(date, ashWed, palmSun)) {
    const w = Math.round((date.getTime() - ashWed.getTime()) / (7 * dayMs));
    if (w >= 1 && w <= 5) return `Lent-${w}-${sundayCycle}`;
  }

  // Advent
  if (isBetween(date, advent1, new Date(year, 11, 24))) {
    const w = Math.round((date.getTime() - advent1.getTime()) / (7 * dayMs)) + 1;
    if (w >= 1 && w <= 4) return `Advent-${w}-${sundayCycle}`;
  }

  // Ordinary Time — determine week number
  // First OT Sunday is after Baptism of the Lord (Sunday after Epiphany after Jan 6)
  // Approximate: count back from Lent and assign week numbers
  // Second pass: count forward from Epiphany season end
  const epiphany = new Date(year, 0, 6);
  const epiphanyDay = epiphany.getDay();
  // Sunday after Epiphany
  const baptismSun = epiphanyDay === 0 ? epiphany : new Date(epiphany.getTime() + (7 - epiphanyDay) * dayMs);
  const ot1Start = new Date(baptismSun.getTime() + 7 * dayMs); // OT week 2 starts after Baptism

  if (date >= ot1Start && date < ashWed) {
    const w = Math.round((date.getTime() - baptismSun.getTime()) / (7 * dayMs)) + 1;
    if (w >= 2 && w <= 9) return `OT-${w}-${sundayCycle}`;
  }

  if (date > pentecost && date < advent1) {
    // Post-Pentecost OT — count back from Christ the King
    const lastSunBeforeAdvent = new Date(advent1.getTime() - 7 * dayMs);
    const weeksFromEnd = Math.round((lastSunBeforeAdvent.getTime() - date.getTime()) / (7 * dayMs));
    if (weeksFromEnd === 0) return `OT-Christ-${sundayCycle}`;
    // Christ the King is last Sunday before Advent; count back
    const weekNum = 34 - weeksFromEnd;
    if (weekNum >= 10 && weekNum <= 33) return `OT-${weekNum}-${sundayCycle}`;
  }

  return null;
}

// ─── READINGS VIA CLAUDE API ─────────────────────────────────────────────────
// Claude knows the full Roman Rite lectionary and returns the correct readings
// for any date — Sundays, weekdays, feasts, memorials, solemnities.
// Returns readings in English + native language translation in one call.
async function fetchUniversalisReadings(lang) {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const dateStr = `${y}-${m}-${d}`;
  const langLabel = lang === "pt" ? "Brazilian Portuguese (Catholic, CNBB style)" : "Latin American Spanish (Catholic, Biblia de Jerusalén style)";

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system: `You are a Catholic liturgical expert with complete knowledge of the Roman Rite lectionary. Given a date, return the correct Mass readings for that day — including weekdays, Sundays, feasts, memorials, and solemnities per the Roman Catholic liturgical calendar.

Return ONLY valid JSON — no markdown, no backticks, no preamble. Return a JSON array of objects in liturgical order:
[
  { "label": "First Reading", "reference": "Book Chapter:Verses", "text": "full English text of the reading", "nativeText": "${langLabel} translation" },
  { "label": "Responsorial Psalm", "reference": "Psalm N:Verses", "text": "full English text", "nativeText": "${langLabel} translation" },
  { "label": "Second Reading", "reference": "Book Chapter:Verses", "text": "full English text", "nativeText": "${langLabel} translation" },
  { "label": "Gospel Acclamation", "reference": "", "text": "Alleluia verse text only", "nativeText": "${langLabel} translation" },
  { "label": "Gospel", "reference": "Book Chapter:Verses", "text": "full English text", "nativeText": "${langLabel} translation" }
]

Rules:
- Include Second Reading only if it exists for that day (Sundays and solemnities only)
- Include Gospel Acclamation verse (the line sung before the Gospel, not the Alleluia itself)
- Always include the FULL text of each reading, word for word, not a summary
- Use NABRE-style English (what US Catholics hear at Mass)
- The nativeText must be a proper ${langLabel} Catholic translation`,
      messages: [{ role: "user", content: `Return the complete Roman Catholic Mass readings for ${dateStr} as JSON with ${lang === "pt" ? "Portuguese" : "Spanish"} translations.` }]
    })
  });

  const data = await res.json();
  const tb = data.content?.find(b => b.type === "text");
  if (!tb?.text) throw new Error("No response from Claude");
  const clean = tb.text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(clean);
  if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Empty readings");
  return parsed;
}


// ─── FULL EUCHARISTIC PRAYER TEXT ────────────────────────────────────────────
const EP = {
  I: {
    label: "PE I — Canon Romano", labelEn: "EP I — Roman Canon (most ancient)",
    rubric: { short: "Most ancient. Long and solemn. Common on major feasts.", long: "The Roman Canon dates to the 4th century and was the only Eucharistic Prayer in the Latin Rite for over 1,000 years. Rich in intercessions and memorials of the saints." },
    lines: [
      { sp: "P", r: "Te igitur — Pai clementíssimo, nós vos suplicamos e pedimos, por Jesus Cristo, vosso Filho e Senhor nosso, que aceiteis e abençoeis estes dons, estas oferendas, estes santos e imaculados sacrifícios que vos oferecemos em primeiro lugar pela vossa santa Igreja Católica...", e: "Therefore, most merciful Father, we humbly pray and beseech you, through Jesus Christ your Son, our Lord, to accept and bless these gifts, these offerings, these holy and unblemished sacrifices, which we offer you firstly for your holy catholic Church..." },
      { sp: "P", r: "Hanc igitur — Pai, pedimos-vos benignamente que aceiteis esta oblação dos vossos servos e de toda a vossa família; ordenai em vossa paz os nossos dias, livrai-nos da condenação eterna e contai-nos no rebanho dos vossos eleitos. Por Cristo, nosso Senhor. Améem.", e: "Therefore, Lord, we pray: graciously accept this oblation of our service, that of your whole family; order our days in your peace, and command that we be delivered from eternal damnation and counted among the flock of those you have chosen. Through Christ our Lord. Amen." },
      { sp: "P", r: "Quam oblationem — Rogamos-vos, ó Deus, que esta oferta seja aceita, inscrita, ratificada, tornada espiritual e agradável; a fim de que se torne para nós o Corpo e o Sangue do vosso amantíssimo Filho.", e: "Be pleased, O God, we pray, to bless, acknowledge, and approve this offering in every respect; make it spiritual and acceptable, so that it may become for us the Body and Blood of your most beloved Son, our Lord Jesus Christ." },
      { sp: "P", r: "CONSAGRAÇÃO DO PÃO\nEle, no dia anterior à sua Paixão, tomou o pão em suas santas e veneráveis mãos, e, erguendo os olhos ao céu, dando-vos graças pela vossa bênção, partiu-o, deu-o a seus discípulos e disse:\n\nTomai e comei todos vós,\npois ISTO É O MEU CORPO\nQUE SERÁ ENTREGUE POR VÓS.", e: "CONSECRATION OF THE BREAD\nOn the day before he was to suffer, he took bread in his holy and venerable hands, and with eyes raised to heaven to you, O God, his almighty Father, giving you thanks, he said the blessing, broke the bread and gave it to his disciples, saying:\n\nTake this, all of you, and eat of it,\nfor THIS IS MY BODY,\nWHICH WILL BE GIVEN UP FOR YOU." },
      { sp: "P", r: "CONSAGRAÇÃO DO CÁLICE\nDa mesma forma, depois da ceia, tomando este glorioso cálice em suas santas e veneráveis mãos, novamente dando graças, abençoou-o, e deu-o a seus discípulos dizendo:\n\nTomai e bebei todos vós,\npois ESTE É O CÁLICE DO MEU SANGUE,\nO SANGUE DA NOVA E ETERNA ALIANÇA,\nQUE SERÁ DERRAMADO POR VÓS E POR TODOS\nPARA REMISSÃO DOS PECADOS.\nFAZEI ISTO EM MEMÓRIA DE MIM.", e: "CONSECRATION OF THE CHALICE\nIn a similar way, when supper was ended, he took this precious chalice in his holy and venerable hands, and once more giving you thanks, he said the blessing and gave the chalice to his disciples, saying:\n\nTake this, all of you, and drink from it,\nfor THIS IS THE CHALICE OF MY BLOOD,\nTHE BLOOD OF THE NEW AND ETERNAL COVENANT,\nWHICH WILL BE POURED OUT FOR YOU AND FOR MANY\nFOR THE FORGIVENESS OF SINS.\nDO THIS IN MEMORY OF ME." },
      { sp: "P", r: "Mysterium fidei.", e: "The mystery of faith." },
      { sp: "P", r: "Unde et memores — Portanto, Senhor, nós, vossos servos, mas também o vosso povo santo, memoriosos da bem-aventurada Paixão, da Ressurreição dos infernos e da gloriosa Ascensão ao céu do mesmo Cristo, vosso Filho e Senhor nosso, vos oferecemos desta multidão de dons vossos, uma hóstia pura, uma hóstia santa, uma hóstia imaculada: o Pão santo da vida eterna e o Cálice da salvação perpétua.", e: "Therefore, O Lord, as we celebrate the memorial of the blessed Passion, the Resurrection from the dead, and the glorious Ascension into heaven of Christ, your Son, our Lord, we, your servants and your holy people, offer to your glorious majesty, from the gifts that you have given us, this pure victim, this holy victim, this spotless victim, the holy Bread of eternal life and the Chalice of everlasting salvation." },
      { sp: "P", r: "Supplices te rogamus — Suplicantemente vos pedimos, Deus Todo-Poderoso, que mandeis estas coisas pelas mãos do vosso santo Anjo ao vosso altar do alto, na presença de vossa divina majestade; e que aqueles que por participação a partir deste altar receberem o santíssimo Corpo e Sangue de vosso Filho, sejam plenos de toda graça e bênção celestial. Por Cristo, nosso Senhor. Améem.", e: "In humble prayer we ask you, almighty God: command that these gifts be borne by the hands of your holy Angel to your altar on high in the sight of your divine majesty, so that all of us, who through this participation at the altar receive the most holy Body and Blood of your Son, may be filled with every grace and heavenly blessing. Through Christ our Lord. Amen." },
      { sp: "P", r: "Por Cristo, com Cristo e em Cristo,\na vós, Deus Pai todo-poderoso,\nna unidade do Espírito Santo,\ntoda a honra e toda a glória,\nagora e para sempre.", e: "Through him, and with him, and in him,\nO God, almighty Father,\nin the unity of the Holy Spirit,\nall glory and honour is yours,\nfor ever and ever." },
      { sp: "A", r: "Améem.", e: "Amen." },
    ]
  },
  II: {
    label: "PE II — Mais breve", labelEn: "EP II — Shortest (3rd-century origin)",
    rubric: { short: "Shortest. Based on Hippolytus (c. 215 AD). Common on weekdays.", long: "Based on the Apostolic Tradition attributed to Hippolytus of Rome. Has its own Preface but another may be substituted. Preferred on weekdays for its brevity." },
    lines: [
      { sp: "P", r: "Prefácio — Sois verdadeiramente santo, ó Senhor, fonte de toda santidade.", e: "You are indeed Holy, O Lord, the fount of all holiness." },
      { sp: "P", r: "Epiclese — Santificai, portanto, estas oferendas, derramando sobre elas o vosso Espírito, a fim de que se tornem o Corpo e o Sangue de nosso Senhor Jesus Cristo para a celebração deste grande mistério que o próprio Senhor nos mandou celebrar.", e: "Make holy, therefore, these gifts, we pray, by sending down your Spirit upon them like the dewfall, so that they may become for us the Body and Blood of our Lord Jesus Christ, for the celebration of this great mystery, which he himself left us as an eternal covenant." },
      { sp: "P", r: "CONSAGRAÇÃO DO PÃO\nEle, quando estava para ser entregue e aceitava livremente a Paixão, tomou o pão, deu graças, partiu-o, deu-o a seus discípulos e disse:\n\nTomai e comei todos vós,\npois ISTO É O MEU CORPO\nQUE SERÁ ENTREGUE POR VÓS.", e: "CONSECRATION OF THE BREAD\nAt the time he was betrayed and entered willingly into his Passion, he took bread and, giving thanks, broke it, and gave it to his disciples, saying:\n\nTake this, all of you, and eat of it,\nfor THIS IS MY BODY,\nWHICH WILL BE GIVEN UP FOR YOU." },
      { sp: "P", r: "CONSAGRAÇÃO DO CÁLICE\nDa mesma forma, depois da Ceia, tomando o cálice de novo deu graças, e deu-o a seus discípulos dizendo:\n\nTomai e bebei todos vós,\npois ESTE É O CÁLICE DO MEU SANGUE,\nO SANGUE DA NOVA E ETERNA ALIANÇA,\nQUE SERÁ DERRAMADO POR VÓS E POR TODOS\nPARA REMISSÃO DOS PECADOS.\nFAZEI ISTO EM MEMÓRIA DE MIM.", e: "CONSECRATION OF THE CHALICE\nIn a similar way, when supper was ended, he again took the chalice, and giving thanks, gave it to his disciples, saying:\n\nTake this, all of you, and drink from it,\nfor THIS IS THE CHALICE OF MY BLOOD,\nTHE BLOOD OF THE NEW AND ETERNAL COVENANT,\nWHICH WILL BE POURED OUT FOR YOU AND FOR MANY\nFOR THE FORGIVENESS OF SINS.\nDO THIS IN MEMORY OF ME." },
      { sp: "P", r: "Mysterium fidei.", e: "The mystery of faith." },
      { sp: "P", r: "Anamnese — Memoriosos da morte e ressurreição de Cristo, vos oferecemos, Senhor, o Pão da vida e o Cálice da salvação e vos agradecemos por nos fazer dignos de assistir diante de vós e de vos servir.", e: "Mindful therefore of his Death and Resurrection, we offer you, Lord, the Bread of life and the Chalice of salvation, giving thanks that you have held us worthy to be in your presence and minister to you." },
      { sp: "P", r: "Intercessões — Humildemente vos pedimos que, por participação no Corpo e no Sangue de Cristo, o Espírito Santo nos congregue em um único corpo. Lembrai-vos, Senhor, da vossa Igreja espalhada por toda a terra...", e: "Humbly we pray that, partaking of the Body and Blood of Christ, we may be gathered into one by the Holy Spirit. Remember, Lord, your Church, spread throughout the world..." },
      { sp: "P", r: "Por Cristo, com Cristo e em Cristo,\na vós, Deus Pai todo-poderoso,\nna unidade do Espírito Santo,\ntoda a honra e toda a glória,\nagora e para sempre.", e: "Through him, and with him, and in him,\nO God, almighty Father,\nin the unity of the Holy Spirit,\nall glory and honour is yours,\nfor ever and ever." },
      { sp: "A", r: "Améem.", e: "Amen." },
    ]
  },
  III: {
    label: "PE III — Comum nos Domingos", labelEn: "EP III — Most common on Sundays",
    rubric: { short: "Theologically rich. The most used on Sundays. No proper Preface.", long: "Composed after Vatican II. Can be combined with any Preface. Preferred on Sundays for its theological richness and moderate length." },
    lines: [
      { sp: "P", r: "Epiclese — Sois verdadeiramente santo, ó Pai, e com justiça o universo inteiro vos louva, pois é por vosso Verbo que tudo viveu. Enviai agora o vosso Espírito sobre estas oferendas para que se tornem o Corpo e o Sangue do vosso Filho Nosso Senhor Jesus Cristo, por cuja ordem celebramos estes mistérios.", e: "You are indeed Holy, O Lord, and all you have created rightly gives you praise. For through your Son our Lord Jesus Christ, by the power and working of the Holy Spirit, you give life to all things and make them holy. Therefore, O Lord, we humbly implore you: by the same Spirit graciously make holy these gifts we have brought to you for consecration, that they may become the Body and Blood of your Son our Lord Jesus Christ, at whose command we celebrate these mysteries." },
      { sp: "P", r: "CONSAGRAÇÃO DO PÃO\nEle, na noite em que foi traído, tomou o pão, e dando graças, partiu-o e o deu a seus discípulos dizendo:\n\nTomai e comei todos vós,\npois ISTO É O MEU CORPO\nQUE SERÁ ENTREGUE POR VÓS.", e: "CONSECRATION OF THE BREAD\nFor on the night he was betrayed he himself took bread, and, giving you thanks, he said the blessing, broke the bread and gave it to his disciples, saying:\n\nTake this, all of you, and eat of it,\nfor THIS IS MY BODY,\nWHICH WILL BE GIVEN UP FOR YOU." },
      { sp: "P", r: "CONSAGRAÇÃO DO CÁLICE\nDa mesma forma, depois da Ceia, tomando o cálice e dando graças, deu-o a seus discípulos dizendo:\n\nTomai e bebei todos vós,\npois ESTE É O CÁLICE DO MEU SANGUE,\nO SANGUE DA NOVA E ETERNA ALIANÇA,\nQUE SERÁ DERRAMADO POR VÓS E POR TODOS\nPARA REMISSÃO DOS PECADOS.\nFAZEI ISTO EM MEMÓRIA DE MIM.", e: "CONSECRATION OF THE CHALICE\nIn a similar way, when supper was ended, he took the chalice, and giving you thanks, he said the blessing, and gave the chalice to his disciples, saying:\n\nTake this, all of you, and drink from it,\nfor THIS IS THE CHALICE OF MY BLOOD,\nTHE BLOOD OF THE NEW AND ETERNAL COVENANT,\nWHICH WILL BE POURED OUT FOR YOU AND FOR MANY\nFOR THE FORGIVENESS OF SINS.\nDO THIS IN MEMORY OF ME." },
      { sp: "P", r: "Mysterium fidei.", e: "The mystery of faith." },
      { sp: "P", r: "Anamnese — Memoriosos, ó Senhor, do sacrifício salvador do vosso Filho, da bem-aventurada Paixão, da Ressurreição gloriosa e da Ascensão ao céu, enquanto aguardamos a sua vinda gloriosa, vos oferecemos, em ação de graças, esta hóstia viva e santa. Dignai-vos lançar o olhar sobre a oblação da vossa Igreja e, reconhecendo nela a hóstia imolada pela nossa redenção, concedei que quantos participam do Corpo e do Sangue de vosso Filho sejam cheios do Espírito Santo e se tornem em Cristo um único corpo e um único espírito.", e: "Therefore, O Lord, as we celebrate the memorial of the saving Passion of your Son, his wondrous Resurrection and Ascension into heaven, and as we look forward to his second coming, we offer you in thanksgiving this holy and living sacrifice. Look, we pray, upon the oblation of your Church, and, recognizing the sacrificial Victim by whose death you willed to reconcile us to yourself, grant that we, who are nourished by the Body and Blood of your Son and filled with his Holy Spirit, may become one body, one spirit in Christ." },
      { sp: "P", r: "Intercessões — Que Ele faça de nós uma oferenda perene para vós, a fim de que alcancemos a herança com os vossos eleitos, em especial com a santíssima Virgem Maria, Mãe de Deus, com os vossos santos apóstolos e gloriosos mártires e com todos os santos, por cuja intercessão confiamos em receber sempre o vosso auxílio...\n\nLembrai-vos, Senhor, de toda a vossa Igreja...\nLembrai-vos também de nossos irmãos que partiram desta vida na paz do vosso Cristo...", e: "May he make of us an eternal offering to you, so that we may obtain an inheritance with your elect, especially with the most Blessed Virgin Mary, Mother of God, with your blessed Apostles and glorious Martyrs, with all the Saints, on whose constant intercession in your presence we rely for unfailing help...\n\nRemember your servant whom you have called from this world to yourself...\nHave mercy on us all, we pray, that with the Blessed Virgin Mary, Mother of God, with the Apostles and Saints, we may merit to be coheirs to eternal life..." },
      { sp: "P", r: "Por Cristo, com Cristo e em Cristo,\na vós, Deus Pai todo-poderoso,\nna unidade do Espírito Santo,\ntoda a honra e toda a glória,\nagora e para sempre.", e: "Through him, and with him, and in him,\nO God, almighty Father,\nin the unity of the Holy Spirit,\nall glory and honour is yours,\nfor ever and ever." },
      { sp: "A", r: "Améem.", e: "Amen." },
    ]
  },
  IV: {
    label: "PE IV — Prefácio próprio obrigatório", labelEn: "EP IV — Own mandatory Preface",
    rubric: { short: "Has its own Preface that cannot be replaced. Cannot be used on feasts with a proper Preface.", long: "Inspired by Eastern anaphoras (Basil of Caesarea). Its Preface is inseparable — it cannot be substituted. Therefore not suitable for feasts and solemnities that have their own proper Preface. The most complete theologically." },
    lines: [
      { sp: "P", r: "Prefácio Próprio (obrigatório) — Sois verdadeiramente santo, porque sois Deus, único e vivo e verdadeiro... Antes de todos os séculos e para sempre vivendo em luz inacessível... Por isso diante de vós estão inúmeros anjos e santos que servem ao vosso querer... Sois digno de louvor, ó Deus...", e: "We give you praise, Father most holy, for you are great and you have fashioned all your works in wisdom and in love. You formed man in your own image and entrusted the whole world to his care... And you so loved the world, Father most holy, that in the fullness of time you sent your Only Begotten Son to be our Savior... he sent the Holy Spirit from you, Father, as the first fruits for those who believe..." },
      { sp: "P", r: "Epiclese — Vos pedimos, portanto, Pai, que santificais esta oferta pelo mesmo Espírito que santificou o Senhor Jesus. Dignai-vos dar-nos, ao participarmos do Corpo e Sangue de vosso Filho, o Espírito Santo que congrega em um só corpo os que participam do único pão e do único cálice.", e: "Therefore, O Lord, we pray: may this same Holy Spirit graciously sanctify these offerings, that they may become the Body and Blood of our Lord Jesus Christ for the celebration of this great mystery, which he himself left us as an eternal covenant." },
      { sp: "P", r: "CONSAGRAÇÃO DO PÃO\nEle sempre amou os seus que estavam no mundo e, ao chegar a sua hora, manifestou até o fim o seu amor; enquanto jantava com os seus discípulos, tomou o pão, deu graças, partiu-o e deu-o a seus discípulos dizendo:\n\nTomai e comei todos vós,\npois ISTO É O MEU CORPO\nQUE SERÁ ENTREGUE POR VÓS.", e: "CONSECRATION OF THE BREAD\nFor when the hour had come for him to be glorified by you, Father most holy, having loved his own who were in the world, he loved them to the end: and while they were at supper, he took bread, blessed and broke it, and gave it to his disciples, saying:\n\nTake this, all of you, and eat of it,\nfor THIS IS MY BODY,\nWHICH WILL BE GIVEN UP FOR YOU." },
      { sp: "P", r: "CONSAGRAÇÃO DO CÁLICE\nDa mesma forma, tomando o cálice cheio do fruto da videira, deu graças e deu-o a seus discípulos dizendo:\n\nTomai e bebei todos vós,\npois ESTE É O CÁLICE DO MEU SANGUE,\nO SANGUE DA NOVA E ETERNA ALIANÇA,\nQUE SERÁ DERRAMADO POR VÓS E POR TODOS\nPARA REMISSÃO DOS PECADOS.\nFAZEI ISTO EM MEMÓRIA DE MIM.", e: "CONSECRATION OF THE CHALICE\nIn a similar way, taking the chalice filled with the fruit of the vine, he gave thanks, and gave the chalice to his disciples, saying:\n\nTake this, all of you, and drink from it,\nfor THIS IS THE CHALICE OF MY BLOOD,\nTHE BLOOD OF THE NEW AND ETERNAL COVENANT,\nWHICH WILL BE POURED OUT FOR YOU AND FOR MANY\nFOR THE FORGIVENESS OF SINS.\nDO THIS IN MEMORY OF ME." },
      { sp: "P", r: "Mysterium fidei.", e: "The mystery of faith." },
      { sp: "P", r: "Anamnese e oblação — Celebrando agora o memorial da nossa redenção, memoriosos da morte de Cristo e do descimento ao inferno, proclamando a sua ressurreição e ascensão à vossa direita, aguardando o seu dia glorioso de vinda, vos oferecemos o seu Corpo e o seu Sangue, o sacrifício agradável que santifica tudo. Dignai-vos lançar o olhar sobre a oblação da vossa Igreja e, reconhecendo a Vítima que morreu para nos reconciliar convosco, concedei que seja reunido pelo Espírito Santo, num único corpo, todos os que participam do mesmo pão e do mesmo cálice...", e: "Therefore, O Lord, as we now celebrate the memorial of our redemption, we remember Christ's Death and his descent to the realm of the dead, we proclaim his Resurrection and his Ascension to your right hand, and, as we await his coming in glory, we offer you his Body and Blood, the sacrifice acceptable to you which brings salvation to the whole world. Look, O Lord, upon the Sacrifice which you yourself have provided for your Church, and grant in your loving kindness to all who partake of this one Bread and one Chalice that, gathered into one body by the Holy Spirit, they may truly become a living sacrifice in Christ to the praise of your glory." },
      { sp: "P", r: "Por Cristo, com Cristo e em Cristo,\na vós, Deus Pai todo-poderoso,\nna unidade do Espírito Santo,\ntoda a honra e toda a glória,\nagora e para sempre.", e: "Through him, and with him, and in him,\nO God, almighty Father,\nin the unity of the Holy Spirit,\nall glory and honour is yours,\nfor ever and ever." },
      { sp: "A", r: "Améem.", e: "Amen." },
    ]
  }
};

// ─── COMPONENTS ───────────────────────────────────────────────────────────────
function Rubric({ short, long }) {
  const [open, setOpen] = useState(false);
  const hasLong = long && long.length > 0;
  return (
    <div style={{ margin: "3px 0 8px" }}>
      <button onClick={() => hasLong && setOpen(o => !o)} style={{ background: "none", border: "none", cursor: hasLong ? "pointer" : "default", padding: 0, display: "flex", alignItems: "flex-start", gap: "5px", textAlign: "left" }}>
        <span style={{ color: "#6a4e1a", fontSize: "11px", marginTop: "1px", flexShrink: 0 }}>{hasLong ? (open ? "▾" : "▸") : "✦"}</span>
        <span style={{ color: "#8a6a3a", fontSize: "11px", fontStyle: "italic", fontFamily: "'Crimson Text', serif", lineHeight: "1.5" }}>{short}</span>
      </button>
      {open && <p style={{ color: "#7a5a2a", fontSize: "11px", fontStyle: "italic", margin: "5px 0 0 14px", fontFamily: "'Crimson Text', serif", lineHeight: "1.6", background: "rgba(212,175,55,0.04)", borderLeft: "2px solid rgba(212,175,55,0.2)", paddingLeft: "10px", borderRadius: "0 4px 4px 0" }}>{long}</p>}
    </div>
  );
}

function Line({ speaker, speakerEn, native, english, bilingual, accent }) {
  const sc = s => {
    if (!s) return "#9b8c6e";
    const low = (s || "").toLowerCase();
    if (low.includes("padre") || low.includes("sacerdote") || low === "p") return accent || "#D4AF37";
    if (low.includes("povo") || low.includes("pueblo") || low.includes("todos") || low === "a") return "#6db86d";
    if (low.includes("leitor") || low.includes("lector") || low.includes("ministro") || low.includes("diácono")) return "#7db3d8";
    return "#c9b99a";
  };
  return (
    <div style={{ marginBottom: "10px" }}>
      {speaker && <span style={{ fontFamily: "'Cinzel', serif", fontSize: "8px", letterSpacing: "1px", color: sc(speaker), display: "block", marginBottom: "3px", fontWeight: 600 }}>{speaker.toUpperCase()}{bilingual && speakerEn ? ` / ${speakerEn.toUpperCase()}` : ""}</span>}
      {bilingual && english ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <p style={{ color: "#d4c9b0", fontSize: "13px", lineHeight: "1.75", margin: 0, whiteSpace: "pre-wrap", fontFamily: "'Crimson Text', serif", paddingRight: "10px", borderRight: "1px solid rgba(255,255,255,0.06)" }}>{native}</p>
          <p style={{ color: "#7a9e7a", fontSize: "13px", lineHeight: "1.75", margin: 0, whiteSpace: "pre-wrap", fontFamily: "'Crimson Text', serif", fontStyle: "italic" }}>{english}</p>
        </div>
      ) : (
        <p style={{ color: "#d4c9b0", fontSize: "13px", lineHeight: "1.75", margin: 0, whiteSpace: "pre-wrap", fontFamily: "'Crimson Text', serif" }}>{native}</p>
      )}
    </div>
  );
}

function VariantBlock({ variants, bilingual, accent }) {
  const [sel, setSel] = useState(0);
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "12px" }}>
        {variants.map((v, i) => (
          <button key={i} onClick={() => setSel(i)} style={{ background: sel === i ? `${accent}22` : "rgba(255,255,255,0.03)", border: `1px solid ${sel === i ? accent : "rgba(255,255,255,0.08)"}`, borderRadius: "5px", padding: "4px 9px", cursor: "pointer", transition: "all 0.2s" }}>
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: "8px", color: sel === i ? accent : "#6a5a3a", letterSpacing: "0.8px", display: "block" }}>{v.label}</span>
            {v.labelEn && <span style={{ fontFamily: "'Crimson Text', serif", fontSize: "9px", color: "#4a3a20", fontStyle: "italic", display: "block" }}>{v.labelEn}</span>}
          </button>
        ))}
      </div>
      {variants[sel].lines.map((ln, i) => <Line key={i} {...ln} bilingual={bilingual} accent={accent} />)}
    </div>
  );
}

function EPBlock({ lang, bilingual, accent }) {
  const keys = ["I", "II", "III", "IV"];
  const [sel, setSel] = useState("III");
  const ep = EP[sel];
  const isPT = lang === "pt";
  return (
    <div>
      <Rubric short={ep.rubric.short} long={ep.rubric.long} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "14px" }}>
        {keys.map(k => (
          <button key={k} onClick={() => setSel(k)} style={{ background: sel === k ? `${accent}22` : "rgba(255,255,255,0.03)", border: `1px solid ${sel === k ? accent : "rgba(255,255,255,0.08)"}`, borderRadius: "5px", padding: "4px 9px", cursor: "pointer", transition: "all 0.2s" }}>
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: "8px", color: sel === k ? accent : "#6a5a3a", letterSpacing: "0.8px", display: "block" }}>{EP[k].label}</span>
            <span style={{ fontFamily: "'Crimson Text', serif", fontSize: "9px", color: "#4a3a20", fontStyle: "italic", display: "block" }}>{EP[k].labelEn}</span>
          </button>
        ))}
      </div>
      {ep.lines.map((ln, i) => (
        <Line key={i}
          speaker={ln.sp === "P" ? (isPT ? "Padre" : "Sacerdote") : (isPT ? "Todos" : "Todos")}
          speakerEn={ln.sp === "P" ? "Priest" : "All"}
          native={ln.r} english={ln.e}
          bilingual={bilingual} accent={accent}
        />
      ))}
    </div>
  );
}


function SeasonBanner({ li, lang }) {
  return (
    <div style={{ background: `linear-gradient(90deg,${li.accent}15 0%,transparent 100%)`, border: `1px solid ${li.accent}30`, borderRadius: "8px", padding: "10px 16px", marginBottom: "16px", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
      <div>
        <p style={{ fontFamily: "'Cinzel', serif", color: li.accent, fontSize: "10px", letterSpacing: "2px", margin: 0 }}>{li.seasonName.toUpperCase()}</p>
        {li.specialDay && <p style={{ color: "#d4c9b0", fontFamily: "'Crimson Text', serif", fontSize: "12px", margin: "2px 0 0", fontStyle: "italic" }}>{li.specialDay}</p>}
        {li.weekNumber && <p style={{ color: "#7a6a4e", fontFamily: "'Crimson Text', serif", fontSize: "11px", margin: "1px 0 0" }}>{lang === "pt" ? `${li.weekNumber}ª Semana` : `Semana ${li.weekNumber}`}</p>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "auto" }}>
        <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: li.vestment.hex, border: "1px solid rgba(255,255,255,0.15)", boxShadow: `0 0 6px ${li.vestment.hex}60` }} />
        <span style={{ color: "#6a5a3a", fontFamily: "'Cinzel', serif", fontSize: "8px", letterSpacing: "1px" }}>VESTMENTS: {li.vestment.label.toUpperCase()}</span>
      </div>
    </div>
  );
}

// ─── MASS DATA ────────────────────────────────────────────────────────────────
function getMassData(lang, li) {
  const isPT = lang === "pt";
  const P = isPT ? "Padre" : "Sacerdote", Pe = "Priest";
  const All = "Todos", AllE = "All";
  const Le = isPT ? "Leitor" : "Lector", LeE = "Lector";
  const Mi = isPT ? "Ministro" : "Ministro", MiE = "Minister";
  const Co = isPT ? "Comunheiro" : "Comulgante", CoE = "Communicant";
  const Di = isPT ? "Diácono / Padre" : "Diácono / Sacerdote", DiE = "Deacon / Priest";
  const l = (n, e, sp, spe) => ({ native: n, english: e, speaker: sp, speakerEn: spe });
  const ppl = (n, e) => l(n, e, isPT ? "Povo" : "Pueblo", "People");
  const pri = (n, e) => l(n, e, P, Pe);
  const all = (n, e) => l(n, e, All, AllE);
  const lec = (n, e) => l(n, e, Le, LeE);
  const AMEN = isPT ? "Améem." : "Amén.", AMEN_E = "Amen.";

  return [
    {
      title: isPT ? "RITOS INICIAIS" : "RITOS INICIALES", titleEn: "INTRODUCTORY RITES", col: "#5b8db8",
      items: [
        { h: isPT ? "Canto de Entrada" : "Canto de Entrada", hE: "Entrance Chant", rubrics: [{ short: "Stand as priest and ministers process.", long: "If incense is used, the altar is incensed first. The priest venerates the altar with a kiss. On solemn feasts he may also incense the cross and people." }], note: isPT ? "Antífona ou canto aprovado." : "Antífona o canto aprobado.", noteE: "Proper antiphon or approved hymn.", lines: [] },
        { h: isPT ? "Saudação" : "Saludo", hE: "Greeting", rubrics: [{ short: "Priest makes Sign of the Cross. All respond, standing.", long: "Three greeting formulas exist; the priest chooses. This is not a personal greeting — it is Christ greeting his assembled Church through the ordained minister." }], lines: [pri(isPT ? "Em nome do Pai, do Filho e do Espírito Santo." : "En el nombre del Padre, y del Hijo, y del Espíritu Santo.", "In the name of the Father, and of the Son, and of the Holy Spirit."), ppl(AMEN, AMEN_E), pri(isPT ? "A graça e a paz de nosso Senhor Jesus Cristo, o amor do Pai e a comunhão do Espírito Santo estejam convosco." : "La gracia de nuestro Señor Jesucristo, el amor del Padre y la comunión del Espíritu Santo estén con todos vosotros.", "The grace of our Lord Jesus Christ, and the love of God, and the communion of the Holy Spirit be with you all."), ppl(isPT ? "Bendito seja Deus que nos reuniu no amor de Cristo." : "Y con tu espíritu.", "And with your spirit.")] },
        {
          h: isPT ? "Ato Penitencial — Opção do Sacerdote" : "Acto Penitencial — Opción del Sacerdote", hE: "Penitential Act — Priest's Choice", isVariant: true,
          rubrics: [{ short: "Listen: Form A starts 'I confess', Form B is a brief dialogue, Form C uses Kyrie with tropes.", long: "None replaces sacramental Confession. All three are a communal acknowledgment of sinfulness before the sacred mysteries." }],
          variants: [
            { label: isPT ? "Forma A — Confiteor" : "Forma A — Yo Confieso", labelEn: "Form A — Confiteor", lines: [pri(isPT ? "Irmãos, reconheçamos os nossos pecados para celebrarmos dignamente estes santos mistérios." : "Hermanos, reconozcamos nuestros pecados para celebrar dignamente estos sagrados misterios.", "Brethren, let us acknowledge our sins, and so prepare ourselves to celebrate the sacred mysteries."), all(isPT ? "Confesso a Deus Todo-Poderoso e a vós, irmãos, que pequei muitas vezes por pensamentos e palavras, atos e omissões, por minha culpa, minha tão grande culpa. E peço à Virgem Maria, aos Anjos, aos Santos e a vós, irmãos, que intercedais por mim a Deus, nosso Senhor." : "Yo confieso ante Dios todopoderoso y ante vosotros, hermanos, que he pecado mucho de pensamiento, palabra, obra y omisión. Por mi culpa, por mi culpa, por mi gran culpa. Por eso ruego a Santa María, siempre Virgen, a los ángeles, a los santos y a vosotros, hermanos, que intercedáis por mí ante Dios, nuestro Señor.", "I confess to almighty God and to you, my brothers and sisters, that I have greatly sinned in my thoughts and in my words, in what I have done and in what I have failed to do, through my fault, through my fault, through my most grievous fault; therefore I ask blessed Mary ever-Virgin, all the Angels and Saints, and you, my brothers and sisters, to pray for me to the Lord our God."), pri(isPT ? "Deus Todo-Poderoso tenha compaixão de nós, perdoe os nossos pecados e nos conduza à vida eterna." : "Dios todopoderoso tenga misericordia de nosotros, perdone nuestros pecados y nos lleve a la vida eterna.", "May almighty God have mercy on us, forgive us our sins, and bring us to everlasting life."), ppl(AMEN, AMEN_E)] },
            { label: isPT ? "Forma B — Diálogo de Misericórdia" : "Forma B — Diálogo de Misericordia", labelEn: "Form B — Mercy Dialogue", lines: [pri(isPT ? "Senhor Jesus, que viestes chamar os pecadores: tende piedade de nós." : "Señor, ten misericordia de nosotros.", "Lord, have mercy."), ppl(isPT ? "Senhor, tende piedade de nós." : "Porque hemos pecado contra ti.", "For we have sinned against you."), pri(isPT ? "Cristo, que viestes trazer o perdão: tende piedade de nós." : "Muéstranos, Señor, tu misericordia.", "Show us, O Lord, your mercy."), ppl(isPT ? "Cristo, tende piedade de nós." : "Y danos tu salvación.", "And grant us your salvation."), pri(isPT ? "Deus Todo-Poderoso tenha compaixão de nós, perdoe os nossos pecados e nos conduza à vida eterna." : "Dios todopoderoso tenga misericordia de nosotros, perdone nuestros pecados y nos lleve a la vida eterna.", "May almighty God have mercy on us, forgive us our sins, and bring us to everlasting life."), ppl(AMEN, AMEN_E)] },
            { label: isPT ? "Forma C — Kyrie com Tropas" : "Forma C — Kyrie con Tropos", labelEn: "Form C — Kyrie with Tropes", lines: [pri(isPT ? "Vós que fostes enviado para curar os contritos de coração: Senhor, tende piedade." : "Tú que has sido enviado a sanar los contritos de corazón: Señor, ten piedad.", "You were sent to heal the contrite of heart: Lord, have mercy."), ppl(isPT ? "Senhor, tende piedade." : "Señor, ten piedad.", "Lord, have mercy."), pri(isPT ? "Vós que viestes chamar os pecadores: Cristo, tende piedade." : "Tú que has venido a llamar a los pecadores: Cristo, ten piedad.", "You came to call sinners: Christ, have mercy."), ppl(isPT ? "Cristo, tende piedade." : "Cristo, ten piedad.", "Christ, have mercy."), pri(isPT ? "Vós que intercedeis por nós à direita do Pai: Senhor, tende piedade." : "Tú que intercedes por nosotros a la derecha del Padre: Señor, ten piedad.", "You intercede for us at the right hand of the Father: Lord, have mercy."), ppl(isPT ? "Senhor, tende piedade." : "Señor, ten piedad.", "Lord, have mercy.")] },
          ]
        },
        ...(li.hasGloria ? [{ h: isPT ? "Glória" : "Gloria", hE: "Gloria", rubrics: [{ short: "All sing or recite together. Omitted during Advent and Lent.", long: "The Gloria dates to the 4th century. On solemnities, bells may be rung. Its return after Advent/Lent silence amplifies its joy." }], lines: [all(isPT ? "Glória a Deus nas alturas,\ne paz na terra aos homens por ele amados.\nSenhor Deus, rei dos céus, Deus Pai todo-poderoso,\nnós vos louvamos, nós vos bendizemos, nós vos adoramos,\nnós vos glorificamos, nós vos damos graças por vossa imensa glória.\nSenhor Jesus Cristo, Filho Unigênito,\nSenhor Deus, Cordeiro de Deus, Filho do Pai,\nvós que tirais o pecado do mundo, tende piedade de nós;\nvós que tirais o pecado do mundo, acolhei a nossa súplica;\nvós que estais à direita do Pai, tende piedade de nós.\nPorque só vós sois o Santo, só vós, o Senhor,\nsó vós, o Altíssimo, Jesus Cristo,\ncom o Espírito Santo na glória de Deus Pai. Améem." : "Gloria a Dios en el cielo,\ny en la tierra paz a los hombres que ama el Señor.\nPor tu inmensa gloria te alabamos, te bendecimos, te adoramos,\nte glorificamos, te damos gracias,\nSeñor Dios, Rey celestial, Dios Padre todopoderoso.\nSeñor, Hijo único, Jesucristo,\nSeñor Dios, Cordero de Dios, Hijo del Padre:\ntú que quitas el pecado del mundo, ten piedad de nosotros;\ntú que quitas el pecado del mundo, atiende nuestra súplica;\ntú que estás sentado a la derecha del Padre, ten piedad de nosotros;\nporque sólo tú eres Santo, sólo tú Señor,\nsólo tú Altísimo, Jesucristo,\ncon el Espíritu Santo en la gloria de Dios Padre. Amén.", "Glory to God in the highest,\nand on earth peace to people of good will.\nWe praise you, we bless you, we adore you, we glorify you,\nwe give you thanks for your great glory,\nLord God, heavenly King, O God, almighty Father.\nLord Jesus Christ, Only Begotten Son,\nLord God, Lamb of God, Son of the Father,\nyou take away the sins of the world, have mercy on us;\nyou take away the sins of the world, receive our prayer;\nyou are seated at the right hand of the Father, have mercy on us.\nFor you alone are the Holy One, you alone are the Lord,\nyou alone are the Most High, Jesus Christ,\nwith the Holy Spirit, in the glory of God the Father. Amen.")] }] : [{ h: isPT ? "Glória — OMITIDO" : "Gloria — OMITIDA", hE: "Gloria — OMITTED", omitted: true, rubrics: [{ short: `Omitted during ${li.seasonName}. Returns at Easter Vigil or Christmas.`, long: "" }], lines: [] }]),
        { h: isPT ? "Oração Coleta" : "Oración Colecta", hE: "Collect — Proper to the Day", isProper: true, rubrics: [{ short: "Priest: 'Let us pray.' Silence. Then the Collect — proper text in Prayers panel above.", long: "The Collect 'collects' all silent prayers into one. Structure: address to God, relative clause recalling an attribute, the petition, conclusion. Changes every day." }], lines: [pri(isPT ? "Oremos.\n[silêncio]\n[ver Orações Próprias acima]\n...Por Cristo, nosso Senhor." : "Oremos.\n[silencio]\n[ver Oraciones Propias arriba]\n...Por Cristo, nuestro Señor.", "Let us pray.\n[silence]\n[see Proper Prayers above]\n...Through Christ our Lord."), ppl(AMEN, AMEN_E)] },
      ]
    },
    {
      title: isPT ? "LITURGIA DA PALAVRA" : "LITURGIA DE LA PALABRA", titleEn: "LITURGY OF THE WORD", col: "#9b7a3a",
      items: [
        { h: isPT ? "Primeira Leitura" : "Primera Lectura", hE: "First Reading", isReading: true, readingKey: "First Reading", rubrics: [{ short: "Sit. Old Testament or Acts (Easter Time). Silence follows.", long: "Chosen to thematically prepare for the Gospel. During Easter Time always from Acts of the Apostles. Brief silence after allows the Word to land." }], lines: [lec(isPT ? "Palavra do Senhor." : "Palabra de Dios.", "The Word of the Lord."), ppl(isPT ? "Graças a Deus." : "Te alabamos, Señor.", "Thanks be to God.")] },
        { h: isPT ? "Salmo Responsorial" : "Salmo Responsorial", hE: "Responsorial Psalm", isReading: true, readingKey: "Responsorial Psalm", rubrics: [{ short: "Cantor sings verses; assembly sings the refrain.", long: "Not a reading — a sung response to the First Reading. Sit and join the refrain." }], lines: [] },
        { h: isPT ? "Segunda Leitura" : "Segunda Lectura", hE: "Second Reading", isReading: true, readingKey: "Second Reading", note: isPT ? "Domingos e solenidades" : "Domingos y solemnidades", noteE: "Sundays and solemnities only", rubrics: [{ short: "From a New Testament letter or Revelation. Sundays only.", long: "Follows its own semi-continuous cycle, independent of the Gospel theme." }], lines: [lec(isPT ? "Palavra do Senhor." : "Palabra de Dios.", "The Word of the Lord."), ppl(isPT ? "Graças a Deus." : "Te alabamos, Señor.", "Thanks be to God.")] },
        { h: isPT ? "Aclamação ao Evangelho" : "Aclamación antes del Evangelio", hE: "Gospel Acclamation", isReading: true, readingKey: "Gospel Acclamation", rubrics: [{ short: "Stand. Alleluia (or Lenten acclamation) is sung as all rise.", long: "During Lent 'Alleluia' is never said or sung — replaced by a verse of praise. The verse is proper to the day." }], lines: [all(li.hasAlleluia ? "Aleluia!" : (isPT ? "Louvor e glória a vós, Senhor Jesus Cristo!" : "¡Honor y gloria a ti, Señor Jesús!"), li.hasAlleluia ? "Alleluia!" : "Praise to you, Lord Jesus Christ!")] },
        { h: isPT ? "Evangelho" : "Evangelio", hE: "Gospel", isReading: true, readingKey: "Gospel", rubrics: [{ short: "Remain standing. Small Sign of Cross on forehead, lips, and heart.", long: "Always proclaimed by priest or deacon. If a deacon is present, he ordinarily proclaims it. Incense and candles may be used. The small Sign of the Cross: 'May this Gospel be in my mind, on my lips, and in my heart.'" }], lines: [l(isPT ? "O Senhor esteja convosco." : "El Señor esté con vosotros.", "The Lord be with you.", Di, DiE), ppl(isPT ? "Ele está no meio de nós." : "Y con tu espíritu.", "And with your spirit."), l(isPT ? "Proclamação do Evangelho de Jesus Cristo segundo [nome]." : "Lectura del santo Evangelio según san [nombre].", "A reading from the holy Gospel according to [name].", Di, DiE), ppl(isPT ? "Glória a vós, Senhor." : "Gloria a ti, Señor.", "Glory to you, O Lord."), l(isPT ? "Palavra da Salvação." : "Palabra del Señor.", "The Gospel of the Lord.", Di, DiE), ppl(isPT ? "Glória a vós, Senhor." : "Gloria a ti, Señor Jesucristo.", "Praise to you, Lord Jesus Christ.")] },
        { h: isPT ? "Homilia" : "Homilía", hE: "Homily", rubrics: [{ short: "Sit. Priest or deacon preaches. Silence follows.", long: "Reserved to the ordained. Breaks open the Word for this specific assembly on this day. Silence after is part of the rite." }], lines: [] },
        {
          h: isPT ? "Credo — Opção do Sacerdote" : "Credo — Opción del Sacerdote", hE: "Creed — Priest's Choice", isVariant: true, note: isPT ? "Domingos e solenidades" : "Domingos y solemnidades", noteE: "Sundays and solemnities only",
          rubrics: [{ short: "Stand. Bow at the Incarnation. Genuflect on Christmas Day and the Annunciation.", long: "Nicene Creed is standard. Apostles' Creed may be substituted, especially at Masses with children." }],
          variants: [
            { label: isPT ? "Credo Niceno (padrão)" : "Credo Niceno (estándar)", labelEn: "Nicene Creed (standard)", lines: [all(isPT ? "Creio em um só Deus, Pai todo-poderoso,\ncriador do céu e da terra, de todas as coisas visíveis e invisíveis.\nCreio em um só Senhor, Jesus Cristo, Filho Unigênito de Deus,\nnascido do Pai antes de todos os séculos:\nDeus de Deus, Luz da Luz, Deus verdadeiro de Deus verdadeiro,\ngerado, não criado, consubstancial ao Pai.\nPor ele todas as coisas foram feitas.\nE por nós, homens, e para nossa salvação, desceu dos céus:\n[inclinar] e se encarnou pelo Espírito Santo,\nno seio da Virgem Maria, e se fez homem. [levantar]\nFoi crucificado por nós sob Pôncio Pilatos,\npadeceu e foi sepultado.\nRessuscitou ao terceiro dia, conforme as Escrituras,\nsubiu aos céus, está sentado à direita do Pai.\nE de novo há de vir, em glória, para julgar os vivos e os mortos;\ne o seu reino não terá fim.\nCreio no Espírito Santo, Senhor que dá a vida,\ne procede do Pai e do Filho;\ne com o Pai e o Filho é adorado e glorificado:\nele que falou pelos profetas.\nCreio na Igreja una, santa, católica e apostólica.\nProfesso um só batismo para remissão dos pecados.\nE espero a ressurreição dos mortos\ne a vida do mundo que há de vir. Améem." : "Creo en un solo Dios, Padre todopoderoso,\nCreador del cielo y de la tierra, de todo lo visible y lo invisible.\nCreo en un solo Señor, Jesucristo, Hijo único de Dios,\nnacido del Padre antes de todos los siglos:\nDios de Dios, Luz de Luz, Dios verdadero de Dios verdadero,\nengendrado, no creado, de la misma naturaleza del Padre.\nPor quien todo fue hecho.\nQue por nosotros, los hombres, y por nuestra salvación bajó del cielo,\n[inclinarse] y por obra del Espíritu Santo\nse encarnó de María, la Virgen, y se hizo hombre. [levantarse]\nY por nuestra causa fue crucificado en tiempos de Poncio Pilato,\npadeció y fue sepultado,\ny resucitó al tercer día, según las Escrituras,\ny subió al cielo, y está sentado a la derecha del Padre;\ny de nuevo vendrá con gloria para juzgar a vivos y muertos,\ny su reino no tendrá fin.\nCreo en el Espíritu Santo, Señor y dador de vida,\nque procede del Padre y del Hijo,\nque con el Padre y el Hijo recibe una misma adoración y gloria,\ny que habló por los profetas.\nCreo en la Iglesia, que es una, santa, católica y apostólica.\nConfieso que hay un solo bautismo para el perdón de los pecados.\nEspero la resurrección de los muertos\ny la vida del mundo futuro. Amén.", "I believe in one God, the Father almighty,\nmaker of heaven and earth, of all things visible and invisible.\nI believe in one Lord Jesus Christ, the Only Begotten Son of God,\nborn of the Father before all ages.\nGod from God, Light from Light, true God from true God,\nbegotten, not made, consubstantial with the Father;\nthrough him all things were made.\nFor us men and for our salvation he came down from heaven,\n[bow] and by the Holy Spirit was incarnate of the Virgin Mary,\nand became man. [rise]\nFor our sake he was crucified under Pontius Pilate,\nhe suffered death and was buried,\nand rose again on the third day in accordance with the Scriptures.\nHe ascended into heaven and is seated at the right hand of the Father.\nHe will come again in glory to judge the living and the dead\nand his kingdom will have no end.\nI believe in the Holy Spirit, the Lord, the giver of life,\nwho proceeds from the Father and the Son,\nwho with the Father and the Son is adored and glorified,\nwho has spoken through the prophets.\nI believe in one, holy, catholic and apostolic Church.\nI confess one Baptism for the forgiveness of sins\nand I look forward to the resurrection of the dead\nand the life of the world to come. Amen.")] },
            { label: isPT ? "Credo Apostólico (alternativo)" : "Credo Apostólico (alternativo)", labelEn: "Apostles' Creed (alternative)", lines: [all(isPT ? "Creio em Deus Pai todo-poderoso, criador do céu e da terra.\nE em Jesus Cristo, seu único Filho, nosso Senhor,\nque foi concebido pelo poder do Espírito Santo,\nnasceu da Virgem Maria, padeceu sob Pôncio Pilatos,\nfoi crucificado, morto e sepultado,\ndesceu à mansão dos mortos, ressuscitou ao terceiro dia,\nsubiu aos céus, está sentado à direita de Deus Pai todo-poderoso,\nd'onde há de vir a julgar os vivos e os mortos.\nCreio no Espírito Santo, na Santa Igreja Católica,\nna comunhão dos Santos, na remissão dos pecados,\nna ressurreição da carne, na vida eterna. Améem." : "Creo en Dios, Padre todopoderoso, Creador del cielo y de la tierra.\nCreo en Jesucristo, su único Hijo, nuestro Señor,\nque fue concebido por obra y gracia del Espíritu Santo,\nnació de Santa María Virgen, padeció bajo el poder de Poncio Pilato,\nfue crucificado, muerto y sepultado, descendió a los infiernos,\nal tercer día resucitó de entre los muertos, subió a los cielos\ny está sentado a la derecha de Dios, Padre todopoderoso.\nDesde allí ha de venir a juzgar a vivos y muertos.\nCreo en el Espíritu Santo, la santa Iglesia católica,\nla comunión de los santos, el perdón de los pecados,\nla resurrección de la carne y la vida eterna. Amén.", "I believe in God, the Father almighty, Creator of heaven and earth,\nand in Jesus Christ, his only Son, our Lord,\nwho was conceived by the Holy Spirit, born of the Virgin Mary,\nsuffered under Pontius Pilate, was crucified, died and was buried;\nhe descended into hell; on the third day he rose again from the dead;\nhe ascended into heaven, and is seated at the right hand of God the Father almighty;\nfrom there he will come to judge the living and the dead.\nI believe in the Holy Spirit, the holy catholic Church,\nthe communion of saints, the forgiveness of sins,\nthe resurrection of the body, and life everlasting. Amen.")] },
          ]
        },
        { h: isPT ? "Oração dos Fiéis" : "Oración de los Fieles", hE: "Prayer of the Faithful", rubrics: [{ short: "Remain standing. Lector leads intentions; assembly responds.", long: "Concludes the Liturgy of the Word. Intentions cover the Church, civil authorities, those in need, and the local community." }], lines: [lec(isPT ? "[Intenção]" : "[Intención]", "[Intention]"), ppl(isPT ? "Senhor, ouvi a nossa oração." : "Te rogamos, óyenos.", "Lord, hear our prayer.")] },
      ]
    },
    {
      title: isPT ? "LITURGIA EUCARÍSTICA" : "LITURGIA EUCARÍSTICA", titleEn: "LITURGY OF THE EUCHARIST", col: "#b84444",
      items: [
        { h: isPT ? "Apresentação das Oferendas" : "Presentación de las Ofrendas", hE: "Presentation of Offerings", rubrics: [{ short: "Sit. Bread and wine brought forward. Collection typically now.", long: "Bread and wine represent human labor offered to God before transformation. Priest prepares altar, may wash hands (purification). Incense may be used." }], lines: [pri(isPT ? "Bendito sejais, Senhor, Deus do universo, pelo pão que recebemos de vossa bondade, fruto da terra e do trabalho humano, e que vos apresentamos: ele se tornará para nós o pão da vida." : "Bendito seas, Señor, Dios del universo, por este pan, fruto de la tierra y del trabajo del hombre, que recibimos de tu generosidad y ahora te presentamos; él será para nosotros pan de vida.", "Blessed are you, Lord God of all creation, for through your goodness we have received the bread we offer you: fruit of the earth and work of human hands, it will become for us the bread of life."), ppl(isPT ? "Bendito seja Deus para sempre." : "Bendito seas por siempre, Señor.", "Blessed be God for ever."), pri(isPT ? "Bendito sejais, Senhor, Deus do universo, pelo vinho que recebemos de vossa bondade, fruto da videira e do trabalho humano: ele se tornará para nós o cálice da salvação." : "Bendito seas, Señor, Dios del universo, por este vino, fruto de la vid y del trabajo del hombre; él será para nosotros bebida de salvación.", "Blessed are you, Lord God of all creation, for through your goodness we have received the wine we offer you: fruit of the vine and work of human hands, it will become our spiritual drink."), ppl(isPT ? "Bendito seja Deus para sempre." : "Bendito seas por siempre, Señor.", "Blessed be God for ever."), pri(isPT ? "Orai, irmãos, para que este sacrifício, meu e vosso, seja agradável a Deus Pai todo-poderoso." : "Orad, hermanos, para que este sacrificio, mío y vuestro, sea agradable a Dios, Padre todopoderoso.", "Pray, brethren, that my sacrifice and yours may be acceptable to God, the almighty Father."), ppl(isPT ? "O Senhor receba de vossas mãos este sacrifício para louvor e glória do seu nome, para nosso bem e de toda a sua santa Igreja." : "El Señor reciba de tus manos este sacrificio, para alabanza y gloria de su nombre, para nuestro bien y el de toda su santa Iglesia.", "May the Lord accept the sacrifice at your hands for the praise and glory of his name, for our good and the good of all his holy Church.")] },
        { h: isPT ? "Oração sobre as Oblatas" : "Oración sobre las Ofrendas", hE: "Prayer over Offerings — Proper", isProper: true, rubrics: [{ short: "Proper to today. See Prayers panel above.", long: "Concludes the Offertory rite and transitions to the Eucharistic Prayer. Changes daily." }], lines: [pri(isPT ? "[ver Orações Próprias acima]\n...Por Cristo, nosso Senhor." : "[ver Oraciones Propias arriba]\n...Por Cristo, nuestro Señor.", "[see Proper Prayers above]\n...Through Christ our Lord."), ppl(AMEN, AMEN_E)] },
        { h: isPT ? "Prefácio" : "Prefacio", hE: "Preface Dialogue", rubrics: [{ short: "Stand. One of the most ancient exchanges in Christian worship.", long: "Sursum corda — 'Lift up your hearts' — appears in texts as early as Origen and Cyprian (c. 250 AD). The Preface varies by season or feast and always ends with the Sanctus." }], lines: [pri(isPT ? "O Senhor esteja convosco." : "El Señor esté con vosotros.", "The Lord be with you."), ppl(isPT ? "Ele está no meio de nós." : "Y con tu espíritu.", "And with your spirit."), pri(isPT ? "Corações ao alto." : "Levantemos el corazón.", "Lift up your hearts."), ppl(isPT ? "Nós os temos erguidos ao Senhor." : "Lo tenemos levantado hacia el Señor.", "We lift them up to the Lord."), pri(isPT ? "Demos graças ao Senhor nosso Deus." : "Demos gracias al Señor, nuestro Dios.", "Let us give thanks to the Lord our God."), ppl(isPT ? "É justo e necessário." : "Es justo y necesario.", "It is right and just.")] },
        { h: isPT ? "Santo (Sanctus)" : "Santo (Sanctus)", hE: "Holy, Holy, Holy", rubrics: [{ short: "All sing or recite. In the USA, kneel after the Sanctus until the Great Amen.", long: "The Sanctus merges Isaiah 6:3 (heavenly acclamation) with Matthew 21:9. After it, only the priest speaks — the assembly kneels in adoration." }], lines: [all(isPT ? "Santo, Santo, Santo é o Senhor Deus do universo.\nO céu e a terra proclamam a vossa glória.\nHosana nas alturas.\nBendito o que vem em nome do Senhor.\nHosana nas alturas." : "Santo, Santo, Santo es el Señor, Dios del universo.\nLlenos están el cielo y la tierra de tu gloria.\nHosanna en el cielo.\nBendito el que viene en nombre del Señor.\nHosanna en el cielo.", "Holy, Holy, Holy Lord God of hosts.\nHeaven and earth are full of your glory.\nHosanna in the highest.\nBlessed is he who comes in the name of the Lord.\nHosanna in the highest.")] },
        { h: isPT ? "Oração Eucarística — Opção do Sacerdote" : "Plegaria Eucarística — Opción del Sacerdote", hE: "Eucharistic Prayer — Priest's Choice", isEP: true, rubrics: [] },
        {
          h: isPT ? "Aclamação Memorial — Opção do Sacerdote" : "Aclamación Memorial — Opción del Sacerdote", hE: "Memorial Acclamation — Priest's Choice", isVariant: true,
          rubrics: [{ short: "Priest announces 'The mystery of faith'; assembly acclaims one of three options.", long: "The only moment in the Eucharistic Prayer where the assembly speaks. All three affirm the Paschal Mystery." }],
          variants: [
            { label: isPT ? "Opção A" : "Opción A", labelEn: "Option A", lines: [pri(isPT ? "Eis o mistério da fé." : "Éste es el sacramento de nuestra fe.", "The mystery of faith."), ppl(isPT ? "Anunciamos, Senhor, a vossa morte\ne proclamamos a vossa ressurreição.\nVinde, Senhor Jesus!" : "Anunciamos tu muerte,\nproclamamos tu resurrección.\n¡Ven, Señor Jesús!", "We proclaim your Death, O Lord,\nand profess your Resurrection\nuntil you come again.")] },
            { label: isPT ? "Opção B" : "Opción B", labelEn: "Option B", lines: [pri(isPT ? "Eis o mistério da fé." : "Éste es el sacramento de nuestra fe.", "The mystery of faith."), ppl(isPT ? "Todas as vezes que comemos deste pão\ne bebemos deste cálice,\nanunciamos, Senhor, a vossa morte,\nenquanto esperamos a vossa vinda." : "Cada vez que comemos de este pan\ny bebemos de este cáliz,\nanunciamos tu muerte, Señor,\nhasta que vuelvas.", "When we eat this Bread and drink this Cup,\nwe proclaim your Death, O Lord,\nuntil you come again.")] },
            { label: isPT ? "Opção C" : "Opción C", labelEn: "Option C", lines: [pri(isPT ? "Eis o mistério da fé." : "Éste es el sacramento de nuestra fe.", "The mystery of faith."), ppl(isPT ? "Salvador do mundo, salvai-nos,\nvós que nos libertastes\npela cruz e ressurreição." : "Señor Jesús, que has muerto por nosotros\ny resucitado con gloria,\nsálvanos ahora y en la hora de nuestra muerte.", "Save us, Savior of the world,\nfor by your Cross and Resurrection\nyou have set us free.")] },
          ]
        },
        { h: isPT ? "Doxologia Final e Grande Améem" : "Doxología Final y Gran Amén", hE: "Final Doxology and Great Amen", rubrics: [{ short: "Stand. The Great Amen — the assembly's most important response. Ideally sung.", long: "The Great Amen ratifies everything in the Eucharistic Prayer. It is the most significant response at Mass." }], lines: [pri(isPT ? "Por Cristo, com Cristo e em Cristo,\na vós, Deus Pai todo-poderoso,\nna unidade do Espírito Santo,\ntoda a honra e toda a glória,\nagora e para sempre." : "Por Cristo, con él y en él,\na ti, Dios Padre omnipotente,\nen la unidad del Espíritu Santo,\ntodo honor y toda gloria\npor los siglos de los siglos.", "Through him, and with him, and in him,\nO God, almighty Father,\nin the unity of the Holy Spirit,\nall glory and honour is yours,\nfor ever and ever."), ppl(AMEN, AMEN_E)] },
      ]
    },
    {
      title: isPT ? "RITO DA COMUNHÃO" : "RITO DE LA COMUNIÓN", titleEn: "COMMUNION RITE", col: "#7a5aaa",
      items: [
        { h: isPT ? "Pai-Nosso" : "Padre Nuestro", hE: "Lord's Prayer", rubrics: [{ short: "Stand. All pray together. Priest extends hands.", long: "The embolism ('Deliver us...') extends the final petition. The doxology ('For the kingdom...') is an ancient liturgical addition not in the Gospel text." }], lines: [all(isPT ? "Pai-nosso que estais no céu,\nsantificado seja o vosso nome,\nvenha a nós o vosso reino,\nseja feita a vossa vontade,\nassim na terra como no céu.\nO pão nosso de cada dia nos dai hoje,\nperdoai-nos as nossas ofensas,\nassim como nós perdoamos a quem nos tem ofendido,\ne não nos deixeis cair em tentação,\nmas livrai-nos do mal." : "Padre nuestro, que estás en el cielo,\nsantificado sea tu Nombre;\nvenga a nosotros tu reino;\nhágase tu voluntad en la tierra como en el cielo.\nDanos hoy nuestro pan de cada día;\nperdona nuestras ofensas,\ncomo también nosotros perdonamos a los que nos ofenden;\nno nos dejes caer en la tentación,\ny líbranos del mal.", "Our Father, who art in heaven,\nhallowed be thy name;\nthy kingdom come, thy will be done\non earth as it is in heaven.\nGive us this day our daily bread,\nand forgive us our trespasses,\nas we forgive those who trespass against us;\nand lead us not into temptation,\nbut deliver us from evil."), pri(isPT ? "Livrai-nos, Senhor, de todos os males...aguardamos a vinda gloriosa de nosso Salvador Jesus Cristo." : "Líbranos de todos los males...la venida gloriosa de nuestro Salvador Jesucristo.", "Deliver us, Lord, from every evil...as we await the blessed hope and the coming of our Savior, Jesus Christ."), ppl(isPT ? "Pois vosso é o reino, o poder e a glória, para sempre, Senhor." : "Tuyo es el reino, tuyo el poder y la gloria, por siempre, Señor.", "For the kingdom, the power and the glory are yours now and for ever.")] },
        { h: isPT ? "Rito da Paz" : "Rito de la Paz", hE: "Sign of Peace", rubrics: [{ short: "Exchange a brief sign of peace (handshake in USA).", long: "A liturgical act, not a social greeting. Keep it brief. The priest does not leave the altar area." }], lines: [pri(isPT ? "A paz do Senhor esteja sempre convosco." : "La paz del Señor esté siempre con vosotros.", "The peace of the Lord be with you always."), ppl(isPT ? "Ele está no meio de nós." : "Y con tu espíritu.", "And with your spirit."), pri(isPT ? "Dai um sinal de paz uns aos outros." : "Daos fraternalmente la paz.", "Let us offer each other the sign of peace.")] },
        { h: isPT ? "Cordeiro de Deus (Agnus Dei)" : "Cordero de Dios (Agnus Dei)", hE: "Lamb of God", rubrics: [{ short: "Priest breaks the Host. A fragment drops into the chalice (commingling).", long: "The commingling symbolizes the unity of Christ's Body and Blood. The Agnus Dei may be repeated as needed during the fraction rite." }], lines: [all(isPT ? "Cordeiro de Deus, que tirais o pecado do mundo, tende piedade de nós.\nCordeiro de Deus, que tirais o pecado do mundo, tende piedade de nós.\nCordeiro de Deus, que tirais o pecado do mundo, dai-nos a paz." : "Cordero de Dios, que quitas el pecado del mundo, ten piedad de nosotros.\nCordero de Dios, que quitas el pecado del mundo, ten piedad de nosotros.\nCordero de Dios, que quitas el pecado del mundo, danos la paz.", "Lamb of God, you take away the sins of the world, have mercy on us.\nLamb of God, you take away the sins of the world, have mercy on us.\nLamb of God, you take away the sins of the world, grant us peace.")] },
        { h: isPT ? "Convite à Comunhão" : "Invitación a la Comunión", hE: "Invitation to Communion", rubrics: [{ short: "Kneel (USA). Priest shows the Host; all respond. Bow before receiving.", long: "'Behold the Lamb of God' echoes John 1:29 and Rev 19:9. The response echoes the centurion (Matthew 8:8). Receiving on hand or tongue both permitted in USA." }], lines: [pri(isPT ? "Felizes os convidados para a ceia do Senhor. Eis o Cordeiro de Deus que tira o pecado do mundo." : "Éste es el Cordero de Dios, que quita el pecado del mundo. Dichosos los invitados a la cena del Señor.", "Behold the Lamb of God, behold him who takes away the sins of the world. Blessed are those called to the supper of the Lamb."), all(isPT ? "Senhor, não sou digno de que entreis em minha morada, mas dizei uma só palavra e serei salvo." : "Señor, no soy digno de que entres en mi casa, pero una palabra tuya bastará para sanarme.", "Lord, I am not worthy that you should enter under my roof, but only say the word and my soul shall be healed."), l(isPT ? "O Corpo de Cristo." : "El Cuerpo de Cristo.", "The Body of Christ.", Mi, MiE), l(AMEN, AMEN_E, Co, CoE)] },
        { h: isPT ? "Oração após a Comunhão" : "Oración después de la Comunión", hE: "Prayer after Communion — Proper", isProper: true, rubrics: [{ short: "Stand. Silence or song. Then the Postcommunion prayer — see Prayers panel above.", long: "Silence after Communion is integral. The Postcommunion asks that grace bear fruit in daily life. Changes daily." }], lines: [pri(isPT ? "Oremos.\n[silêncio]\n[ver Orações Próprias acima]\n...Por Cristo, nosso Senhor." : "Oremos.\n[silencio]\n[ver Oraciones Propias arriba]\n...Por Cristo, nuestro Señor.", "Let us pray.\n[silence]\n[see Proper Prayers above]\n...Through Christ our Lord."), ppl(AMEN, AMEN_E)] },
      ]
    },
    {
      title: isPT ? "RITO DE CONCLUSÃO" : "RITO DE CONCLUSIÓN", titleEn: "CONCLUDING RITES", col: "#4a8c6a",
      items: [
        {
          h: isPT ? "Bênção Final — Opção do Sacerdote" : "Bendición Final — Opción del Sacerdote", hE: "Final Blessing — Priest's Choice", isVariant: true,
          rubrics: [{ short: "Bow your head for the blessing.", long: "Simple blessing on ordinary Sundays. Solemn Blessing (three petitions, each followed by Amen) on feasts and solemnities." }],
          variants: [
            { label: isPT ? "Bênção Simples (padrão)" : "Bendición Simple (estándar)", labelEn: "Simple Blessing", lines: [pri(isPT ? "O Senhor esteja convosco." : "El Señor esté con vosotros.", "The Lord be with you."), ppl(isPT ? "Ele está no meio de nós." : "Y con tu espíritu.", "And with your spirit."), pri(isPT ? "Deus Todo-Poderoso vos abençoe: Pai, e Filho, e Espírito Santo." : "Os bendiga Dios todopoderoso, Padre, Hijo y Espíritu Santo.", "May almighty God bless you, the Father, and the Son, and the Holy Spirit."), ppl(AMEN, AMEN_E)] },
            { label: isPT ? "Bênção Solene (festas/solenidades)" : "Bendición Solemne (fiestas/solemnidades)", labelEn: "Solemn Blessing", lines: [pri(isPT ? "Inclinai a cabeça para receber a bênção de Deus." : "Inclinad la cabeza para recibir la bendición de Dios.", "Bow down for the blessing."), pri(isPT ? "[Primeira parte — própria da festa]" : "[Primera parte — propia de la fiesta]", "[First invocation — proper to the feast]"), ppl(AMEN, AMEN_E), pri(isPT ? "[Segunda parte]" : "[Segunda parte]", "[Second invocation]"), ppl(AMEN, AMEN_E), pri(isPT ? "E a bênção de Deus Todo-Poderoso, Pai, Filho e Espírito Santo, desça sobre vós e convosco permaneça sempre." : "Y a todos vosotros os bendiga Dios todopoderoso, Padre, Hijo y Espíritu Santo.", "And may almighty God bless all of you, the Father, and the Son, and the Holy Spirit."), ppl(AMEN, AMEN_E)] },
          ]
        },
        {
          h: isPT ? "Despedida — Opção do Sacerdote" : "Despedida — Opción del Sacerdote", hE: "Dismissal — Priest's Choice", isVariant: true,
          rubrics: [{ short: "The dismissal sends the assembly into the world. 'Missa' = 'mission.'", long: "The word 'Mass' derives from 'missa est.' The assembly's 'Thanks be to God' is an act of faith, not mere courtesy." }],
          variants: [
            { label: isPT ? "A Missa acabou, ide em paz" : "Podéis ir en paz", labelEn: "Go forth, the Mass is ended", lines: [pri(isPT ? "A Missa acabou, ide em paz." : "Podéis ir en paz.", "Go forth, the Mass is ended."), ppl(isPT ? "Graças a Deus." : "Demos gracias a Dios.", "Thanks be to God.")] },
            { label: isPT ? "Ide anunciar o Evangelho" : "Anunciad el Evangelio", labelEn: "Go and announce the Gospel", lines: [pri(isPT ? "Ide anunciar o Evangelho do Senhor." : "Anunciad el Evangelio del Señor.", "Go and announce the Gospel of the Lord."), ppl(isPT ? "Graças a Deus." : "Demos gracias a Dios.", "Thanks be to God.")] },
            { label: isPT ? "Ide, glorificando o Senhor" : "Id glorificando al Señor", labelEn: "Go in peace, glorifying the Lord", lines: [pri(isPT ? "Ide em paz, glorificando o Senhor com a vossa vida." : "Id en paz glorificando al Señor con vuestra vida.", "Go in peace, glorifying the Lord by your life."), ppl(isPT ? "Graças a Deus." : "Demos gracias a Dios.", "Thanks be to God.")] },
            { label: isPT ? "Pode ir, a Missa acabou" : "La Misa ha terminado", labelEn: "Go in peace", lines: [pri(isPT ? "Pode ir, a Missa acabou." : "La Misa ha terminado, id en paz.", "Go in peace."), ppl(isPT ? "Graças a Deus." : "Demos gracias a Dios.", "Thanks be to God.")] },
          ]
        },
      ]
    }
  ];
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function MassApp() {
  const [screen, setScreen] = useState("select");
  const [lang, setLang] = useState(null);
  const [bilingual, setBilingual] = useState(false);
  const [openSections, setOpenSections] = useState({});
  const [readings, setReadings] = useState(null);
  const [loadingReadings, setLoadingReadings] = useState(false);
  const [readingsError, setReadingsError] = useState(null);
  const [li, setLi] = useState(null);
  const [litCycle, setLitCycle] = useState(null);

  useEffect(() => {
    const today = new Date();
    setLi(getLiturgicalInfo(today));
    setLitCycle(getLiturgicalYear(today));
  }, []);

  const fetchReadingsD = useCallback(async (selectedLang) => {
    setLoadingReadings(true); setReadingsError(null);
    try {
      const readings = await fetchUniversalisReadings(selectedLang);
      setReadings(readings);
    } catch (e) {
      setReadingsError("Could not load readings. Check your connection and try again.");
    } finally {
      setLoadingReadings(false);
    }
  }, []);


  const enter = (code) => {
    setLang(code);
    const litInfo = li || getLiturgicalInfo(new Date());
    const secs = getMassData(code, litInfo);
    const d = {}; secs.forEach((_, i) => { d[i] = i === 0; });
    setOpenSections(d);
    fetchReadingsD(code);
    setScreen("mass");
  };

  const litInfo = li || getLiturgicalInfo(new Date());
  const accent = litInfo.accent;

  if (!li) return (
    <div style={{ background: "#0d0b07", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "28px", height: "28px", border: "2px solid #D4AF3730", borderTop: "2px solid #D4AF37", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ── SELECT ────────────────────────────────────────────────────────────────
  if (screen === "select") return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#0d0b07 0%,#1a1208 50%,#0f0e08 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", fontFamily: "'Crimson Text', serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet" />
      <div style={{ textAlign: "center", marginBottom: "36px" }}>
        <div style={{ fontSize: "40px", marginBottom: "14px", filter: `drop-shadow(0 0 12px ${accent}40)` }}>✝</div>
        <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: "clamp(18px,4vw,28px)", color: "#D4AF37", letterSpacing: "4px", margin: "0 0 8px", fontWeight: 400 }}>HOLY MASS</h1>
        <div style={{ width: "50px", height: "1px", background: `linear-gradient(90deg,transparent,${accent},transparent)`, margin: "0 auto 10px" }} />
        <p style={{ color: "#7a6a4e", fontSize: "13px", fontStyle: "italic", margin: "0 0 4px" }}>{litInfo.seasonName}{litInfo.specialDay ? ` — ${litInfo.specialDay}` : ""}</p>
        <p style={{ color: "#4a3e28", fontFamily: "'Cinzel', serif", fontSize: "10px", letterSpacing: "1px" }}>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
        {litCycle && <p style={{ color: "#3a3020", fontFamily: "'Cinzel', serif", fontSize: "9px", letterSpacing: "1px", marginTop: "4px" }}>LECTIONARY YEAR {litCycle.sundayCycle} · WEEKDAY CYCLE {litCycle.weekdayCycle}</p>}
      </div>
      <div style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.18)", borderRadius: "10px", padding: "14px 20px", marginBottom: "36px", display: "flex", alignItems: "center", gap: "14px", maxWidth: "360px", width: "100%" }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: "'Cinzel', serif", color: "#D4AF37", fontSize: "10px", letterSpacing: "1.5px", margin: "0 0 2px" }}>BILINGUAL SIDE-BY-SIDE</p>
          <p style={{ color: "#6a5a3a", fontFamily: "'Crimson Text', serif", fontSize: "11px", margin: 0, fontStyle: "italic" }}>Native language + English translation</p>
        </div>
        <button onClick={() => setBilingual(b => !b)} style={{ width: "40px", height: "22px", borderRadius: "11px", border: "none", cursor: "pointer", background: bilingual ? "#D4AF37" : "rgba(255,255,255,0.08)", position: "relative", transition: "background 0.3s", flexShrink: 0 }}>
          <div style={{ position: "absolute", top: "3px", left: bilingual ? "21px" : "3px", width: "16px", height: "16px", borderRadius: "50%", background: bilingual ? "#1a1208" : "#5a5040", transition: "left 0.3s" }} />
        </button>
      </div>
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", justifyContent: "center" }}>
        {[{ code: "pt", flag: "🇧🇷", label: "Português", sub: "Missa em Português" }, { code: "es", flag: "🇪🇸", label: "Español", sub: "Misa en Español" }].map(({ code, flag, label, sub }) => (
          <button key={code} onClick={() => enter(code)} style={{ background: "linear-gradient(135deg,rgba(212,175,55,0.06) 0%,rgba(212,175,55,0.02) 100%)", border: "1px solid rgba(212,175,55,0.22)", borderRadius: "12px", padding: "28px 40px", cursor: "pointer", transition: "all 0.3s", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}
            onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg,rgba(212,175,55,0.14) 0%,rgba(212,175,55,0.06) 100%)"; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 10px 28px ${accent}18`; }}
            onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg,rgba(212,175,55,0.06) 0%,rgba(212,175,55,0.02) 100%)"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
            <span style={{ fontSize: "44px", lineHeight: 1 }}>{flag}</span>
            <span style={{ fontFamily: "'Cinzel', serif", color: "#D4AF37", fontSize: "15px", letterSpacing: "2px" }}>{label}</span>
            <span style={{ color: "#6a5a3a", fontSize: "11px", fontStyle: "italic" }}>{sub}</span>
          </button>
        ))}
      </div>
    </div>
  );

  // ── MASS SCREEN ───────────────────────────────────────────────────────────
  const sections = getMassData(lang, litInfo);
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#0d0b07 0%,#1a1208 50%,#0f0e08 100%)", paddingBottom: "60px" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet" />
      <div style={{ background: "linear-gradient(180deg,rgba(212,175,55,0.08) 0%,transparent 100%)", borderBottom: "1px solid rgba(212,175,55,0.1)", padding: "14px 18px", position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "18px", filter: `drop-shadow(0 0 6px ${accent}50)` }}>✝</span>
          <div>
            <h1 style={{ fontFamily: "'Cinzel', serif", color: "#D4AF37", fontSize: "12px", letterSpacing: "2px", margin: 0, fontWeight: 400 }}>HOLY MASS</h1>
            <p style={{ color: "#6a5a3a", fontSize: "10px", margin: "1px 0 0", fontStyle: "italic", fontFamily: "'Crimson Text', serif" }}>{lang === "pt" ? "🇧🇷 Português" : "🇪🇸 Español"}{bilingual ? " · Bilingual" : ""} · {litInfo.seasonName}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <button onClick={() => setBilingual(b => !b)} style={{ background: bilingual ? `${accent}22` : "transparent", border: `1px solid ${bilingual ? accent : "rgba(212,175,55,0.18)"}`, borderRadius: "5px", color: bilingual ? accent : "#6a5a3a", padding: "4px 9px", cursor: "pointer", fontFamily: "'Cinzel', serif", fontSize: "8px", letterSpacing: "1px", transition: "all 0.2s" }}>
            {bilingual ? "⊞ BILINGUAL" : "⊟ BILINGUAL"}
          </button>
          <button onClick={() => { setScreen("select"); setReadings(null); }} style={{ background: "transparent", border: "1px solid rgba(212,175,55,0.18)", borderRadius: "5px", color: "#6a5a3a", padding: "4px 9px", cursor: "pointer", fontFamily: "'Cinzel', serif", fontSize: "8px", letterSpacing: "1px" }}>← LANG</button>
        </div>
      </div>

      <div style={{ maxWidth: "820px", margin: "0 auto", padding: "20px 14px 0" }}>
        <SeasonBanner li={litInfo} lang={lang} />

        {bilingual && (
          <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 1fr", gap: "10px", marginBottom: "6px", paddingLeft: "18px" }}>
            <span />
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: "8px", color: "#6a5a3a", letterSpacing: "1px" }}>{lang === "pt" ? "PORTUGUÊS" : "ESPAÑOL"}</span>
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: "8px", color: "#3a5a3a", letterSpacing: "1px" }}>ENGLISH</span>
          </div>
        )}

        {sections.map((sec, si) => (
          <div key={si} style={{ marginBottom: "8px" }}>
            <button onClick={() => setOpenSections(p => ({ ...p, [si]: !p[si] }))} style={{ width: "100%", background: openSections[si] ? `${sec.col}18` : "rgba(255,255,255,0.025)", border: `1px solid ${openSections[si] ? sec.col + "40" : "rgba(255,255,255,0.06)"}`, borderRadius: openSections[si] ? "8px 8px 0 0" : "8px", padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "all 0.2s" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                <span style={{ fontFamily: "'Cinzel', serif", color: sec.col, fontSize: "10px", letterSpacing: "2px", fontWeight: 600 }}>{sec.title}</span>
                {bilingual && <span style={{ fontFamily: "'Cinzel', serif", color: "#3a3020", fontSize: "8px", letterSpacing: "1px" }}>{sec.titleEn}</span>}
              </div>
              <span style={{ color: sec.col, fontSize: "12px", display: "inline-block", transform: openSections[si] ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
            </button>

            {openSections[si] && (
              <div style={{ background: "linear-gradient(135deg,#110e07 0%,#191308 100%)", border: `1px solid ${sec.col}18`, borderTop: "none", borderRadius: "0 0 8px 8px" }}>
                {sec.items.map((item, ii) => {
                  // Find matching reading from loaded data
                  const reading = item.isReading
                    ? readings?.find(r => r.label === item.readingKey)
                    : null;
                  // Skip Second Reading item if not present in today's readings
                  if (item.readingKey === "Second Reading" && !loadingReadings && readings && readings.length > 0 && !reading) return null;

                  return (
                  <div key={ii} style={{ padding: "16px 18px", borderBottom: ii < sec.items.length - 1 ? "1px solid rgba(255,255,255,0.035)" : "none" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                      {item.isVariant && <span style={{ background: `${accent}18`, border: `1px solid ${accent}35`, borderRadius: "3px", padding: "1px 5px", fontFamily: "'Cinzel', serif", fontSize: "7px", color: accent, letterSpacing: "0.8px" }}>OPTIONS</span>}
                      {item.isEP && <span style={{ background: `${accent}18`, border: `1px solid ${accent}35`, borderRadius: "3px", padding: "1px 5px", fontFamily: "'Cinzel', serif", fontSize: "7px", color: accent, letterSpacing: "0.8px" }}>OPTIONS</span>}
                      {item.isProper && <span style={{ background: "rgba(155,89,182,0.12)", border: "1px solid rgba(155,89,182,0.25)", borderRadius: "3px", padding: "1px 5px", fontFamily: "'Cinzel', serif", fontSize: "7px", color: "#9b59b6", letterSpacing: "0.8px" }}>PROPER</span>}
                      {item.omitted && <span style={{ background: "rgba(192,57,43,0.12)", border: "1px solid rgba(192,57,43,0.25)", borderRadius: "3px", padding: "1px 5px", fontFamily: "'Cinzel', serif", fontSize: "7px", color: "#c0392b", letterSpacing: "0.8px" }}>OMITTED</span>}
                      <h3 style={{ fontFamily: "'Cinzel', serif", color: "#b08020", fontSize: "10px", letterSpacing: "1px", margin: 0, fontWeight: 600 }}>{item.h}</h3>
                      {bilingual && item.hE && <span style={{ fontFamily: "'Cinzel', serif", color: "#3a3020", fontSize: "8px", letterSpacing: "0.8px" }}>/ {item.hE}</span>}
                      {item.note && <span style={{ color: "#4a3e28", fontSize: "10px", fontStyle: "italic", background: "rgba(212,175,55,0.05)", borderRadius: "3px", padding: "1px 6px", border: "1px solid rgba(212,175,55,0.08)", fontFamily: "'Crimson Text', serif" }}>{item.note}{bilingual && item.noteE ? ` / ${item.noteE}` : ""}</span>}
                    </div>
                    {item.rubrics?.map((r, ri) => <Rubric key={ri} short={r.short} long={r.long} />)}

                    {/* ── INLINE READING TEXT ── */}
                    {item.isReading && (
                      <div style={{ marginBottom: "10px" }}>
                        {loadingReadings && (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 0" }}>
                            <div style={{ width: "14px", height: "14px", border: "2px solid rgba(212,175,55,0.15)", borderTop: "2px solid #D4AF37", borderRadius: "50%", animation: "spin 1s linear infinite", flexShrink: 0 }} />
                            <span style={{ color: "#6a5a3a", fontFamily: "'Crimson Text', serif", fontSize: "11px", fontStyle: "italic" }}>Loading...</span>
                          </div>
                        )}
                        {readingsError && (
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                            <p style={{ color: "#c0392b", fontFamily: "'Crimson Text', serif", fontSize: "11px", margin: 0 }}>{readingsError}</p>
                            <button onClick={() => fetchReadingsD(lang)} style={{ background: "transparent", border: "1px solid rgba(192,57,43,0.4)", borderRadius: "4px", color: "#c0392b", padding: "3px 10px", cursor: "pointer", fontFamily: "'Cinzel', serif", fontSize: "8px", letterSpacing: "1px" }}>↺ RETRY</button>
                          </div>
                        )}
                        {reading && (
                          <div>
                            {reading.reference && (
                              <p style={{ color: "#9b8c6e", fontFamily: "'Crimson Text', serif", fontSize: "11px", fontStyle: "italic", margin: "0 0 8px" }}>{reading.reference}</p>
                            )}
                            {bilingual && reading.nativeText ? (
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <p style={{ color: "#d4c9b0", fontFamily: "'Crimson Text', serif", fontSize: "13px", lineHeight: "1.8", margin: 0, whiteSpace: "pre-wrap", paddingRight: "12px", borderRight: "1px solid rgba(255,255,255,0.05)" }}>{reading.nativeText}</p>
                                <p style={{ color: "#7a9e7a", fontFamily: "'Crimson Text', serif", fontSize: "13px", lineHeight: "1.8", margin: 0, whiteSpace: "pre-wrap", fontStyle: "italic" }}>{reading.text}</p>
                              </div>
                            ) : (
                              <p style={{ color: "#d4c9b0", fontFamily: "'Crimson Text', serif", fontSize: "13px", lineHeight: "1.8", margin: 0, whiteSpace: "pre-wrap" }}>{reading.nativeText || reading.text}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {item.isEP
                      ? <EPBlock lang={lang} bilingual={bilingual} accent={accent} />
                      : item.isVariant
                        ? <VariantBlock variants={item.variants} bilingual={bilingual} accent={accent} />
                        : item.lines?.map((ln, li2) => <Line key={li2} {...ln} bilingual={bilingual} accent={accent} />)
                    }
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
