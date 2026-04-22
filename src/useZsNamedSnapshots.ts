import { useCallback, useEffect, useState } from "react";
import { confirmDestructive, msgConfirmDeleteNamedBackup } from "./confirm-destructive";
import {
  MSG_NAMED_BACKUP_PICK_FIRST,
  MSG_NAMED_BACKUP_PICK_TO_DELETE,
  namedBackupSavedNotice,
} from "./calculator-ui-constants";
import {
  MAX_NAMED_SNAPSHOTS,
  type NamedZsSnapshot,
  readNamedSnapshotsFromLs,
  writeNamedSnapshotsToLs,
} from "./zs-named-snapshots";

type UseZsNamedSnapshotsArgs = {
  buildSnapshot: () => Record<string, unknown>;
  applySnapshotPayload: (snapshot: Record<string, unknown>, notice: string) => void;
  setUiNotice: (message: string) => void;
};

export function useZsNamedSnapshots({
  buildSnapshot,
  applySnapshotPayload,
  setUiNotice,
}: UseZsNamedSnapshotsArgs) {
  const [namedSnapshots, setNamedSnapshots] = useState<NamedZsSnapshot[]>([]);
  const [selectedNamedId, setSelectedNamedId] = useState("");
  const [namedSaveName, setNamedSaveName] = useState("");

  useEffect(() => {
    setNamedSnapshots(readNamedSnapshotsFromLs());
  }, []);

  const saveNamedSnapshot = useCallback(() => {
    const name = namedSaveName.trim() || new Date().toLocaleString("cs-CZ");
    const id = `n-${Date.now()}`;
    const snapshot = buildSnapshot() as unknown as Record<string, unknown>;
    const item: NamedZsSnapshot = { id, name, savedAt: new Date().toISOString(), snapshot };
    setNamedSnapshots((prev) => {
      const next = [item, ...prev].slice(0, MAX_NAMED_SNAPSHOTS);
      writeNamedSnapshotsToLs(next);
      return next;
    });
    setNamedSaveName("");
    setUiNotice(namedBackupSavedNotice(name, MAX_NAMED_SNAPSHOTS));
  }, [buildSnapshot, namedSaveName, setUiNotice]);

  const restoreNamedSnapshot = useCallback(() => {
    const item = namedSnapshots.find((x) => x.id === selectedNamedId);
    if (!item) {
      setUiNotice(MSG_NAMED_BACKUP_PICK_FIRST);
      return;
    }
    applySnapshotPayload(item.snapshot, `Obnovena záloha „${item.name}“.`);
  }, [applySnapshotPayload, namedSnapshots, selectedNamedId, setUiNotice]);

  const deleteNamedSnapshot = useCallback(() => {
    if (!selectedNamedId) {
      setUiNotice(MSG_NAMED_BACKUP_PICK_TO_DELETE);
      return;
    }
    const toDelete = namedSnapshots.find((x) => x.id === selectedNamedId);
    if (!toDelete) return;
    if (!confirmDestructive(msgConfirmDeleteNamedBackup(toDelete.name))) return;
    setNamedSnapshots((prev) => {
      const next = prev.filter((x) => x.id !== selectedNamedId);
      writeNamedSnapshotsToLs(next);
      return next;
    });
    setSelectedNamedId("");
    setUiNotice("Pojmenovaná záloha byla smazána.");
  }, [namedSnapshots, selectedNamedId, setUiNotice]);

  return {
    namedSnapshots,
    selectedNamedId,
    setSelectedNamedId,
    namedSaveName,
    setNamedSaveName,
    saveNamedSnapshot,
    restoreNamedSnapshot,
    deleteNamedSnapshot,
  };
}
