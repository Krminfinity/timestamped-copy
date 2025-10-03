# Timestamped Copy 開発ステップまとめ

---
## 0) 準備（共通・一度だけ）

1. 空フォルダ作成 → `npm init -y`
2. 依存導入：
   ```sh
   npm i -D typescript @types/vscode @vscode/vsce
   ```
3. `tsconfig.json` 作成（`outDir: dist`, `rootDir: src`）
4. ひな型：`src/extension.ts`・`package.json` を用意
   - `activationEvents` にコマンド追加
   - `main: "./dist/extension.js"`

---
## 機能A：選択＋時刻をコピー（MVPコア）

### A-1. コマンド登録
`package.json` の例：
```jsonc
{
  "contributes": {
    "commands": [
      { "command": "timestampedCopy.copySelection", "title": "Copy with Timestamp" }
    ],
    "menus": {
      "editor/context": [
        { "command": "timestampedCopy.copySelection", "when": "editorHasSelection", "group": "navigation" }
      ]
    }
  },
  "activationEvents": ["onCommand:timestampedCopy.copySelection"]
}
```

### A-2. 最小実装（選択 → [時刻] + 本文）
`src/extension.ts` の例：
```ts
import * as vscode from 'vscode';
function formatNow(): string {
  const d = new Date();
  const pad = (n:number)=> String(n).padStart(2,'0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
export function activate(ctx: vscode.ExtensionContext) {
  ctx.subscriptions.push(vscode.commands.registerCommand(
    'timestampedCopy.copySelection', async () => {
      const ed = vscode.window.activeTextEditor;
      if (!ed) return;
      const sel = ed.document.getText(ed.selection);
      if (!sel) return vscode.window.showInformationMessage('選択してください');
      const ts = `[${formatNow()}]`;
      await vscode.env.clipboard.writeText(`${ts} ${sel}`);
      vscode.window.showInformationMessage(`Copied with timestamp`);
    }
  ));
}
export function deactivate() {}
```

---
## 機能B：未選択時のフォールバック

### B-1. 設定スキーマ
`package.json` の例：
```jsonc
{
  "type":"object",
  "title":"Timestamped Copy",
  "properties": {
    "timestampedCopy.fallbackTarget": {
      "type":"string",
      "enum": ["currentLine","prompt","none"],
      "default": "currentLine",
      "description": "未選択時の対象"
    }
  }
}
```

### B-2. 実装追加
```ts
async function getTargetText(ed: vscode.TextEditor): Promise<string> {
  const cfg = vscode.workspace.getConfiguration('timestampedCopy');
  const fb = cfg.get<'currentLine'|'prompt'|'none'>('fallbackTarget','currentLine');
  const sel = ed.document.getText(ed.selection);
  if (sel) return sel;
  if (fb === 'currentLine') return ed.document.lineAt(ed.selection.active.line).text;
  if (fb === 'prompt') return await vscode.window.showInputBox({prompt:'テキストを入力'}) || '';
  return '';
}
```
（A-2 のコマンド内で `sel` 取得を `await getTargetText(ed)` に差し替え）

---
## 機能C：書式・タイムゾーン・位置・括弧などのカスタム

### C-1. 設定スキーマ拡張
```jsonc
"timestampedCopy.format": { "type":"string", "default":"YYYY-MM-DD HH:mm" },
"timestampedCopy.timezone": { "type":"string", "default":"local" },
"timestampedCopy.position": { "type":"string", "enum":["prefix","suffix"], "default":"prefix" },
"timestampedCopy.brackets": { "type":"string", "enum":["square","round","none"], "default":"square" },
"timestampedCopy.separator": { "type":"string", "default":" " }
```

### C-2. 実装（軽量フォーマッタ）
```ts
function formatNowBy(cfg: vscode.WorkspaceConfiguration): string {
  const d = new Date();
  const tz = cfg.get<string>('timezone','local');
  // MVP：local/UTC のみ（TZ指定はv1.1で拡張）
  const date = tz === 'UTC' ? new Date(d.toISOString()) : d;
  const fmt = cfg.get<string>('format','YYYY-MM-DD HH:mm');
  const pad = (n:number)=> String(n).padStart(2,'0');
  const YYYY = date.getUTCFullYear?.() ?? date.getFullYear();
  const MM = pad((tz==='UTC'?date.getUTCMonth():date.getMonth()) + 1);
  const DD = pad((tz==='UTC'?date.getUTCDate():date.getDate()));
  const hh = pad((tz==='UTC'?date.getUTCHours():date.getHours()));
  const mm = pad((tz==='UTC'?date.getUTCMinutes():date.getMinutes()));
  const ss = pad((tz==='UTC'?date.getUTCSeconds():date.getSeconds()));
  return fmt
    .replace('YYYY', String(YYYY))
    .replace('MM', MM)
    .replace('DD', DD)
    .replace('HH', hh)
    .replace('mm', mm)
    .replace('ss', ss);
}
function wrap(ts: string, cfg: vscode.WorkspaceConfiguration) {
  const b = cfg.get<'square'|'round'|'none'>('brackets','square');
  if (b==='square') return `[${ts}]`;
  if (b==='round')  return `(${ts})`;
  return ts;
}
```

