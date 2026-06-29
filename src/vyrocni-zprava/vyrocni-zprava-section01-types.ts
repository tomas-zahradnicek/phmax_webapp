export type VyrocniZpravaSection01Data = {
  schoolCharacteristic?: string;
  schoolParts?: string;
  schoolCapacity?: string;
  materialTechnicalConditions?: string;
  schoolCouncilInfo?: string;
  leadershipInfo?: string;
  remoteAccessInfo?: string;
};

export type Section01StorageEnvelope = {
  version: 1;
  data: VyrocniZpravaSection01Data;
  savedAt: string | null;
};
