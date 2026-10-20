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
  //  14-DAY CALENDAR
  // ------------------------------------------------------------------
  calendar: {
    // How many days to show (latest day is on the right)
    days: 14,

    // Box colour for each habit, keyed by habit name (case-insensitive)
    habitColors: {
      Run: '#f85149',   // red
      Gym: '#388bfd'    // blue
    },

    // Box colour when MORE THAN ONE habit was logged on the same day
    bothColor: '#a371f7',   // purple

    // Colour for a habit that isn't listed in habitColors above
    defaultColor: '#39d353'
  }
};
