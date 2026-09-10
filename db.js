const { createClient } = require('@libsql/client');

// In production, set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN (see README).
// Locally, if those aren't set, this falls back to a plain SQLite file on
// disk so you can develop/test without a Turso account.
const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:./habit-tracker.local.db',
  authToken: process.env.TURSO_AUTH_TOKEN || undefined
});

async function init() {
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS people (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL COLLATE NOCASE
    );

    CREATE TABLE IF NOT EXISTS memberships (
      habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
      person_id INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
      PRIMARY KEY (habit_id, person_id)
    );

    CREATE TABLE IF NOT EXISTS completions (
      habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
      person_id INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      PRIMARY KEY (habit_id, person_id, date)
    );
  `);

  await seedIfEmpty();
}

// One-time seed: just a "Gym" habit with Alex as a member and no completions
// yet. Only runs the very first time (when the habits table is empty).
async function seedIfEmpty() {
  const result = await client.execute('SELECT COUNT(*) AS n FROM habits');
  const count = Number(result.rows[0].n);
  if (count > 0) return;

  const habitResult = await client.execute({
    sql: 'INSERT INTO habits (name) VALUES (?)',
    args: ['Gym']
  });
  const habitId = habitResult.lastInsertRowid;

  const personResult = await client.execute({
    sql: 'INSERT INTO people (name) VALUES (?)',
    args: ['Alex']
  });
  const personId = personResult.lastInsertRowid;

  await client.execute({
    sql: 'INSERT INTO memberships (habit_id, person_id) VALUES (?, ?)',
    args: [habitId, personId]
  });
  // No completions inserted — Alex starts with a clean slate.
}

// Returns { "Gym": { "Alex": ["2026-05-28", ...] }, ... }
async function getTracker() {
  const habits = (await client.execute('SELECT id, name FROM habits ORDER BY id')).rows;
  const tracker = {};

  for (const habit of habits) {
    tracker[habit.name] = {};

    const members = (await client.execute({
      sql: `
        SELECT p.id AS person_id, p.name AS person_name
        FROM memberships m
        JOIN people p ON p.id = m.person_id
        WHERE m.habit_id = ?
        ORDER BY p.id
      `,
      args: [habit.id]
    })).rows;

    for (const member of members) {
      const dates = (await client.execute({
        sql: 'SELECT date FROM completions WHERE habit_id = ? AND person_id = ? ORDER BY date',
        args: [habit.id, member.person_id]
      })).rows.map(r => r.date);
      tracker[habit.name][member.person_name] = dates;
    }
  }
  return tracker;
}

// Adds a person (if new) and enrolls them in every existing habit
async function addPerson(name) {
  const trimmed = String(name || '').trim();
  if (!trimmed) {
    const err = new Error('Name is required.');
    err.status = 400;
    throw err;
  }

  const existing = await client.execute({
    sql: 'SELECT id FROM people WHERE name = ?',
    args: [trimmed]
  });
  if (existing.rows.length > 0) {
    const err = new Error('That person is already on the tracker.');
    err.status = 409;
    throw err;
  }

  const habits = (await client.execute('SELECT id FROM habits')).rows;

  const personResult = await client.execute({
    sql: 'INSERT INTO people (name) VALUES (?)',
    args: [trimmed]
  });
  const personId = personResult.lastInsertRowid;

  for (const habit of habits) {
    await client.execute({
      sql: 'INSERT OR IGNORE INTO memberships (habit_id, person_id) VALUES (?, ?)',
      args: [habit.id, personId]
    });
  }

  return getTracker();
}

// Toggles a single day's completion for a person/habit. Returns the updated tracker.
async function toggleCompletion(habitName, personName, date) {
  const habitRow = await client.execute({
    sql: 'SELECT id FROM habits WHERE name = ?',
    args: [habitName]
  });
  const personRow = await client.execute({
    sql: 'SELECT id FROM people WHERE name = ?',
    args: [personName]
  });

  if (habitRow.rows.length === 0 || personRow.rows.length === 0) {
    const err = new Error('Unknown habit or person.');
    err.status = 404;
    throw err;
  }

  const habitId = habitRow.rows[0].id;
  const personId = personRow.rows[0].id;

  const existing = await client.execute({
    sql: 'SELECT 1 FROM completions WHERE habit_id = ? AND person_id = ? AND date = ?',
    args: [habitId, personId, date]
  });

  if (existing.rows.length > 0) {
    await client.execute({
      sql: 'DELETE FROM completions WHERE habit_id = ? AND person_id = ? AND date = ?',
      args: [habitId, personId, date]
    });
  } else {
    await client.execute({
      sql: 'INSERT OR IGNORE INTO memberships (habit_id, person_id) VALUES (?, ?)',
      args: [habitId, personId]
    });
    await client.execute({
      sql: 'INSERT OR IGNORE INTO completions (habit_id, person_id, date) VALUES (?, ?, ?)',
      args: [habitId, personId, date]
    });
  }

  return getTracker();
}

module.exports = { init, getTracker, addPerson, toggleCompletion };
