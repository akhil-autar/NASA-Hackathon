// The compact shape of a storm saved in src/data/storms.json by the
// build-time archive script. Kept small so the file loads fast on a phone.

export interface ArchivedStorm {
  /** DONKI flare id, e.g. "2017-09-06T11:53:00-FLR-001". */
  id: string;
  /** Flare peak time, ISO. */
  peakTime: string;
  /** Flare class letter. */
  flareClass: "M" | "X";
  /** The number after the letter, e.g. 9.3 for X9.3. */
  magnitude: number;
  /** DONKI link for this flare. */
  link: string;
  /**
   * Real gap in hours between the flare peak and its linked particle event,
   * when DONKI links one. This is the real warning time. Absent when there is
   * no linked SEP (the game then uses a labelled estimate).
   */
  warningHours?: number;
  /** Linked geomagnetic storm at Earth, when DONKI links one. */
  gst?: { kp: number };
}

export interface StormArchive {
  /** When this archive was built, ISO. */
  builtAt: string;
  /** Date range covered. */
  from: string;
  to: string;
  /** How the archive was made (for the data page). */
  source: string;
  storms: ArchivedStorm[];
}
