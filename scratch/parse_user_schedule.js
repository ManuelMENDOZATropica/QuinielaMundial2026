const fs = require('fs');

const userMatchesText = `
México 1-0 Sudáfrica | Estadio Ciudad de México  Corea del Sur vs. Chequia | Estadio GuadalajaraViernes 12 de junio (Hoy)Canadá vs. Bosnia y Herzegovina | 13:00 hrs | Estadio Toronto  Estados Unidos vs. Paraguay | 19:00 hrs | Estadio Los Ángeles  Sábado 13 de junioCatar vs. Suiza | 13:00 hrs | Estadio San Francisco  Brasil vs. Marruecos | 16:00 hrs | Estadio Nueva Jersey  Haití vs. Escocia | 19:00 hrs | Estadio Boston  Australia vs. Turquía | 22:00 hrs | Estadio Vancouver  Domingo 14 de junioAlemania vs. Curazao | 11:00 hrs | Estadio Houston  Países Bajos vs. Japón | 14:00 hrs | Estadio Dallas  Costa de Marfil vs. Ecuador | 17:00 hrs | Estadio Filadelfia  Suecia vs. Túnez | 20:00 hrs | Estadio Monterrey  Lunes 15 de junioEspaña vs. Cabo Verde | 10:00 hrs | Estadio Atlanta  Bélgica vs. Egipto | 13:00 hrs | Estadio Seattle  Arabia Saudita vs. Uruguay | 16:00 hrs | Estadio Miami  Irán vs. Nueva Zelanda | 19:00 hrs | Estadio Los Ángeles  Martes 16 de junioFrancia vs. Senegal | 13:00 hrs | Estadio Nueva Jersey  Irak vs. Noruega | 16:00 hrs | Estadio Boston  Argentina vs. Argelia | 19:00 hrs | Estadio Kansas City  Austria vs. Jordania | 22:00 hrs | Estadio San Francisco  Miércoles 17 de junioPortugal vs. RD Congo | 11:00 hrs | Estadio Houston  Inglaterra vs. Croacia | 14:00 hrs | Estadio Dallas  Ghana vs. Panamá | 17:00 hrs | Estadio Toronto  Colombia vs. Uzbekistán | 20:00 hrs | Estadio Ciudad de México  Jueves 18 de junioCorea del Sur vs. Chequia | 13:00 hrs | Estadio Atlanta  Sudáfrica vs. México | 19:00 hrs | Estadio Guadalajara  Viernes 19 de junioEstados Unidos vs. Australia | 13:00 hrs | Estadio Seattle  Escocia vs. Marruecos | 16:00 hrs | Estadio Boston  Brasil vs. Haití | 18:30 hrs | Estadio Filadelfia  Turquía vs. Paraguay | 21:00 hrs | Estadio San Francisco  Sábado 20 de junioPaíses Bajos vs. Suecia | 11:00 hrs | Estadio Houston  Alemania vs. Costa de Marfil | 14:00 hrs | Estadio Toronto  Ecuador vs. Curazao | 18:00 hrs | Estadio Kansas City  Túnez vs. Japón | 22:00 hrs | Estadio Monterrey  Domingo 21 de junioEspaña vs. Arabia Saudita | 10:00 hrs | Estadio Atlanta  Bélgica vs. Irán | 13:00 hrs | Estadio Los Ángeles  Uruguay vs. Cabo Verde | 16:00 hrs | Estadio Miami  Nueva Zelanda vs. Egipto | 19:00 hrs | Estadio Vancouver  Lunes 22 de junioArgentina vs. Austria | 11:00 hrs | Estadio Dallas  Francia vs. Irak | 15:00 hrs | Estadio Filadelfia  Noruega vs. Senegal | 18:00 hrs | Estadio Nueva Jersey  Jordania vs. Argelia | 21:00 hrs | Estadio San Francisco  Martes 23 de junioPortugal vs. Ghana | 15:00 hrs | Estadio BostonPanamá vs. RD Congo | 15:00 hrs | Estadio Toronto  Inglaterra vs. Uzbekistán | 18:00 hrs | Estadio Nueva JerseyColombia vs. Croacia | 18:00 hrs | Estadio Miami  Miércoles 24 de junioSuiza vs. Canadá | 13:00 hrs | Estadio Vancouver  Bosnia y Herzegovina vs. Catar | 13:00 hrs | Estadio Seattle  Escocia vs. Brasil | 16:00 hrs | Estadio Miami  Marruecos vs. Haití | 16:00 hrs | Estadio Atlanta  México vs. Chequia | 19:00 hrs | Estadio Ciudad de México  Sudáfrica vs. Corea del Sur | 19:00 hrs | Estadio Guadalajara  Jueves 25 de junioCurazao vs. Costa de Marfil | 14:00 hrs | Estadio Filadelfia  Ecuador vs. Alemania | 14:00 hrs | Estadio Nueva Jersey  Japón vs. Suecia | 17:00 hrs | Estadio Dallas  Túnez vs. Países Bajos | 17:00 hrs | Estadio Kansas City  Turquía vs. Estados Unidos | 20:00 hrs | Estadio Los Ángeles  Paraguay vs. Australia | 20:00 hrs | Estadio San Francisco  Viernes 26 de junioNoruega vs. Francia | 13:00 hrs | Estadio Boston  Senegal vs. Irak | 13:00 hrs | Estadio Toronto  Cabo Verde vs. Arabia Saudita | 18:00 hrs | Estadio Houston  Uruguay vs. España | 18:00 hrs | Estadio Guadalajara  Egipto vs. Irán | 21:00 hrs | Estadio Seattle  Nueva Zelanda vs. Bélgica | 21:00 hrs | Estadio Vancouver  Sábado 27 de junioPanamá vs. Inglaterra | 15:00 hrs | Estadio Nueva Jersey  Croacia vs. Ghana | 15:00 hrs | Estadio Filadelfia  Colombia vs. Portugal | 17:30 hrs | Estadio Miami  RD Congo vs. Uzbekistán | 17:30 hrs | Estadio Atlanta  Argelia vs. Austria | 20:00 hrs | Estadio Kansas City  Jordania vs. Argentina | 20:00 hrs | Estadio Dallas  
`;

