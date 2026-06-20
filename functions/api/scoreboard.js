export async function onRequestGet(context) {
  const demoMatches = [
    {
      id: 1,
      homeTeam: "Команда 1",
      awayTeam: "Команда 2",
      status: "FINISHED",
      homeScore: 2,
      awayScore: 1
    },
    {
      id: 2,
      homeTeam: "Команда 3",
      awayTeam: "Команда 4",
      status: "FINISHED",
      homeScore: 1,
      awayScore: 1
    }
  ];

  const predictions = [
    {
      matchId: 1,
      predictions: [
        { name: "Сергей", home: 2, away: 1 },
        { name: "Слава", home: 1, away: 1 }
      ]
    },
    {
      matchId: 2,
      predictions: [
        { name: "Сергей", home: 0, away: 1 },
        { name: "Слава", home: 1, away: 1 }
      ]
    }
  ];

  const pointsMap = {};

  for (const match of demoMatches) {
    const entry = predictions.find(p => p.matchId === match.id);
    if (!entry) continue;

    for (const pred of entry.predictions) {
      if (!pointsMap[pred.name]) pointsMap[pred.name] = 0;

      const exact = pred.home === match.homeScore && pred.away === match.awayScore;
      const predDiff = pred.home - pred.away;
      const realDiff = match.homeScore - match.awayScore;
      const predResult = predDiff === 0 ? "D" : predDiff > 0 ? "H" : "A";
      const realResult = realDiff === 0 ? "D" : realDiff > 0 ? "H" : "A";

      if (exact) {
        pointsMap[pred.name] += 3;
      } else if (predResult === realResult) {
        pointsMap[pred.name] += 1;
      }
    }
  }

  const table = Object.entries(pointsMap)
    .map(([name, points]) => ({ name, points }))
    .sort((a, b) => b.points - a.points);

  return new Response(JSON.stringify({
    updatedAt: new Date().toISOString(),
    matches: demoMatches,
    table
  }), {
    headers: { "content-type": "application/json; charset=UTF-8" }
  });
}