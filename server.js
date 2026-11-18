const path = require('path');
const express = require('express');
const { init, getTracker, addPerson, toggleCompletion } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Friendly URL for the log activity page
app.get('/log', (req, res) => res.sendFile(path.join(__dirname, 'public', 'log.html')));
app.get('/wrapped', (req, res) => res.sendFile(path.join(__dirname, 'public', 'wrapped.html')));

// GET the full tracker: { habitName: { personName: ["YYYY-MM-DD", ...] } }
app.get('/api/tracker', async (req, res) => {
  try {
    res.json(await getTracker());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load tracker data.' });
  }
});

// POST { name } -> adds a person to every habit
app.post('/api/people', async (req, res) => {
  try {
    const tracker = await addPerson(req.body.name);
    res.json(tracker);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Something went wrong.' });
  }
});

// POST { habit, person, date } -> toggles that day's completion
app.post('/api/toggle', async (req, res) => {
  const { habit, person, date } = req.body;
  if (!habit || !person || !date) {
    return res.status(400).json({ error: 'habit, person, and date are all required.' });
  }
  try {
    const tracker = await toggleCompletion(habit, person, date);
    res.json(tracker);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Something went wrong.' });
  }
});

init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Team habit tracker running at http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize the database:', err);
    process.exit(1);
  });
