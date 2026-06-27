export type GenderCountPair = {
  men?: number;
  women?: number;
};

export type QualificationCountPair = {
  qualified?: number;
  notQualified?: number;
};

export type AnnualReportPersonnelData = {
  staffCounts: {
    teachersPersons?: number;
    teachersFte?: number;
    educatorsPersons?: number;
    educatorsFte?: number;
    specialPedagoguesPersons?: number;
    specialPedagoguesFte?: number;
    teachingAssistantsPersons?: number;
    teachingAssistantsFte?: number;
    nonTeachingStaffPersons?: number;
    nonTeachingStaffFte?: number;
  };

  ageAndGender: {
    under35: GenderCountPair;
    age36to45: GenderCountPair;
    age46to55: GenderCountPair;
    over55: GenderCountPair;
    retirementAge: GenderCountPair;
  };

  educationAndGender: {
    belowMaturita: GenderCountPair;
    maturita: GenderCountPair;
    higherVocational: GenderCountPair;
    university: GenderCountPair;
  };

  qualification: {
    primaryTeachers: QualificationCountPair;
    lowerSecondaryTeachers: QualificationCountPair;
    educators: QualificationCountPair;
    teachingAssistants: QualificationCountPair;
    specialPedagogues: QualificationCountPair;
  };

  notes?: string;
};

export type PersonnelStorageEnvelope = {
  version: 1;
  data: AnnualReportPersonnelData;
  savedAt: string | null;
};
