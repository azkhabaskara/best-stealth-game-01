// levels.js — the three museum wings of Shadow Gallery.
//
// Each level is a tile map (see map.js for the legend) plus the patrol
// routes of its guards and the positions of its security cameras.
// Waypoints are tile coordinates; a guard walks them in order, pauses
// briefly at each one, then loops. Cameras sit on a tile and sweep.

export const LEVELS = [
  {
    name: 'Sayap Galeri',
    levelNo: 1,
    subtitle: 'Malam pertama di museum',
    objective: 'Curi Star Sapphire, lalu keluar lewat pintu hijau.',
    map: [
      '################################',
      '#............................X.#',
      '#...........................a..#',
      '#..******......................#',
      '#..******..DDDDDDDD............#',
      '#..........DDDDDDDD............#',
      '#.,,,,.........................#',
      '#.,,,,.....DDDDDDDD............#',
      '#.,,,,.....DDDDDDDD.......v....#',
      '#.,,,,.........................#',
      '#.,,,,....o...........******...#',
      '#.,,,,...............DDDDDD....#',
      '#.,,,,...............DDDDDD....#',
      '#.,,,,...........v.............#',
      '#.,,,,......o..................#',
      '#..............................#',
      '#..............******..........#',
      '#..............******..........#',
      '#.E............................#',
      '################################',
    ],
    // Two guards on opposite loops around the central cases.
    patrols: [
      { waypoints: [[8, 3], [24, 3], [24, 10], [8, 10]], speed: 72 },
      { waypoints: [[8, 14], [8, 16], [24, 16], [24, 14]], speed: 72 },
    ],
    cameras: [],
  },
  {
    name: 'Aula Brankas',
    levelNo: 2,
    subtitle: 'Dua ruangan, satu lorong sempit',
    objective: 'Curi kedua artefak, awasi kamera lorong.',
    map: [
      '################################',
      '#............######..........X.#',
      '#............#..a.#............#',
      '#....DDDD....#....#............#',
      '#....DDDD....#....#....SSSS....#',
      '#............#....#............#',
      '#..******....#....#......o.....#',
      '#..******....##..##............#',
      '#............##..##..v.........#',
      '#..............................#',
      '#.....o........................#',
      '#............######............#',
      '#............######....DDDD....#',
      '#....SSSS....######....DDDD....#',
      '#............######............#',
      '#..,,,,,,....######............#',
      '#..,,,,,,....######....a.......#',
      '#..,,,,,,....######............#',
      '#.E..........######............#',
      '################################',
    ],
    // One guard crosses the corridor, one works the left room,
    // one works the main hall.
    patrols: [
      { waypoints: [[3, 9], [27, 9], [27, 10], [3, 10]], speed: 78 },
      { waypoints: [[10, 6], [10, 16], [4, 16], [4, 6]], speed: 72 },
      { waypoints: [[22, 3], [28, 3], [28, 16], [22, 16]], speed: 76 },
    ],
    // One camera watches the corridor ceiling.
    cameras: [
      { tx: 16, ty: 9, baseAngle: 0, sweep: 1.1, speed: 0.45 },
    ],
  },
  {
    name: 'Atrium Agung',
    levelNo: 3,
    subtitle: 'Kolam di tengah, mata di mana-mana',
    objective: 'Curi ketiga artefak dan keluar tanpa ketahuan.',
    map: [
      '################################',
      '#...............X..............#',
      '#.a.........................a..#',
      '#..............................#',
      '#....DDDD..........DDDD........#',
      '#....DDDD....******....DDDD....#',
      '#..........**********..........#',
      '#..........PPPPPPPPPP..........#',
      '#....SSSS..PPPPPPPPPP..SSSS....#',
      '#..........PPPPPPPPPP..........#',
      '#..o.......PPPPPPPPPP.......o..#',
      '#..........PPPPPPPPPP..........#',
      '#..........PPPPPPPPPP....DDDD..#',
      '#....DDDD..PPPPPPPPPP....DDDD..#',
      '#..,,,,,,..##########..,,,,,,..#',
      '#..,,,,,,..##########..,,,,,,..#',
      '#..........##########..........#',
      '#..........##########....a.....#',
      '#.E............................#',
      '################################',
    ],
    // Four guards: left arm, right arm, the exit approach, the lower left.
    patrols: [
      { waypoints: [[3, 6], [3, 16], [9, 16], [9, 6]], speed: 80 },
      { waypoints: [[29, 6], [29, 16], [22, 16], [22, 6]], speed: 80 },
      { waypoints: [[12, 2], [19, 2], [19, 3], [12, 3]], speed: 70 },
      { waypoints: [[3, 17], [9, 17], [9, 14], [3, 14]], speed: 74 },
    ],
    // Two cameras sweeping in opposite directions.
    cameras: [
      { tx: 16, ty: 4, baseAngle: Math.PI / 2, sweep: 1.0, speed: 0.5, phase: 0 },
      { tx: 6, ty: 12, baseAngle: -Math.PI / 2, sweep: 1.0, speed: 0.5, phase: Math.PI },
    ],
  },
];
