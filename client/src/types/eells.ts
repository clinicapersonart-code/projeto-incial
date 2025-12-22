export interface EellsFormulation {
    problemList: {
        redFlags: string; // Text area for comma separated values or bullet points
        chemicalDependence: boolean;
        suicidality: boolean;
        functioning: string; // "Self", "Interpersonal", "Societal"
    };
    diagnosis: string;
    explanatoryHypothesis: {
        precipitants: string;
        origins: string;
        resources: string;
        obstacles: string;
        coreHypothesis: string; // The "story"
    };
    treatmentPlan: {
        goals: string;
        interventions: string;
    };
    narrative: string; // The explanatory text below the table
}