### C-3. 出力組み立て
```ts
const cfg = vscode.workspace.getConfiguration('timestampedCopy');
const ts = wrap(formatNowBy(cfg), cfg);
const sep = cfg.get<string>('separator',' ');
const pos = cfg.get<'prefix'|'suffix'>('position','prefix');
const out = pos === 'prefix' ? `${ts}${sep}${text}` : `${text}${sep}${ts}`;
await vscode.env.clipboard.writeText(out);
```

---
## 機能D：その場で書式を選んでコピー

### D-1. クイックフォーマット候補
`package.json` の例：
```jsonc
"timestampedCopy.quickFormats": {
  "type":"array",
  "default": ["YYYY-MM-DD HH:mm","YYYY/MM/DD HH:mm:ss","YYYY-MM-DDTHH:mm:ssZ"],
  "description": "クイック選択で出す書式"
}
```

### D-2. コマンド追加
`package.json` の例：
```jsonc
{ "command":"timestampedCopy.copySelectionWithFormat", "title":"Copy with Timestamp (Choose Format)" }
```
実装例：
```ts
async function copyWithChosenFormat(ed: vscode.TextEditor) {
  const cfg = vscode.workspace.getConfiguration('timestampedCopy');
  const list = cfg.get<string[]>('quickFormats', []) || [];
  const picked = await vscode.window.showQuickPick(list, { placeHolder:'Timestamp format' });
  if (!picked) return;
  const text = await getTargetText(ed);
  if (!text) return vscode.window.showInformationMessage('対象テキストなし');
  const ts = wrap(formatNowBy({ ...cfg, get:(k:string)=> k==='format'?picked:cfg.get(k) } as any), cfg);
  const sep = cfg.get<string>('separator',' ');
  const pos = cfg.get<'prefix'|'suffix'>('position','prefix');
  const out = pos === 'prefix' ? `${ts}${sep}${text}` : `${text}${sep}${ts}`;
  await vscode.env.clipboard.writeText(out);
  vscode.window.showInformationMessage(`Copied with format: ${picked}`);
}
```

---
## 機能E：時刻だけコピー

### E-1. コマンド追加
`package.json` の例：
```jsonc
{ "command":"timestampedCopy.copyNow", "title":"Copy Timestamp Only" }
```
実装例：
```ts
async function copyNowOnly() {
  const cfg = vscode.workspace.getConfiguration('timestampedCopy');
  const ts = wrap(formatNowBy(cfg), cfg);
  await vscode.env.clipboard.writeText(ts);
  vscode.window.showInformationMessage('Timestamp copied');
}
```
（`activate` で `timestampedCopy.copyNow` を登録）

---
## 機能F：UX仕上げ（任意・軽量）

1. **ショートカット**：`keybindings.json` 例
   - `Copy with Timestamp` → `ctrl/cmd+alt+t`
2. **成功トーストの簡略表示**：`statusBarItem` に短秒表示
3. **英日メッセージ**：`package.nls.json` / `package.nls.ja.json`

---

## 機能G：テスト観点（手動でもOK）

- 未選択／`currentLine`／`prompt`／`none` の分岐
- `prefix/suffix`・括弧・区切りの反映
- `UTC/local` 差（例：JST との比較）
- 長文・改行・マルチバイト文字の選択
- クリップボード制限環境（リモート・WSL等）での通知
- Quick Pickで書式選択→一時的に反映されるか
- 設定変更（format, timezone, brackets, separator, position）が即反映されるか
- コマンドパレット・右クリックメニュー・ショートカットからの動作
- 失敗時（選択なし・クリップボード不可）で通知が出るか

---
## 機能H：ビルド & リリース

1. `npm run compile`（`"compile": "tsc -p ./"`）
2. F5 でデバッグ（Extension Development Host）
3. `npm i -g @vscode/vsce` → `vsce package` or `vsce publish`
