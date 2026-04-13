import type { Dataset } from "./phmax-ss-validator";
import raw from "./data/phmax-ss-dataset.json";

/**
 * Sjednocený dataset oborů SŠ (zdroj: docs/zdroje/phmax-ss-unified-dataset_final).
 * JSON má v `intervalSets` šablony bez `value`; plné intervaly s `value` jsou v `programs.modes`.
 * Proto dvojité přetypování místo přímého `as Dataset`.
 */
export const phmaxSsDataset: Dataset = raw as unknown as Dataset;
