const COMPETITION_CODE = "WC"; // ЧМ
const API_BASE = "https://api.football-data.org/v4";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/scoreboard") {
      try {
        // 1. Загружаем прогнозы из статического файла
        const predictionsResponse = await env.ASSETS.fetch(
          new Request(new URL("/data/predictions.json", request.url), request)
        );
        if (!predictionsResponse.ok) {
          throw new Error("Не удалось загрузить predictions.json");
        }
        const predictionsData = await predictionsResponse.json();

        // 2. Загружаем реальные матчи ЧМ
        const matchesResponse = await fetch(
          `${API_BASE}/competitions/${COMPETITION_CODE}/matches`,
          {
            headers: {
              "X-Auth-Token": env.FOOTBALL_DATA_API_KEY
            }
          }
        );

        if (!matchesResponse.ok) {
          const text = await matchesResponse.text();
          throw new Error(
            `football-data.org error ${matchesResponse.status}: ${text}`
          );
        }

        const matchesJson = await matchesResponse.json();

        const finishedMatches = (matchesJson.matches || []).filter(
          m => m.status === "FINISHED"
        );

        // 3. Готовим карту матчей по id (или по комбинации команд)
        const matchesById = new Map();
        for (const m of finishedMatches) {
          // id матча от API
          matchesById.set(m.id, m);
        }

        // 4. Считаем очки по вашим прогнозам
        const pointsMap = {};

        for (const matchPred of predictionsData.matches || []) {
          const match = matchesById.get(matchPred.id);
          if (!match || !match.score || !match.score.fullTime) continue;

          const homeScore = match.score.fullTime.home;
          const awayScore = match.score.fullTime.away;

          const realDiff = homeScore - awayScore;
          const realResult =
            realDiff === 0 ? "D" : realDiff > 0 ? "H" : "A";

          for (const pred of matchPred.predictions || []) {
            if (!pointsMap[pred.name]) pointsMap[pred.name] = 0;

            const exact =
              pred.home === homeScore && pred.away === awayScore;

            const predDiff = pred.home - pred.away;
            const predResult =
              predDiff === 0 ? "D" : predDiff > 0 ? "H" : "A";

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

        // 5. Готовим сокращённый список матчей для фронта
        const matchesForClient = finishedMatches.map(m => ({
          id: m.id,
          utcDate: m.utcDate,
          homeTeam: m.homeTeam?.name,
          awayTeam: m.awayTeam?.name,
          homeScore: m.score?.fullTime?.home,
          awayScore: m.score?.fullTime?.away,
          status: m.status
        }));

        return new Response(
          JSON.stringify({
            competition: matchesJson.competition?.name || "World Cup",
            updatedAt: new Date().toISOString(),
            matches: matchesForClient,
            table
          }),
          {
            headers: {
              "content-type": "application/json; charset=UTF-8",
              "cache-control": "no-store"
            }
          }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({
            error: err.message || "Unknown error"
          }),
          {
            status: 500,
            headers: {
              "content-type": "application/json; charset=UTF-8"
            }
          }
        );
      }
    }

    // Всё остальное — статика
    return env.ASSETS.fetch(request);
  }
};