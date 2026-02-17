
export enum FormStep {
  General = 'general',
  TextContent = 'textContent',
  Experimental = 'experimental',
  Data = 'data',
  Analysis = 'analysis',
  Appendices = 'appendices',
  Rubric = 'rubric' // inferring this might be used or useful
}

export interface MaterialRow {
  id: string;
  item: string;
  qty: string;
  description?: string;
  imageUrl?: string;
  category: 'LABORATORY' | 'STUDENT';
}

export interface VariableConfig {
  id: string;
  name: string;
  symbol: string;
  unit: string;
  multiplier: number;
  uncertainty: number;
  numRepetitions?: number;
  precision?: number;
  isCalculated?: boolean;
  formula?: string;
}

export interface IndirectVariable {
  id: string;
  name: string;
  symbol: string;
  unit: string;
  formula: string;
  precision: number;
}

export interface MeasurementRow {
  n: number;
  i: string[];
  d: string[];
  others: Record<string, string>;
  dX: string;
  dY: string;
}

export interface DataSeries {
  id: string;
  name: string;

  precisionX: number;
  precisionY: number;

  varDep: VariableConfig;
  varIndep: VariableConfig;
  extraVariables: VariableConfig[];

  numMeasurements: number;
  numRepetitionsDep: number;
  numRepetitionsIndep: number;
  measurements: MeasurementRow[];

  indirectVariables: IndirectVariable[];
}

export interface RubricLevel {
  label: string;
  points: number;
  description: string;
}

export interface RubricCriterion {
  id: string;
  section: FormStep;
  category: string;
  title: string;
  weight: number;
  levels: RubricLevel[];
}

export interface Evaluation {
  criterionId: string;
  levelLabel: string;
  score: number;
  selectedLevelIndex?: number;
}

export interface RegressionRow {
  n: number;
  x: number;
  y: number;
  x2: number;
  y2: number;
  xy: number;
}

export interface LabReport {
  practiceNo: string;
  title: string;
  dateDev: string;
  dateDelivery: string;
  leader: string;
  int2: string;
  int3: string;
  int4: string;
  teacher: string;
  abstract: string;
  introduction: string;
  objectiveGeneral: string;
  objectivesSpecific: string;
  hypothesis: string;
  marcoConceptual: string;
  montajeText: string;
  setupImageUrl?: string;
  circuitDiagramUrl?: string;
  cirkitProjectUrl?: string;
  materials: MaterialRow[];
  procedimiento: string;
  logoUrl: string;
  graphImageUrl: string;
  desmosLink: string;

  // Legacy/Compat fields
  precisionX: number;
  precisionY: number;
  numMeasurements: number;
  numRepetitionsDep: number;
  numRepetitionsIndep: number;
  varDep: VariableConfig;
  varIndep: VariableConfig;
  measurements: MeasurementRow[];

  analysis: string;
  conclusions: string;
  bibliography: string;
  rubric: RubricCriterion[];
  evaluations: Evaluation[];

  // New Series Logic
  dataSeries: DataSeries[];
  activeSeriesIndex: number;
  images: Record<string, string>;
  appendices?: AppendixData;
}

export interface AppendixData {
  codeContent?: string;
  selectedBoard?: string;
  translatedCode?: string;
  cirkitSchematicImage?: string;
  cirkitProjectId?: string;
  pinoutBoardImage?: string;
  pinoutBoardName?: string;
  selectedBoardId?: string;
  pinoutConfiguration?: any; // JSON configuration data
}
