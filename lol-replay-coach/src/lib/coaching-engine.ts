import { ReplayData, CoachingInsight, Player, GameEvent } from "@/types/replay";

export function analyzeReplay(replay: ReplayData): CoachingInsight[] {
  const insights: CoachingInsight[] = [];
  const player = replay.players.find(
    (p) => p.summonerName === replay.focusedPlayer
  );
  if (!player) return insights;

  analyzeCS(player, replay, insights);
  analyzeVision(player, replay, insights);
  analyzeDeaths(player, replay, insights);
  analyzeObjectives(replay, insights);
  analyzeTeamfights(player, replay, insights);
  analyzePositioning(player, replay, insights);
  analyzeMacro(player, replay, insights);
  analyzeItemization(player, insights);

  return insights.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

function analyzeCS(
  player: Player,
  replay: ReplayData,
  insights: CoachingInsight[]
) {
  const gameMins = replay.gameDuration / 60;

  if (player.role === "SUPPORT") return;

  if (player.csPerMin < 6) {
    insights.push({
      category: "cs",
      severity: "critical",
      title: "CS/min below 6.0",
      description: `You averaged ${player.csPerMin} CS/min as ${player.championName}. For a ${player.role}, this is significantly below the target of 7-8 CS/min.`,
      suggestion:
        "Practice last-hitting in the practice tool for 10 minutes daily. Focus on not using abilities to farm early - rely on auto attacks. Try to catch side waves between objectives.",
    });
  } else if (player.csPerMin < 7) {
    insights.push({
      category: "cs",
      severity: "warning",
      title: "CS could be improved",
      description: `${player.csPerMin} CS/min is decent but there's room for improvement. You had ${player.cs} CS in ${gameMins.toFixed(0)} minutes.`,
      suggestion:
        "Focus on catching side waves after laning phase. Set up slow pushes before objectives spawn. Don't ARAM mid when there are waves to catch.",
    });
  } else {
    insights.push({
      category: "cs",
      severity: "info",
      title: "Strong CS numbers",
      description: `${player.csPerMin} CS/min is solid for ${player.role}. Keep up the farming discipline.`,
      suggestion:
        "Maintain this level. Look for opportunities to take jungle camps when your jungler is on the opposite side of the map.",
    });
  }
}

function analyzeVision(
  player: Player,
  replay: ReplayData,
  insights: CoachingInsight[]
) {
  const gameMins = replay.gameDuration / 60;
  const vsPerMin = player.visionScore / gameMins;

  const thresholds: Record<string, number> = {
    SUPPORT: 2.5,
    JUNGLE: 1.5,
    MID: 1.0,
    ADC: 0.8,
    TOP: 0.8,
  };

  const target = thresholds[player.role] ?? 1.0;

  if (vsPerMin < target * 0.6) {
    insights.push({
      category: "vision",
      severity: "critical",
      title: "Vision score critically low",
      description: `Your vision score was ${player.visionScore} (${vsPerMin.toFixed(1)}/min). As ${player.role}, you should aim for ${(target * gameMins).toFixed(0)}+ vision score in a ${gameMins.toFixed(0)} minute game.`,
      suggestion:
        "Buy control wards on every back (carry 2 if possible). Place wards proactively before objectives spawn. Swap to Oracle Lens after laning phase if you're not support.",
    });
  } else if (vsPerMin < target) {
    insights.push({
      category: "vision",
      severity: "warning",
      title: "Vision score below average",
      description: `Vision score of ${player.visionScore} is slightly below expectations for ${player.role}. You placed ${player.wardsPlaced} wards and cleared ${player.wardsKilled}.`,
      suggestion:
        "Ward key chokepoints 60-90 seconds before dragon/baron spawns. Clear wards around objectives before starting them.",
    });
  }
}

function analyzeDeaths(
  player: Player,
  replay: ReplayData,
  insights: CoachingInsight[]
) {
  const deathEvents = replay.events.filter(
    (e) =>
      (e.type === "DEATH" || e.type === "KILL") &&
      e.participants?.includes(player.summonerName) &&
      e.team !== player.team
  );

  if (player.deaths > 6) {
    insights.push({
      category: "positioning",
      severity: "critical",
      title: "Too many deaths",
      description: `You died ${player.deaths} times this game. As ${player.championName} (${player.role}), dying more than 4-5 times significantly reduces your impact.`,
      suggestion:
        "Review each death and ask: Was I overextended? Did I have vision? Was my flash up? Identify the 2-3 most avoidable deaths and focus on not repeating those mistakes.",
    });
  } else if (player.deaths > 4) {
    insights.push({
      category: "positioning",
      severity: "warning",
      title: "Deaths slightly high",
      description: `${player.deaths} deaths is manageable but some were likely avoidable. Your KDA was ${((player.kills + player.assists) / Math.max(player.deaths, 1)).toFixed(1)}.`,
      timestamp: deathEvents[0]?.timestamp,
      suggestion:
        "Track enemy cooldowns before fighting. If you don't know where the enemy jungler is, play as if they're in the closest bush.",
    });
  }
}

function analyzeObjectives(
  replay: ReplayData,
  insights: CoachingInsight[]
) {
  const objectiveEvents = replay.events.filter(
    (e) =>
      e.type === "DRAGON" || e.type === "BARON" || e.type === "RIFT_HERALD"
  );

  const blueObjectives = objectiveEvents.filter((e) => e.team === "blue");
  const redObjectives = objectiveEvents.filter((e) => e.team === "red");

  const focusedTeam = replay.players.find(
    (p) => p.summonerName === replay.focusedPlayer
  )?.team;

  const teamObjectives =
    focusedTeam === "blue" ? blueObjectives : redObjectives;

  if (teamObjectives.length >= 3) {
    insights.push({
      category: "objective",
      severity: "info",
      title: "Good objective control",
      description: `Your team secured ${teamObjectives.length} major objectives. This shows strong macro play and objective prioritization.`,
      suggestion:
        "Continue to set up vision 60-90 seconds before objectives. Coordinate with your team to establish priority lanes before contesting.",
    });
  }

  const contestedEvents = replay.events.filter(
    (e) => e.type === "OBJECTIVE_CONTEST"
  );
  if (contestedEvents.length > 0) {
    insights.push({
      category: "objective",
      severity: "warning",
      title: "Contested objectives",
      description: `There were ${contestedEvents.length} contested objective fights. These 50/50 scenarios can be game-deciding.`,
      timestamp: contestedEvents[0]?.timestamp,
      suggestion:
        "Avoid 50/50 smite fights when possible. Look to get a pick or establish number advantage before starting objectives.",
    });
  }
}

function analyzeTeamfights(
  player: Player,
  replay: ReplayData,
  insights: CoachingInsight[]
) {
  const teamfights = replay.events.filter((e) => e.type === "TEAM_FIGHT");

  const participated = teamfights.filter((e) =>
    e.participants?.includes(player.summonerName)
  );

  if (participated.length < teamfights.length * 0.5 && teamfights.length > 2) {
    insights.push({
      category: "teamfight",
      severity: "warning",
      title: "Missed teamfights",
      description: `You participated in ${participated.length} of ${teamfights.length} teamfights. Being absent from key fights can cost your team the game.`,
      suggestion:
        "Watch the minimap for developing fights. Push waves quickly and rotate to your team. As ADC, position with your team around objectives.",
    });
  }

  if (player.role === "ADC" && player.damageToChampions > 0) {
    const avgDmg =
      replay.players
        .filter((p) => p.team === player.team && p.role !== "SUPPORT")
        .reduce((sum, p) => sum + p.damageToChampions, 0) / 4;

    if (player.damageToChampions > avgDmg * 1.3) {
      insights.push({
        category: "teamfight",
        severity: "info",
        title: "Excellent damage output",
        description: `You dealt ${(player.damageToChampions / 1000).toFixed(1)}k damage to champions, well above your team's average. Strong teamfight contribution.`,
        suggestion:
          "You're doing great damage. Focus on survival to maintain this output consistently.",
      });
    }
  }
}

function analyzePositioning(
  player: Player,
  replay: ReplayData,
  insights: CoachingInsight[]
) {
  if (player.role === "ADC" || player.role === "MID") {
    const deathsToAssassins = replay.events.filter(
      (e) =>
        e.type === "KILL" &&
        e.team !== player.team &&
        e.participants?.includes(player.summonerName) &&
        e.description.toLowerCase().includes("caught")
    );

    if (deathsToAssassins.length > 0) {
      insights.push({
        category: "positioning",
        severity: "warning",
        title: "Caught out of position",
        description: `You were caught out ${deathsToAssassins.length} time(s). As a squishy carry, positioning is your most important skill.`,
        timestamp: deathsToAssassins[0]?.timestamp,
        suggestion:
          "Stay behind your frontline in teamfights. Don't facecheck bushes without vision. Keep track of enemy assassin/engage cooldowns.",
      });
    }
  }
}

function analyzeMacro(
  player: Player,
  replay: ReplayData,
  insights: CoachingInsight[]
) {
  const gameMins = replay.gameDuration / 60;

  if (player.goldPerMin < 400 && player.role !== "SUPPORT") {
    insights.push({
      category: "macro",
      severity: "warning",
      title: "Gold income below expectations",
      description: `${player.goldPerMin} gold/min is low for ${player.role}. This may indicate missed farm, failed roams, or poor recall timing.`,
      suggestion:
        "Optimize your back timings - try to back with enough gold for a component item. Catch side waves between plays. Don't overstay in fights you can't win.",
    });
  }

  if (player.role === "ADC" && player.csPerMin >= 7 && player.goldPerMin >= 450) {
    insights.push({
      category: "macro",
      severity: "info",
      title: "Efficient gold generation",
      description: `Strong ${player.goldPerMin} gold/min with ${player.csPerMin} CS/min shows excellent resource collection.`,
      suggestion:
        "You're farming well. Look for opportunities to take plates and jungle camps to push this even higher.",
    });
  }
}

function analyzeItemization(
  player: Player,
  insights: CoachingInsight[]
) {
  if (player.role === "ADC") {
    insights.push({
      category: "itemization",
      severity: "info",
      title: "Item build review",
      description: `Your build path on ${player.championName} looks standard. Having ${player.items.filter((i) => i > 0).length} completed items at this game length is reasonable.`,
      suggestion:
        "Consider building Quicksilver Sash against heavy CC comps. Don't be afraid to deviate from standard builds when the situation calls for it.",
    });
  }
}

export function getOverallGrade(
  player: Player,
  replay: ReplayData
): { grade: string; color: string; summary: string } {
  const kda =
    (player.kills + player.assists) / Math.max(player.deaths, 1);
  const csScore = Math.min(player.csPerMin / 8, 1);
  const vsScore = Math.min(player.visionScore / 40, 1);
  const kdaScore = Math.min(kda / 5, 1);
  const dmgShare =
    player.damageToChampions /
    Math.max(
      replay.players
        .filter((p) => p.team === player.team)
        .reduce((sum, p) => sum + p.damageToChampions, 0),
      1
    );
  const dmgScore = Math.min(dmgShare / 0.25, 1);

  const won = replay.winner === player.team;
  const winBonus = won ? 0.1 : 0;

  const total =
    (csScore * 0.25 + vsScore * 0.15 + kdaScore * 0.3 + dmgScore * 0.2 + winBonus + 0.1) *
    100;

  if (total >= 85) return { grade: "S+", color: "#FFD700", summary: "Outstanding performance" };
  if (total >= 75) return { grade: "S", color: "#FFD700", summary: "Excellent game" };
  if (total >= 65) return { grade: "A", color: "#4ADE80", summary: "Great performance" };
  if (total >= 55) return { grade: "B+", color: "#60A5FA", summary: "Above average" };
  if (total >= 45) return { grade: "B", color: "#60A5FA", summary: "Solid game" };
  if (total >= 35) return { grade: "C", color: "#FB923C", summary: "Room for improvement" };
  return { grade: "D", color: "#EF4444", summary: "Rough game" };
}
