// =====================================================================
//  SITE SETTINGS — edit this file to customise the site. No other code
//  needs to change.
// =====================================================================
window.SITE_CONFIG = {

  // Name shown at the top-left of the navigation bar
  siteName: 'Team Habits',

  // ------------------------------------------------------------------
  //  NEWS TICKER (the scrolling bar under the navigation bar)
  // ------------------------------------------------------------------
  ticker: {
    // Scroll speed in pixels per second (higher = faster)
    pixelsPerSecond: 70,

    // Shown between headlines
    separator: '•',

    // Label on the left of the ticker. Set to '' to hide it.
    label: 'LATEST',

    // Headlines are built from the number of days since each person's
    // most recent activity (of ANY habit). Rules are checked top to
    // bottom and the FIRST rule that matches is used.
    //
    //   minDays / maxDays : inclusive range of "days since last activity"
    //                       (use maxDays: null for "no upper limit")
    //   habit             : (optional) only use this rule when the person's
    //                       most recent activity was this habit, e.g.
    //                       habit: 'Run'  or  habit: ['Gym', 'Run'] (either).
    //                       Leave it out to match any habit. Because the first
    //                       match wins, put habit-specific rules ABOVE the
    //                       general ones.
    //   tone              : colours the headline — 'good', 'neutral',
    //                       'warn' or 'alert'
    //   messages          : one or more templates. If you list several,
    //                       one is picked at random each page load.
    //
    // Placeholders you can use in a message:
    //   {name}    the person's name
    //   {days}    days since last activity (e.g. 3)
    //   {dayWord} "day" or "days" to match {days}
    //   {habit}   what they last did (e.g. Gym, or "Gym & Run")
    //   {date}    date of last activity (YYYY-MM-DD)
    rules: [
      // Habit-specific examples (these win over the general rules below)
      {
        habit: 'Run', minDays: 0, maxDays: 0, tone: 'good',
        messages: ['{name} hit the pavement today 🏃']
      },
      {
        habit: 'Gym', minDays: 0, maxDays: 0, tone: 'good',
        messages: ['{name} lifted today 💪']
      },

      // General rules (any habit)
      {
        minDays: 0, maxDays: 0, tone: 'good',
        messages: [
          '{name} got their {habit} done today 🔥',
          'Nice one! {name} was active today ({habit})'
        ]
      },
      {
        minDays: 1, maxDays: 1, tone: 'good',
        messages: ['{name} was last active yesterday ({habit})']
      },
      {
        minDays: 2, maxDays: 3, tone: 'neutral',
        messages: ['{name} last did {habit} {days} {dayWord} ago']
      },
      {
        minDays: 4, maxDays: 6, tone: 'warn',
        messages: [
          '{name} hasn\'t been active for {days} {dayWord} — time to get moving!',
          'Where has {name} been? Nothing logged for {days} {dayWord}'
        ]
      },
      {
        minDays: 7, maxDays: null, tone: 'alert',
        messages: [
          'BREAKING: {name} has gone {days} {dayWord} without any activity!',
          'ALERT: {days} {dayWord} since {name} last logged anything'
        ]
      }
    ],

    // Used for people who have never logged anything
    neverLoggedMessage: '{name} hasn\'t logged any activity yet',
    neverLoggedTone: 'neutral',

    // Shown when there are no people in the database at all
    emptyMessage: 'No activity to report yet — add someone on the Log activity page'
  },

  // ------------------------------------------------------------------
  //  WRAPPED PAGE (end-of-year summary)
  // ------------------------------------------------------------------
  wrapped: {
    // Banner shown at the very top of the page
    banner: 'There is still time!!!! (Wrapped ends December 31st)',

    // Which year to count. null = the current year.
    year: null,

    // How many people to show in the "most runs" / "most gym" charts
    topN: 5,

    // Which habit names count as "runs" and "gym sessions" (case-insensitive)
    runHabit: 'Run',
    gymHabit: 'Gym',
    mixedHabit: 'Mixed Active',
    

    // Emoji shown above the most active person's name
    crown: '👑'
  },

  // ------------------------------------------------------------------
  //  14-DAY CALENDAR
  // ------------------------------------------------------------------
  calendar: {
    // How many days to show (latest day is on the right)
    days: 14,

    // Box colour for each habit, keyed by habit name (case-insensitive)
    habitColors: {
      Run: '#f85149',            // red
      Gym: '#388bfd',            // blue
      'Mixed Active': '#FFEA00'  // yellow
    },

    // When more than one habit is logged on the same day, the box is a
    // BLEND (average) of those habits' colours automatically. If you'd
    // rather pick the colour for a specific combination yourself, list it
    // here. Habit names are joined with "+" and the order doesn't matter.
    combinationColors: {
      'Gym+Run': '#a371f7'       // purple (instead of the auto-blend)
      // 'Run+Mixed Active': '#ff9500',
      // 'Gym+Mixed Active': '#3fb950',
    },

    // If a person logs ALL of these habits on the same day, their box is
    // a rainbow instead of a blend. Set to [] to turn the rainbow off.
    rainbowHabits: ['Run', 'Gym', 'Mixed Active'],
    rainbowColors: ['#f85149', '#ff9500', '#FFEA00', '#3fb950', '#388bfd', '#a371f7'],

    // Colour for a habit that isn't listed in habitColors above
    defaultColor: '#39d353'
  }
};
