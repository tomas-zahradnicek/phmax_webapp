import type { Dataset } from './phmax-ss-validator';
import type { ModeKey, StudyForm } from './phmax-ss-helpers';
import { getProgram } from './phmax-ss-helpers';
import { chooseDefaultMode } from './phmax-ss-service';

export type BusinessRuleOborInput = {
  code: string;
  studentsInClass?: number;
  year?: number;
  form?: StudyForm;
  durationYears?: number;
};

export type BusinessRulesInput = {
  obory: BusinessRuleOborInput[];
  isPar16Class?: boolean;
  isLegacyMultioborClass?: boolean;
  legacyMaxOborCount?: number;
  requestedMode?: ModeKey;
};

export type RuleMessage = {
  code: string;
  message: string;
  relatedCodes?: string[];
};

export type BusinessRulesResult = {
  allowed: boolean;
  errors: RuleMessage[];
  warnings: RuleMessage[];
  info: RuleMessage[];
  recommendedMode?: ModeKey;
  suggestedComputation?: 'oneObor' | 'multiObor' | 'transition' | 'par16';
};

type NormalizedObor = {
  code: string;
  group: string;
  category: string;
  name: string;
  studentsInClass?: number;
  year?: number;
  form?: StudyForm;
  durationYears?: number;
  hasTalentExam: boolean;
  isGymnazium: boolean;
  isGymSport: boolean;
};

