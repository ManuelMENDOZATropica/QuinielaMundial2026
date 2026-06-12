const db = require('../backend/db/db');

const userMatchesText = `
México 1-0 Sudáfrica | Estadio Ciudad de México
Corea del Sur vs. Chequia | Estadio Guadalajara
Viernes 12 de junio (Hoy)
Canadá vs. Bosnia y Herzegovina | 13:00 hrs | Estadio Toronto
Estados Unidos vs. Paraguay | 19:00 hrs | Estadio Los Ángeles
Sábado 13 de junio
Catar vs. Suiza | 13:00 hrs | Estadio San Francisco
Brasil vs. Marruecos | 16:00 hrs | Estadio Nueva Jersey
Haití vs. Escocia | 19:00 hrs | Estadio Boston
Australia vs. Turquía | 22:00 hrs | Estadio Vancouver
Domingo 14 de junio
Alemania vs. Curazao | 11:00 hrs | Estadio Houston
Países Bajos vs. Japón | 14:00 hrs | Estadio Dallas
Costa de Marfil vs. Ecuador | 17:00 hrs | Estadio Filadelfia
Suecia vs. Túnez | 20:00 hrs | Estadio Monterrey
Lunes 15 de junio
España vs. Cabo Verde | 10:00 hrs | Estadio Atlanta
Bélgica vs. Egipto | 13:00 hrs | Estadio Seattle
Arabia Saudita vs. Uruguay | 16:00 hrs | Estadio Miami
Irán vs. Nueva Zelanda | 19:00 hrs | Estadio Los Ángeles
Martes 16 de junio
Francia vs. Senegal | 13:00 hrs | Estadio Nueva Jersey
Irak vs. Noruega | 16:00 hrs | Estadio Boston
Argentina vs. Argelia | 19:00 hrs | Estadio Kansas City
Austria vs. Jordania | 22:00 hrs | Estadio San Francisco
Miércoles 17 de junio
Portugal vs. RD Congo | 11:00 hrs | Estadio Houston
Inglaterra vs. Croacia | 14:00 hrs | Estadio Dallas
Ghana vs. Panamá | 17:00 hrs | Estadio Toronto
Colombia vs. Uzbekistán | 20:00 hrs | Estadio Ciudad de México
Jueves 18 de junio
Corea del Sur vs. Chequia | 13:00 hrs | Estadio Atlanta
Sudáfrica vs. México | 19:00 hrs | Estadio Guadalajara
Viernes 19 de junio
Estados Unidos vs. Australia | 13:00 hrs | Estadio Seattle
Escocia vs. Marruecos | 16:00 hrs | Estadio Boston
Brasil vs. Haití | 18:30 hrs | Estadio Filadelfia
Turquía vs. Paraguay | 21:00 hrs | Estadio San Francisco
Sábado 20 de junio
Países Bajos vs. Suecia | 11:00 hrs | Estadio Houston
Alemania vs. Costa de Marfil | 14:00 hrs | Estadio Toronto
Ecuador vs. Curazao | 18:00 hrs | Estadio Kansas City
Túnez vs. Japón | 22:00 hrs | Estadio Monterrey
Domingo 21 de junio
España vs. Arabia Saudita | 10:00 hrs | Estadio Atlanta
Bélgica vs. Irán | 13:00 hrs | Estadio Los Ángeles
Uruguay vs. Cabo Verde | 16:00 hrs | Estadio Miami
Nueva Zelanda vs. Egipto | 19:00 hrs | Estadio Vancouver
Lunes 22 de junio
Argentina vs. Austria | 11:00 hrs | Estadio Dallas
Francia vs. Irak | 15:00 hrs | Estadio Filadelfia
Noruega vs. Senegal | 18:00 hrs | Estadio Nueva Jersey
Jordania vs. Argelia | 21:00 hrs | Estadio San Francisco
Martes 23 de junio
Portugal vs. Ghana | 15:00 hrs | Estadio Boston
Panamá vs. RD Congo | 15:00 hrs | Estadio Toronto
Inglaterra vs. Uzbekistán | 18:00 hrs | Estadio Nueva Jersey
Colombia vs. Croacia | 18:00 hrs | Estadio Miami
Miércoles 24 de junio
Suiza vs. Canadá | 13:00 hrs | Estadio Vancouver
Bosnia y Herzegovina vs. Catar | 13:00 hrs | Estadio Seattle
Escocia vs. Brasil | 16:00 hrs | Estadio Miami
Marruecos vs. Haití | 16:00 hrs | Estadio Atlanta
México vs. Chequia | 19:00 hrs | Estadio Ciudad de México
Sudáfrica vs. Corea del Sur | 19:00 hrs | Estadio Guadalajara
Jueves 25 de junio
Curazao vs. Costa de Marfil | 14:00 hrs | Estadio Filadelfia
Ecuador vs. Alemania | 14:00 hrs | Estadio Nueva Jersey
Japón vs. Suecia | 17:00 hrs | Estadio Dallas
Túnez vs. Países Bajos | 17:00 hrs | Estadio Kansas City
Turquía vs. Estados Unidos | 20:00 hrs | Estadio Los Ángeles
Paraguay vs. Australia | 20:00 hrs | Estadio San Francisco
Viernes 26 de junio
Noruega vs. Francia | 13:00 hrs | Estadio Boston
Senegal vs. Irak | 13:00 hrs | Estadio Toronto
Cabo Verde vs. Arabia Saudita | 18:00 hrs | Estadio Houston
Uruguay vs. España | 18:00 hrs | Estadio Guadalajara
Egipto vs. Irán | 21:00 hrs | Estadio Seattle
Nueva Zelanda vs. Bélgica | 21:00 hrs | Estadio Vancouver
Sábado 27 de junio
Panamá vs. Inglaterra | 15:00 hrs | Estadio Nueva Jersey
Croacia vs. Ghana | 15:00 hrs | Estadio Filadelfia
Colombia vs. Portugal | 17:30 hrs | Estadio Miami
RD Congo vs. Uzbekistán | 17:30 hrs | Estadio Atlanta
Argelia vs. Austria | 20:00 hrs | Estadio Kansas City
Jordania vs. Argentina | 20:00 hrs | Estadio Dallas
`;

