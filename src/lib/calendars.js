// src/lib/calendars.js
// Single place to map "Level 1", "Level 2", ... to the mega calendar URL.

export const LevelCalendars = {
	'Level 1': 'https://calendar.expatspanishlessons.com/live-classes/level-1',
	'Level 2': 'https://calendar.expatspanishlessons.com/live-classes/level-2',
	'Level 3': 'https://calendar.expatspanishlessons.com/live-classes/level-3',
	'Level 4': 'https://calendar.expatspanishlessons.com/live-classes/level-4',
	'Level 5': 'https://calendar.expatspanishlessons.com/live-classes/level-5',
	'Level 6': 'https://calendar.expatspanishlessons.com/live-classes/level-6'
  };
  
  /**
   * Normalize incoming level values and return the calendar link or null.
   * Accepts "Level 1", "level 1", "1", "Level-1", "Level1" for flexibility.
   */
  export function getCalendarLink(rawLevel) {
	if (!rawLevel) return null;
  
	// Normalize input to "Level X"
	const str = String(rawLevel).trim();
	const m = str.match(/(\d+)/); // capture a number
	if (!m) return null;
  
	const num = m[1];
	const key = `Level ${num}`;
  
	return LevelCalendars[key] ?? null;
  }
  