function categoryFromCode(code: string): string {
  const match = code.match(/-([A-Z])\//);
  return match?.[1] ?? '';
}

function includesText(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function allEqual<T>(arr: T[], selector: (item: T) => unknown): boolean {
  if (arr.length <= 1) return true;
  const first = selector(arr[0]);
  return arr.every((item) => selector(item) === first);
}

function normalizeObor(dataset: Dataset, input: BusinessRuleOborInput): NormalizedObor {
  const program = getProgram(dataset, input.code);
  const category = categoryFromCode(program.code);
  const group = program.group || program.code.split('-')[0] || '';
  const name = program.name || '';

  const hasTalentExam =
    group === '82' || includesText(name, 'sportovní přípravou') || includesText(name, 'uměleck');
  const isGymSport = includesText(name, 'gymnázium se sportovní přípravou');
  const isGymnazium = includesText(name, 'gymnázium') && !isGymSport;

  return {
    code: program.code,
    group,
    category,
    name,
    studentsInClass: input.studentsInClass,
    year: input.year,
    form: input.form,
    durationYears: input.durationYears,
    hasTalentExam,
    isGymnazium,
    isGymSport,
  };
}

function makeResult(): BusinessRulesResult {
  return {
    allowed: true,
    errors: [],
    warnings: [],
    info: [],
  };
}

function pushError(
  result: BusinessRulesResult,
  code: string,
  message: string,
  relatedCodes?: string[],
): void {
  result.errors.push({ code, message, relatedCodes });
  result.allowed = false;
}

function pushWarning(
  result: BusinessRulesResult,
  code: string,
  message: string,
  relatedCodes?: string[],
): void {
  result.warnings.push({ code, message, relatedCodes });
}

function pushInfo(
  result: BusinessRulesResult,
  code: string,
  message: string,
  relatedCodes?: string[],
): void {
  result.info.push({ code, message, relatedCodes });
}

export function evaluateBusinessRules(
  dataset: Dataset,
  input: BusinessRulesInput,
): BusinessRulesResult {
  const result = makeResult();

  if (!Array.isArray(input.obory) || input.obory.length === 0) {
    pushError(result, 'EMPTY_INPUT', 'Musí být zadán alespoň jeden obor.');
    return result;
  }

  const obory = input.obory.map((obor) => normalizeObor(dataset, obor));
  const codes = obory.map((o) => o.code);
  const oborCount = obory.length;

  if (oborCount === 1) {
    result.suggestedComputation = input.isPar16Class ? 'par16' : 'oneObor';
    result.recommendedMode =
      input.requestedMode ??
      chooseDefaultMode(dataset, {
        code: obory[0].code,
        oborCountInClass: 1,
        isArt82TalentClass: obory[0].group === '82',
      });
    pushInfo(result, 'ONE_OBOR', 'Jde o jednooborovou třídu.');
    return result;
  }

  if (input.isPar16Class) {
    if (!allEqual(obory, (o) => o.category)) {
      pushError(
        result,
        'PAR16_CATEGORY_MISMATCH',
        'Ve třídě podle § 16 odst. 9 mohou být jen obory stejné kategorie dosaženého vzdělání.',
        codes,
      );
    } else {
      pushInfo(
        result,
        'PAR16_MULTI',
        'U třídy podle § 16 odst. 9 se neuplatní běžná pravidla pro vytváření víceoborových tříd.',
        codes,
      );
    }

    result.suggestedComputation = 'par16';
    result.recommendedMode =
      input.requestedMode ??
      chooseDefaultMode(dataset, {
        code: obory[0].code,
        oborCountInClass: 1,
        isArt82TalentClass: obory[0].group === '82',
      });
    return result;
  }

  if (input.isLegacyMultioborClass) {
    result.suggestedComputation = 'transition';
    pushInfo(
      result,
      'LEGACY_MULTI',
      'Jde o víceoborovou třídu pod přechodným ustanovením; běžné limity § 2a–2c se neuplatní.',
      codes,
    );

    if (
      typeof input.legacyMaxOborCount === 'number' &&
      oborCount > input.legacyMaxOborCount
    ) {
      pushError(
        result,
        'LEGACY_OVER_LIMIT',
        'Počet oborů přesahuje počet dosažený ke dni účinnosti novely; to přechodné ustanovení nepřipouští.',
        codes,
      );
    }

    const first = obory[0];
    const category = first.category;
    if (['E', 'H'].includes(category)) {
      result.recommendedMode = oborCount >= 3 ? 'threeObory' : 'twoObory';
    } else if (['L', 'M', 'K'].includes(category)) {
      result.recommendedMode = 'twoObory';
    } else {
      result.recommendedMode = 'oneObor';
    }

    return result;
  }

  // běžná víceoborová třída
  if (!allEqual(obory, (o) => o.category)) {
    pushError(
      result,
      'CATEGORY_MISMATCH',
      'Víceoborová třída musí být ze stejné kategorie dosaženého vzdělání.',
      codes,
    );
  }

  if (!allEqual(obory, (o) => o.form ?? 'denni')) {
    pushError(
      result,
      'FORM_MISMATCH',
      'Víceoborová třída musí mít stejnou formu vzdělávání u všech oborů.',
      codes,
    );
  }

  if (!allEqual(obory, (o) => o.durationYears ?? null)) {
    pushError(
      result,
      'DURATION_MISMATCH',
      'Víceoborová třída musí mít stejnou délku vzdělávání u všech oborů.',
      codes,
    );
  }

  if (!allEqual(obory, (o) => o.year ?? null)) {
    pushError(
      result,
      'YEAR_MISMATCH',
      'Víceoborová třída musí být ze stejného ročníku.',
      codes,
    );
  }

  const allowedCategories = new Set(['E', 'H', 'L', 'M', 'K']);
  for (const o of obory) {
    if (!allowedCategories.has(o.category)) {
      pushError(
        result,
        'CATEGORY_NOT_ALLOWED',
        `Obor ${o.code} (${o.name}) není v běžné víceoborové třídě přípustný.`,
        [o.code],
      );
    }
  }

  const under17Count = obory.filter(
    (o) => typeof o.studentsInClass === 'number' && o.studentsInClass < 17,
  ).length;
  const overOrEqual17 = obory.filter(
    (o) => typeof o.studentsInClass === 'number' && o.studentsInClass >= 17,
  );

  if (under17Count === 0) {
    pushError(
      result,
      'NO_UNDER_17',
      'Běžnou víceoborovou třídu nelze vytvořit, pokud žádný z oborů nemá méně než 17 žáků.',
      codes,
    );
  } else if (overOrEqual17.length > 0) {
    pushWarning(
      result,
      'PARTIAL_OVER_17',
      'Jeden nebo více oborů má 17 a více žáků; to je přípustné jen ve zvláštním režimu, pokud nelze složit třídu pouze z oborů pod 17 žáků.',
      overOrEqual17.map((o) => o.code),
    );
  }

  const category = obory[0].category;
  const isAllTalent = obory.every((o) => o.hasTalentExam);
  const has82 = obory.some((o) => o.group === '82');

  if (category === 'K') {
    const gymComboAllowed =
      oborCount === 2 &&
      obory.some((o) => o.isGymnazium) &&
      obory.some((o) => o.isGymSport);

    if (!gymComboAllowed) {
      pushError(
        result,
        'K_NOT_ALLOWED',
        'Víceoborové třídy nelze vytvářet v kategorii K, s výjimkou kombinace Gymnázium + Gymnázium se sportovní přípravou.',
        codes,
      );
    }
  }

  if (isAllTalent) {
    pushInfo(
      result,
      'ALL_TALENT',
      'Všechny obory jsou talentové; počet oborů ve víceoborové třídě není omezen.',
      codes,
    );
  } else {
    const someTalentExam = obory.some((o) => o.hasTalentExam);
    if (someTalentExam) {
      pushInfo(
        result,
        'MIXED_TALENT_REGIME',
        'Ne všechny obory mají v RVP součást přijímacího řízení v podobě talentové zkoušky; kombinace s/bez talentové zkoušky se řídí vyhláškou č. 13/2005 Sb. Aplikace talent odhaduje ze skupiny kódu a názvu programu — ověřte u konkrétních oborů.',
        codes,
      );
    }

    if (['E', 'H'].includes(category) && oborCount > 3) {
      pushError(
        result,
        'EH_TOO_MANY',
        'V běžné víceoborové třídě lze mít nejvýše 3 obory kategorie E/H.',
        codes,
      );
    }

    if (['L', 'M'].includes(category) && oborCount > 2) {
      pushError(
        result,
        'LM_TOO_MANY',
        'V běžné víceoborové třídě lze mít nejvýše 2 obory kategorie L nebo M.',
        codes,
      );
    }
  }

  if (result.allowed) {
    result.suggestedComputation = 'multiObor';

    if (has82 && oborCount >= 3) {
      result.recommendedMode = 'threePlusObory82';
    } else if (has82 && oborCount === 2) {
      result.recommendedMode = 'twoObory82';
    } else if (oborCount >= 3 && ['E', 'H'].includes(category)) {
      result.recommendedMode = 'threeObory';
    } else {
      result.recommendedMode = 'twoObory';
    }
  }

  return result;
}