function mapTeamName(name) {
  name = name.replace(' y ', ' & ');
  name = name.replace(' y ', ' & '); // double replace just in case
  if (name === 'México') return 'Mexico';
  if (name === 'Sudáfrica') return 'South Africa';
  if (name === 'Corea del Sur') return 'South Korea';
  if (name === 'Chequia') return 'Czechia';
  if (name === 'Canadá') return 'Canada';
  if (name === 'Bosnia & Herzegovina') return 'Bosnia-Herzegovina';
  if (name === 'Estados Unidos') return 'USA';
  if (name === 'Catar') return 'Qatar';
  if (name === 'Suiza') return 'Switzerland';
  if (name === 'Brasil') return 'Brazil';
  if (name === 'Marruecos') return 'Morocco';
  if (name === 'Haití') return 'Haiti';
  if (name === 'Escocia') return 'Scotland';
  if (name === 'Turquía') return 'Turkiye';
  if (name === 'Alemania') return 'Germany';
  if (name === 'Curazao') return 'Curacao';
  if (name === 'Países Bajos') return 'Netherlands';
  if (name === 'Japón') return 'Japan';
  if (name === 'Costa de Marfil') return 'Ivory Coast';
  if (name === 'España') return 'Spain';
  if (name === 'Cabo Verde') return 'Cape Verde';
  if (name === 'Bélgica') return 'Belgium';
  if (name === 'Egipto') return 'Egypt';
  if (name === 'Arabia Saudita') return 'Saudi Arabia';
  if (name === 'Irán') return 'Iran';
  if (name === 'Nueva Zelanda') return 'New Zealand';
  if (name === 'Francia') return 'France';
  if (name === 'Senegal') return 'Senegal';
  if (name === 'Irak') return 'Iraq';
  if (name === 'Noruega') return 'Norway';
  if (name === 'Argentina') return 'Argentina';
  if (name === 'Argelia') return 'Algeria';
  if (name === 'Austria') return 'Austria';
  if (name === 'Jordania') return 'Jordan';
  if (name === 'Portugal') return 'Portugal';
  if (name === 'RD Congo') return 'DR Congo';
  if (name === 'Inglaterra') return 'England';
  if (name === 'Croacia') return 'Croatia';
  if (name === 'Ghana') return 'Ghana';
  if (name === 'Panamá') return 'Panama';
  if (name === 'Colombia') return 'Colombia';
  if (name === 'Uzbekistán') return 'Uzbekistan';
  if (name === 'Uruguay') return 'Uruguay';
  return name;
}

