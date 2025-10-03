async function copyNowOnly() {
  const cfg = vscode.workspace.getConfiguration('timestampedCopy');
  const ts = wrap(formatNowBy(cfg), cfg);
  await vscode.env.clipboard.writeText(ts);
  vscode.window.showInformationMessage('Timestamp copied');
}
async function copyWithChosenFormat(ed: vscode.TextEditor) {
  const cfg = vscode.workspace.getConfiguration('timestampedCopy');
  const list = cfg.get<string[]>('quickFormats', []) || [];
  const picked = await vscode.window.showQuickPick(list, { placeHolder:'Timestamp format' });
  if (!picked) return;
  const text = await getTargetText(ed);
  if (!text) return vscode.window.showInformationMessage('対象テキストなし');
  // 一時的にformatのみpicked値で上書き
  const tempCfg = { ...cfg, get:(k:string)=> k==='format'?picked:cfg.get(k) } as vscode.WorkspaceConfiguration;
  const ts = wrap(formatNowBy(tempCfg), cfg);
  const sep = cfg.get<string>('separator',' ');
  const pos = cfg.get<'prefix'|'suffix'>('position','prefix');
  const out = pos === 'prefix' ? `${ts}${sep}${text}` : `${text}${sep}${ts}`;
  await vscode.env.clipboard.writeText(out);
  vscode.window.showInformationMessage(`Copied with format: ${picked}`);
}
function formatNowBy(cfg: vscode.WorkspaceConfiguration): string {
  const d = new Date();
  const tz = cfg.get<string>('timezone','local');
  // MVP: local/UTC のみ
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
async function getTargetText(ed: vscode.TextEditor): Promise<string> {
  const cfg = vscode.workspace.getConfiguration('timestampedCopy');
  const fb = cfg.get<'currentLine'|'prompt'|'none'>('fallbackTarget','currentLine');
  const sel = ed.document.getText(ed.selection);
  if (sel) return sel;
  if (fb === 'currentLine') return ed.document.lineAt(ed.selection.active.line).text;
  if (fb === 'prompt') return await vscode.window.showInputBox({prompt:'テキストを入力'}) || '';
  return '';
}
import * as vscode from 'vscode';

export function activate(ctx: vscode.ExtensionContext) {
  ctx.subscriptions.push(vscode.commands.registerCommand(
    'timestampedCopy.copySelection', async () => {
      const ed = vscode.window.activeTextEditor;
      if (!ed) return;
      const text = await getTargetText(ed);
      if (!text) return vscode.window.showInformationMessage('選択してください');
      const cfg = vscode.workspace.getConfiguration('timestampedCopy');
      const ts = wrap(formatNowBy(cfg), cfg);
      const sep = cfg.get<string>('separator',' ');
      const pos = cfg.get<'prefix'|'suffix'>('position','prefix');
      const out = pos === 'prefix' ? `${ts}${sep}${text}` : `${text}${sep}${ts}`;
      await vscode.env.clipboard.writeText(out);
      vscode.window.showInformationMessage(`Copied with timestamp`);
    }
  ));
  ctx.subscriptions.push(vscode.commands.registerCommand(
    'timestampedCopy.copySelectionWithFormat', async () => {
      const ed = vscode.window.activeTextEditor;
      if (!ed) return;
      await copyWithChosenFormat(ed);
    }
  ));
  ctx.subscriptions.push(vscode.commands.registerCommand(
    'timestampedCopy.copyNow', async () => {
      await copyNowOnly();
    }
  ));
}

export function deactivate() {}