const teamsSpanish = [
  'México', 'Sudáfrica', 'Corea del Sur', 'Chequia', 'Canadá', 'Bosnia y Herzegovina',
  'Estados Unidos', 'Paraguay', 'Catar', 'Suiza', 'Brasil', 'Marruecos', 'Haití', 'Escocia',
  'Australia', 'Turquía', 'Alemania', 'Curazao', 'Países Bajos', 'Japón', 'Costa de Marfil',
  'Ecuador', 'Suecia', 'Túnez', 'España', 'Cabo Verde', 'Bélgica', 'Egipto', 'Arabia Saudita',
  'Uruguay', 'Irán', 'Nueva Zelanda', 'Francia', 'Senegal', 'Irak', 'Noruega', 'Argentina',
  'Argelia', 'Austria', 'Jordania', 'Portugal', 'RD Congo', 'Inglaterra', 'Croacia', 'Ghana',
  'Panamá', 'Colombia', 'Uzbekistán'
];

const teamTranslation = {
  'México': 'Mexico',
  'Sudáfrica': 'South Africa',
  'Corea del Sur': 'South Korea',
  'Chequia': 'Czechia',
  'Canadá': 'Canada',
  'Bosnia y Herzegovina': 'Bosnia-Herzegovina',
  'Estados Unidos': 'USA',
  'Paraguay': 'Paraguay',
  'Catar': 'Qatar',
  'Suiza': 'Switzerland',
  'Brasil': 'Brazil',
  'Marruecos': 'Morocco',
  'Haití': 'Haiti',
  'Escocia': 'Scotland',
  'Australia': 'Australia',
  'Turquía': 'Turkiye',
  'Alemania': 'Germany',
  'Curazao': 'Curacao',
  'Países Bajos': 'Netherlands',
  'Japón': 'Japan',
  'Costa de Marfil': 'Ivory Coast',
  'Ecuador': 'Ecuador',
  'Suecia': 'Sweden',
  'Túnez': 'Tunisia',
  'España': 'Spain',
  'Cabo Verde': 'Cape Verde',
  'Bélgica': 'Belgium',
  'Egipto': 'Egypt',
  'Arabia Saudita': 'Saudi Arabia',
  'Uruguay': 'Uruguay',
  'Irán': 'Iran',
  'Nueva Zelanda': 'New Zealand',
  'Francia': 'France',
  'Senegal': 'Senegal',
  'Irak': 'Iraq',
  'Noruega': 'Norway',
  'Argentina': 'Argentina',
  'Argelia': 'Algeria',
  'Austria': 'Austria',
  'Jordania': 'Jordan',
  'Portugal': 'Portugal',
  'RD Congo': 'DR Congo',
  'Inglaterra': 'England',
  'Croacia': 'Croatia',
  'Ghana': 'Ghana',
  'Panamá': 'Panama',
  'Colombia': 'Colombia',
  'Uzbekistán': 'Uzbekistan'
};

// Sort teams by length descending to match longer names first in regex
const sortedTeams = [...teamsSpanish].sort((a, b) => b.length - a.length);