function parseUserMatches(text) {
  const lines = text.split('\n');
  let currentDay = '';
  const parsed = [];
  
  lines.forEach(line => {
    line = line.trim();
    if (!line) return;
    
    // Check if it's a date header
    if (line.includes('de junio') || line.includes('de julio') || line.startsWith('Viernes') || line.startsWith('Sábado') || line.startsWith('Domingo') || line.startsWith('Lunes') || line.startsWith('Martes') || line.startsWith('Miércoles') || line.startsWith('Jueves')) {
      // Clean up header
      currentDay = line.replace('(Hoy)', '').trim();
      return;
    }
    
    const parts = line.split('|').map(p => p.trim());
    if (parts.length < 2) return;
    
    const teamsPart = parts[0];
    let homeTeam = '';
    let awayTeam = '';
    let isFinished = false;
    let homeScore = null;
    let awayScore = null;
    
    if (teamsPart.includes(' vs. ')) {
      const teams = teamsPart.split(' vs. ').map(t => t.trim());
      homeTeam = mapTeamName(teams[0]);
      awayTeam = mapTeamName(teams[1]);
    } else if (teamsPart.includes(' vs ')) {
      const teams = teamsPart.split(' vs ').map(t => t.trim());
      homeTeam = mapTeamName(teams[0]);
      awayTeam = mapTeamName(teams[1]);
    } else {
      const match = teamsPart.match(/(.+?)\s+(\d+)-(\d+)\s+(.+)/);
      if (match) {
        homeTeam = mapTeamName(match[1].trim());
        homeScore = parseInt(match[2]);
        awayScore = parseInt(match[3]);
        awayTeam = mapTeamName(match[4].trim());
        isFinished = true;
      }
    }
    
    let timeStr = '18:00';
    if (parts.length >= 3) {
      timeStr = parts[1].replace('hrs', '').trim();
    } else if (parts.length === 2 && parts[1].includes('hrs')) {
      timeStr = parts[1].replace('hrs', '').trim();
    }
    
    parsed.push({
      dayText: currentDay,
      homeTeam,
      awayTeam,
      isFinished,
      homeScore,
      awayScore,
      timeStr,
      stadium: parts[parts.length - 1]
    });
  });
  
  return parsed;
}

const parsed = parseUserMatches(userMatchesText);
console.log('Parsed user matches:', parsed.length);

db.all('SELECT * FROM matches WHERE stage = \'group\' ORDER BY match_num', (err, dbMatches) => {
  const matchedDbIds = new Set();
  const unmatchedUser = [];

  parsed.forEach(um => {
    // Find matching DB game by teams
    const dbMatch = dbMatches.find(dm => {
      // Since it's round robin, each team plays each other once. Check both directions just in case home/away is swapped
      const matchesNormal = dm.home_team === um.homeTeam && dm.away_team === um.awayTeam;
      const matchesSwapped = dm.home_team === um.awayTeam && dm.away_team === um.homeTeam;
      return matchesNormal || matchesSwapped;
    });

    if (dbMatch) {
      matchedDbIds.add(dbMatch.id);
      // Check if details differ
      const dateParts = dbMatch.match_date.split(' ');
      const dbDate = dateParts[0];
      const dbTime = dateParts[1];
      
      // Check day mapping
      // User dayText is e.g. "Viernes 12 de junio"
      // Let's parse user date
      // We can map user dayText to a date string YYYY-MM-DD
      const months = { 'junio': '06', 'julio': '07' };
      const matchDay = um.dayText.match(/(\d+)\s+de\s+(junio|julio)/);
      let userDate = '';
      if (matchDay) {
        userDate = `2026-${months[matchDay[2]]}-${matchDay[1].padStart(2, '0')}`;
      } else if (um.homeTeam === 'Mexico' || um.homeTeam === 'South Korea') {
        userDate = '2026-06-11'; // Opening day
      }

      const timeMatches = dbTime === um.timeStr;
      const dateMatches = dbDate === userDate;
      const homeAwayMatches = dbMatch.home_team === um.homeTeam;

      if (!timeMatches || !dateMatches || !homeAwayMatches) {
        console.log(`Differing Match: DB Num ${dbMatch.match_num} (${dbMatch.home_team} vs ${dbMatch.away_team})`);
        if (!dateMatches) console.log(`  - Date: DB ${dbDate} vs User ${userDate}`);
        if (!timeMatches) console.log(`  - Time: DB ${dbTime} vs User ${um.timeStr}`);
        if (!homeAwayMatches) console.log(`  - Home/Away Swapped: DB is ${dbMatch.home_team} vs ${dbMatch.away_team}, User is ${um.homeTeam} vs ${um.awayTeam}`);
      }
    } else {
      unmatchedUser.push(um);
    }
  });

  const unmatchedDb = dbMatches.filter(dm => !matchedDbIds.has(dm.id));

  console.log('\nUnmatched User Matches (Count:', unmatchedUser.length, '):');
  unmatchedUser.forEach(um => console.log('  -', um.homeTeam, 'vs', um.awayTeam));

  console.log('\nUnmatched DB Matches (Count:', unmatchedDb.length, '):');
  unmatchedDb.forEach(dm => console.log('  -', dm.match_num, ':', dm.home_team, 'vs', dm.away_team));

  process.exit(0);
});
