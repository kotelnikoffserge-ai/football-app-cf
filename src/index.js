const COMPETITION_CODE = "WC";
const API_BASE = "https://api.football-data.org/v4";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/scoreboard") {
      try {
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

        const matchesForClient = finishedMatches.map(m => ({
          id: m.id,
          utcDate: m.utcDate,
          stage: m.stage,
          group: m.group,
          matchday: m.matchday,
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
            matches: matchesForClient
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

    return env.ASSETS.fetch(request);
  }
};