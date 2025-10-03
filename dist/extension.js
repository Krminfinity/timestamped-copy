"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
async function copyNowOnly() {
    const cfg = vscode.workspace.getConfiguration('timestampedCopy');
    const ts = wrap(formatNowBy(cfg), cfg);
    await vscode.env.clipboard.writeText(ts);
    vscode.window.showInformationMessage('Timestamp copied');
}
async function copyWithChosenFormat(ed) {
    const cfg = vscode.workspace.getConfiguration('timestampedCopy');
    const list = cfg.get('quickFormats', []) || [];
    const picked = await vscode.window.showQuickPick(list, { placeHolder: 'Timestamp format' });
    if (!picked)
        return;
    const text = await getTargetText(ed);
    if (!text)
        return vscode.window.showInformationMessage('対象テキストなし');
    // 一時的にformatのみpicked値で上書き
    const tempCfg = { ...cfg, get: (k) => k === 'format' ? picked : cfg.get(k) };
    const ts = wrap(formatNowBy(tempCfg), cfg);
    const sep = cfg.get('separator', ' ');
    const pos = cfg.get('position', 'prefix');
    const out = pos === 'prefix' ? `${ts}${sep}${text}` : `${text}${sep}${ts}`;
    await vscode.env.clipboard.writeText(out);
    vscode.window.showInformationMessage(`Copied with format: ${picked}`);
}
function formatNowBy(cfg) {
    const d = new Date();
    const tz = cfg.get('timezone', 'local');
    // MVP: local/UTC のみ
    const date = tz === 'UTC' ? new Date(d.toISOString()) : d;
    const fmt = cfg.get('format', 'YYYY-MM-DD HH:mm');
    const pad = (n) => String(n).padStart(2, '0');
    const YYYY = date.getUTCFullYear?.() ?? date.getFullYear();
    const MM = pad((tz === 'UTC' ? date.getUTCMonth() : date.getMonth()) + 1);
    const DD = pad((tz === 'UTC' ? date.getUTCDate() : date.getDate()));
    const hh = pad((tz === 'UTC' ? date.getUTCHours() : date.getHours()));
    const mm = pad((tz === 'UTC' ? date.getUTCMinutes() : date.getMinutes()));
    const ss = pad((tz === 'UTC' ? date.getUTCSeconds() : date.getSeconds()));
    return fmt
        .replace('YYYY', String(YYYY))
        .replace('MM', MM)
        .replace('DD', DD)
        .replace('HH', hh)
        .replace('mm', mm)
        .replace('ss', ss);
}
function wrap(ts, cfg) {
    const b = cfg.get('brackets', 'square');
    if (b === 'square')
        return `[${ts}]`;
    if (b === 'round')
        return `(${ts})`;
    return ts;
}
async function getTargetText(ed) {
    const cfg = vscode.workspace.getConfiguration('timestampedCopy');
    const fb = cfg.get('fallbackTarget', 'currentLine');
    const sel = ed.document.getText(ed.selection);
    if (sel)
        return sel;
    if (fb === 'currentLine')
        return ed.document.lineAt(ed.selection.active.line).text;
    if (fb === 'prompt')
        return await vscode.window.showInputBox({ prompt: 'テキストを入力' }) || '';
    return '';
}
const vscode = __importStar(require("vscode"));
function activate(ctx) {
    ctx.subscriptions.push(vscode.commands.registerCommand('timestampedCopy.copySelection', async () => {
        const ed = vscode.window.activeTextEditor;
        if (!ed)
            return;
        const text = await getTargetText(ed);
        if (!text)
            return vscode.window.showInformationMessage('選択してください');
        const cfg = vscode.workspace.getConfiguration('timestampedCopy');
        const ts = wrap(formatNowBy(cfg), cfg);
        const sep = cfg.get('separator', ' ');
        const pos = cfg.get('position', 'prefix');
        const out = pos === 'prefix' ? `${ts}${sep}${text}` : `${text}${sep}${ts}`;
        await vscode.env.clipboard.writeText(out);
        vscode.window.showInformationMessage(`Copied with timestamp`);
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('timestampedCopy.copySelectionWithFormat', async () => {
        const ed = vscode.window.activeTextEditor;
        if (!ed)
            return;
        await copyWithChosenFormat(ed);
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('timestampedCopy.copyNow', async () => {
        await copyNowOnly();
    }));
}
function deactivate() { }