function parseText(text) {
  // Let's find all date headers and their indexes
  const dateRegex = /(Viernes|Sábado|Domingo|Lunes|Martes|Miércoles|Jueves)\s+(\d+)\s+de\s+(junio|julio)(?:\s*\(Hoy\))?/gi;
  const dates = [];
  let match;
  while ((match = dateRegex.exec(text)) !== null) {
    dates.push({
      index: match.index,
      length: match[0].length,
      text: match[0],
      day: match[2],
      month: match[3]
    });
  }

  // Construct match regex dynamically
  // It can be: "TeamA vs. TeamB" or "TeamA vs TeamB" or "TeamA X-Y TeamB"
  // Let's match team names from sortedTeams
  const teamPattern = sortedTeams.map(t => t.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|');
  const matchRegex = new RegExp(`(${teamPattern})\\s+(?:vs\\.?|vs|\\d+-\\\d+)\\s+(${teamPattern})`, 'gi');
  
  const matchesRaw = [];
  while ((match = matchRegex.exec(text)) !== null) {
    // Let's find the text that belongs to this match
    // It starts at match.index and goes up to the next match or next date header
    matchesRaw.push({
      index: match.index,
      length: match[0].length,
      fullMatchText: match[0],
      team1: match[1],
      team2: match[2]
    });
  }

  const parsedMatches = [];
  for (let i = 0; i < matchesRaw.length; i++) {
    const current = matchesRaw[i];
    const nextIndex = (i + 1 < matchesRaw.length) ? matchesRaw[i + 1].index : text.length;
    
    // The details block for this match is between current index + current length and nextIndex
    let detailsBlock = text.substring(current.index, nextIndex).trim();
    
    // Find the date for this match by checking the last date header that appeared before current.index
    let activeDate = { day: '11', month: 'junio' }; // Default to opening day June 11
    for (const d of dates) {
      if (d.index < current.index) {
        activeDate = d;
      }
    }
    
    // Let's parse details from the detailsBlock
    // Typically: "Team1 vs. Team2 | 13:00 hrs | Estadio Toronto"
    // Or "Team1 1-0 Team2 | Estadio Ciudad de México"
    const pipeParts = detailsBlock.split('|').map(x => x.trim());
    
    // Let's clean up any glued date headers from the stadium name
    // e.g. "Estadio GuadalajaraViernes 12 de junio (Hoy)"
    // We can remove the date header text if it is found at the end of the last part
    let lastPart = pipeParts[pipeParts.length - 1];
    dates.forEach(d => {
      if (lastPart.toLowerCase().includes(d.text.toLowerCase())) {
        lastPart = lastPart.substring(0, lastPart.toLowerCase().indexOf(d.text.toLowerCase())).trim();
      }
    });
    pipeParts[pipeParts.length - 1] = lastPart;
    
    let homeTeam = teamTranslation[current.team1] || current.team1;
    let awayTeam = teamTranslation[current.team2] || current.team2;
    let homeScore = null;
    let awayScore = null;
    let status = 'scheduled';
    
    // Check if it's a finished match with score
    const scoreMatch = current.fullMatchText.match(/(.+?)\s+(\d+)-(\d+)\s+(.+)/);
    if (scoreMatch) {
      homeScore = parseInt(scoreMatch[2]);
      awayScore = parseInt(scoreMatch[3]);
      status = 'finished';
    }
    
    let timeStr = '18:00';
    let stadium = lastPart;
    
    if (pipeParts.length >= 3) {
      timeStr = pipeParts[1].replace('hrs', '').trim();
    }
    
    // format date as YYYY-MM-DD HH:MM
    const months = { 'junio': '06', 'julio': '07' };
    const dateFormatted = `2026-${months[activeDate.month.toLowerCase()]}-${activeDate.day.padStart(2, '0')} ${timeStr}`;
    
    parsedMatches.push({
      match_num: i + 1,
      home_team: homeTeam,
      away_team: awayTeam,
      home_score: homeScore,
      away_score: awayScore,
      status: status,
      match_date: dateFormatted,
      stadium: stadium,
      original_line: current.fullMatchText + ' | ' + pipeParts.slice(1).join(' | ')
    });
  }
  
  return parsedMatches;
}

const parsed = parseText(userMatchesText);
console.log(`Successfully parsed ${parsed.length} matches.`);
fs.writeFileSync('scratch/parsed_user_matches.json', JSON.stringify(parsed, null, 2));

// Print unique teams to verify they are all correct
const teams = new Set();
parsed.forEach(m => {
  teams.add(m.home_team);
  teams.add(m.away_team);
});
console.log('Unique teams found:', Array.from(teams).sort());
console.log('Number of teams:', teams.size);
