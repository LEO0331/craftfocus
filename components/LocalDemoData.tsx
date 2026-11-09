import { useRef, useState, type ChangeEvent } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { theme } from '@/constants/theme';
import { useI18n } from '@/hooks/useI18n';
import {
  exportLocalBackup,
  importLocalBackup,
  LocalBackupError,
  MAX_BACKUP_BYTES,
  resetLocalDemo,
} from '@/lib/local/backup';

const copy = {
  en: {
    title: 'Local demo data',
    notice: 'Progress is stored in this browser and does not sync across devices. Clearing browser data may erase it. Private browsing may discard progress when you close the window. Export a backup to keep a copy.',
    export: 'Export backup',
    import: 'Import backup',
    reset: 'Reset demo data',
    file: 'Choose CraftFocus backup',
    importConfirm: 'Replace your current CraftFocus demo progress with this backup?',
    resetConfirm: 'Reset your CraftFocus demo progress? This permanently removes your sessions, items, crafts, and settings from this browser.',
    invalid: 'This file contains an invalid CraftFocus backup.',
    version: 'This CraftFocus backup version is unsupported.',
    size: 'The backup exceeds the 64 MB limit.',
    quota: 'Browser storage is full. Free some space and try again.',
    failed: 'Could not access the demo data. Check your browser storage settings and try again.',
  },
  'zh-TW': {
    title: '本機展示資料',
    notice: '進度儲存在目前的瀏覽器，不會跨裝置同步。清除瀏覽器資料可能會刪除進度，無痕視窗也可能在關閉後清除資料。建議匯出備份以保留副本。',
    export: '匯出備份',
    import: '匯入備份',
    reset: '重設展示資料',
    file: '選擇 CraftFocus 備份',
    importConfirm: '要使用這份備份取代目前的 CraftFocus 展示進度嗎？',
    resetConfirm: '要重設 CraftFocus 展示進度嗎？這會永久刪除目前瀏覽器中的專注紀錄、物件、作品和設定。',
    invalid: '這個檔案不是有效的 CraftFocus 備份。',
    version: '目前不支援這個 CraftFocus 備份版本。',
    size: '備份檔案超過 64 MB 的上限。',
    quota: '瀏覽器儲存空間已滿。請釋出一些空間後再試一次。',
    failed: '無法存取展示資料。請檢查瀏覽器儲存設定後再試一次。',
  },
};

export default function LocalDemoData() {
  const { language } = useI18n();
  const labels = copy[language];
  const fileInput = useRef<HTMLInputElement>(null);
  const running = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (operation: () => Promise<void>) => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError(null);
    try {
      await operation();
    } catch (cause) {
      const name = cause instanceof Error ? cause.name : undefined;
      setError(cause instanceof LocalBackupError ? labels[cause.code] : name === 'QuotaExceededError' ? labels.quota : labels.failed);
    } finally {
      running.current = false;
      setBusy(false);
    }
  };

  const download = () => run(async () => {
    const json = await exportLocalBackup();
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'craftfocus-demo-backup.json';
    document.body.append(link);
    try {
      link.click();
    } finally {
      link.remove();
      // Let the browser start reading the download before releasing the URL.
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  });

  const restore = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file || running.current || !window.confirm(labels.importConfirm)) return;
    void run(async () => {
      if (file.size > MAX_BACKUP_BYTES) throw new LocalBackupError('size');
      await importLocalBackup(await file.text());
      window.location.reload();
    });
  };

  const reset = () => {
    if (running.current || !window.confirm(labels.resetConfirm)) return;
    void run(async () => {
      await resetLocalDemo();
      window.location.reload();
    });
  };

  return (
    <Card>
      <Text accessibilityRole="header" style={styles.heading}>{labels.title}</Text>
      <Text style={styles.notice}>{labels.notice}</Text>
      <input
        ref={fileInput}
        type="file"
        accept=".json,application/json"
        aria-label={labels.file}
        data-testid="local-backup-file"
        onChange={restore}
        hidden
      />
      <Button label={labels.export} onPress={download} variant="secondary" disabled={busy} />
      <Button label={labels.import} onPress={() => fileInput.current?.click()} variant="secondary" disabled={busy} />
      <Button label={labels.reset} onPress={reset} variant="danger" disabled={busy} />
      {error && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{error}</Text>}
    </Card>
  );
}

const styles = StyleSheet.create({
  heading: { color: theme.colors.text, fontSize: 16, fontWeight: '700' },
  notice: { color: theme.colors.muted, lineHeight: 21 },
  error: { color: theme.colors.danger },
});
