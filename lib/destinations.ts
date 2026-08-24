import destinationCatalog from "../destinations.json";

export type Rating = 1 | 2 | 3 | 4 | 5;

export type Destination = {
  schemaVersion: "2.0";
  id: string;
  name: { zh: string; ja: string; en: string };
  categories: string[];
  region: string;
  overview: {
    oneLine: string;
    hook: string;
    topExperiences: [string, string, string];
    tags: Array<{ emoji: string; label: string }>;
  };
  season: {
    targetWindow: { label: string; startMonthDay: string; endMonthDay: string };
    rating: Rating;
    stage: string;
    summary: string;
    whatYouLikelySee: string[];
    misleadingExpectation: string;
    temperatureContext: string;
    clothing: string;
  };
  visit: {
    coreSellingPoint: string;
    minimumDuration: string;
    idealDuration: string;
    physicalRating: Rating;
    weatherSensitivityRating: Rating;
    luggage: string;
    typicalRoute: {
      name: string;
      stops: string[];
      distanceKm: { min: number; max: number; approximate: boolean };
      officialWalkingTime: string;
      realisticVisitTime: string;
      extension: string;
    };
    overnight: {
      sceneryValueRating: Rating;
      itineraryEfficiencyRating: Rating;
      value: string;
    };
  };
  access: { mainEntrances: string[]; operatingSeason: string };
  fit: { goodFor: string[]; notFor: string[] };
  bookingRisk: { level: "低" | "中" | "高"; summary: string; note: string };
  gallery: {
    status: "asset_selection_pending" | "ready";
    requiredCount: { min: number; max: number };
    requirements: Array<{
      slot: number;
      role: "hero" | "landscape" | "experience" | "season" | "landmark" | "optional";
      displayTitle?: string;
      subject: string;
      seasonConstraint: string;
      assetUrl: string | null;
      sourceUrl: string | null;
    }>;
    note: string;
  };
  sources: Array<{
    title: string;
    url: string;
    type: "official" | "official_transport" | "reference";
    supports: string[];
  }>;
  research: { lastVerified: string; note: string };
};

export type SegmentAnalysis = {
  schemaVersion: "1.0";
  tripId: string;
  segmentId: string;
  segmentLabel: string;
  candidateDestinationIds: string[];
  status:
    | "waiting_for_destinations"
    | "waiting_for_trip_context"
    | "ready"
    | "stale";
  prerequisites: {
    destinationProfilesComplete: boolean;
    tripContextComplete: boolean;
    missingDestinationIds: string[];
    note: string;
  };
  analyzedAt: string | null;
  destinationEvaluations: Array<{
    destinationId: string;
    routeIntegration: {
      status: "pending_master_sheet" | "evaluated";
      traffic: {
        summary: string;
        estimatedDurationMinutes: number | null;
        estimatedCostYen: number | null;
        transfers: number | null;
      };
      requiresHotelChange: boolean | null;
      luggagePlan: string;
      note: string;
    };
    segmentFit: {
      scheduleFitRating: Rating | null;
      routeEfficiencyRating: Rating | null;
      strengths: string[];
      weaknesses: string[];
      summary: string;
    };
  }>;
  comparisons: Array<{
    destinationIds: [string, string];
    destinationNames: [string, string];
    overlapLevel: Rating;
    sharedCharacteristics: string[];
    difference: string;
    relativeAssessments: Array<{
      destinationId: string;
      advantages: string[];
      disadvantages: string[];
    }>;
  }>;
  note: string;
};

export type SegmentDecision = {
  schemaVersion: "1.0";
  tripId: string;
  segmentId: string;
  segmentAnalysisAnalyzedAt: string;
  status: "waiting_for_votes" | "decided" | "stale";
  decidedAt: string | null;
  voteSummary: {
    participantCount: number;
    destinationResults: Array<{
      destinationId: string;
      counts: Record<"love" | "okay" | "neutral" | "skip", number>;
      averageScore: number | null;
    }>;
  };
  decisions: Array<{
    destinationId: string;
    grade: "A" | "B" | "C" | "D";
    recommendation: "keep" | "hold" | "drop";
    summary: string;
    reasons: string[];
  }>;
};

export type RoundOneDestination = {
  id: string;
  name: Destination["name"];
  region: string;
  oneLine: string;
  hook: string;
  topExperiences: Destination["overview"]["topExperiences"];
  tags: Destination["overview"]["tags"];
  season: Pick<Destination["season"], "rating" | "summary">;
  minimumDuration: string;
  idealDuration: string;
  physicalRating: Rating;
  weatherSensitivityRating: Rating;
  gallery: Destination["gallery"];
};

export type RoundTwoDestination = {
  id: string;
  coreSellingPoint: string;
  typicalRoute: Destination["visit"]["typicalRoute"];
  season: Destination["season"];
  physicalRating: Rating;
  weatherSensitivityRating: Rating;
  overnight: Destination["visit"]["overnight"];
  access: Destination["access"];
  luggage: string;
  fit: Destination["fit"];
  bookingRisk: Destination["bookingRisk"];
  sources: Destination["sources"];
  research: Destination["research"];
  segmentAnalysis: SegmentAnalysis | null;
  segmentDecision: SegmentDecision | null;
};

type DestinationCatalog = {
  schemaVersion: "2.0";
  destinations: Destination[];
  segmentAnalyses: SegmentAnalysis[];
  segmentDecisions: SegmentDecision[];
};

const catalog = destinationCatalog as DestinationCatalog;

export const destinations = catalog.destinations;
export const segmentAnalyses = catalog.segmentAnalyses;
export const segmentDecisions = catalog.segmentDecisions;

/** Derives the compact, independent-voting card from a complete destination. */
export function simplifyDestinationForRoundOne(destination: Destination): RoundOneDestination {
  return {
    id: destination.id,
    name: destination.name,
    region: destination.region,
    oneLine: destination.overview.oneLine,
    hook: destination.overview.hook,
    topExperiences: destination.overview.topExperiences,
    tags: destination.overview.tags,
    season: { rating: destination.season.rating, summary: destination.season.summary },
    minimumDuration: destination.visit.minimumDuration,
    idealDuration: destination.visit.idealDuration,
    physicalRating: destination.visit.physicalRating,
    weatherSensitivityRating: destination.visit.weatherSensitivityRating,
    gallery: destination.gallery,
  };
}

/** Derives destination-only detail data; segment planning is joined separately. */
export function simplifyDestinationForRoundTwo(destination: Destination): RoundTwoDestination {
  const segmentAnalysis = segmentAnalyses.find(
    (analysis) => analysis.candidateDestinationIds.includes(destination.id),
  );
  const segmentDecision = segmentDecisions.find(
    (decision) =>
      decision.tripId === segmentAnalysis?.tripId &&
      decision.segmentId === segmentAnalysis?.segmentId,
  ) ?? null;

  return {
    id: destination.id,
    coreSellingPoint: destination.visit.coreSellingPoint,
    typicalRoute: destination.visit.typicalRoute,
    season: destination.season,
    physicalRating: destination.visit.physicalRating,
    weatherSensitivityRating: destination.visit.weatherSensitivityRating,
    overnight: destination.visit.overnight,
    access: destination.access,
    luggage: destination.visit.luggage,
    fit: destination.fit,
    bookingRisk: destination.bookingRisk,
    sources: destination.sources,
    research: destination.research,
    segmentAnalysis,
    segmentDecision,
  };
}
