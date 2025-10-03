# Timestamped Copy VS Code 拡張機能 要件定義書

## 1. ドキュメント情報
- 文書名: Timestamped Copy VS Code 拡張機能 要件定義書
- バージョン: 0.9 (MVP 要件確定ドラフト)
- 作成日: 2025-10-03
- 作成者: （未定）
- 対象バージョン: MVP (v1.0)
- 想定読者: プロダクトオーナー / 開発者 / テスター / ドキュメント担当

### 1.1 改訂履歴
|版|日付|変更概要|担当|
|--|----|--------|----|
|0.9|2025-10-03|初稿（ヒアリング内容整備）|—|

---
## 2. 背景・目的
選択テキストをコピーする際に取得日時（タイムスタンプ）を自動付与し、貼り付け先（チャット、Issue、ドキュメント等）で「いつ取得した情報か」を即座に共有できるようにする。

効果:
- 監査性・再現調査の容易化（ログ／エラーメッセージ等）
- 情報鮮度の明示によるコミュニケーション効率化
- 手動で時刻追記する作業負荷の削減

---
## 3. スコープ（MVP）
### 3.1 インスコープ
- VS Code コマンド経由で選択テキストへタイムスタンプ付与 → クリップボード書き込み
- 未選択時フォールバック（現在行 / プロンプト / 何もしない）
- フォーマット / タイムゾーン / ロケール / 付与位置 / 括弧種別 / 区切り文字の設定
- Quick Pick による一時フォーマット選択
- タイムスタンプのみコピー
- 成功/警告/失敗の通知

### 3.2 アウトオブスコープ（MVP）
- 自動監視（保存/選択変更トリガ）
- 複数選択を個別エントリへ分割
- 外部API連携（翻訳等）
- 画像/バイナリ処理
- 永続履歴保存

---
## 4. ターゲットユーザー
- 学生 / 教員
- 開発者 / SRE / サポート / 運用監視担当
- 時刻付き引用が業務・学習で役立つ全ユーザー

---
## 5. ユースケース（代表例）
|番号|フロー|期待価値|
|----|------|--------|
|UC-01|ログ断片をコピー→Slack投稿|取得時刻付きで後追い調査が簡便|
|UC-02|Issue へエラーメッセージ貼付|再現時刻を明示し分析効率向上|
|UC-03|授業質問に環境情報添付|質問タイミング明示で回答精度向上|
|UC-04|ミーティング中：時刻のみコピー|正確な議事録タイムマーカー生成|

---
## 6. 用語定義
|用語|定義|
|----|----|
|タイムスタンプ|現在日時を指定フォーマット・タイムゾーンで整形した文字列|
|フォールバック|選択テキスト不在時の代替入力手段|
|Quick Pick|VS Code の選択 UI コンポーネント|
|ロケール|日時言語表記に使用する国際化設定|

---
## 7. 機能要件
### 7.1 コマンド一覧
|コマンドID|名称|機能概要|
|----------|----|--------|
|timestampedCopy.copySelection|Copy with Timestamp|選択/フォールバック対象にタイムスタンプ付与しコピー|
|timestampedCopy.copySelectionWithFormat|Copy with Timestamp (Choose Format)|Quick Pick で一時フォーマット選択してコピー|
|timestampedCopy.copyNow|Copy Timestamp Only|タイムスタンプのみコピー|

### 7.2 対象テキスト決定ロジック
1. 選択範囲あり → その文字列
2. 無し → 設定 `fallbackTarget` に従う
   - `currentLine`: カーソル行
   - `prompt`: 入力プロンプトで取得
   - `none`: 中断（警告通知）

### 7.3 タイムスタンプ仕様
|項目|要件|
|----|----|
|時刻源|ローカル or 指定タイムゾーン (IANA) |
|既定フォーマット|`YYYY-MM-DD HH:mm`|
|サポート例|`YYYY-MM-DD HH:mm:ss`, `YYYY/MM/DD HH:mm`, `ISO8601`, `RFC3339`|
|ロケール|`auto`（既定） / 明示指定|
|付与位置|`prefix` / `suffix`|
|括弧|`square`(`[]`) / `round`(`()`) / `none`|
|区切り|任意（既定：半角スペース）|
|一時上書き|`copySelectionWithFormat` 実行時のみ設定非変更で適用|

### 7.4 出力例
```
[2025-10-02 14:03 JST] ここに本文
ここに本文 (2025-10-02 05:03 UTC)
```

### 7.5 通知
|種別|条件|例|
|----|----|--|
|成功|正常コピー|Copied with timestamp: 2025-10-02 14:03 JST (54 chars)|
|警告|対象無し & fallback=none|No selection.|
|失敗|クリップボード書込例外|Clipboard write failed (see logs)|

### 7.6 エラーハンドリング
- クリップボード失敗: 例外捕捉 → エラーメッセージ
- タイムゾーン無効: UTC フォールバック + 警告
- 無効フォーマット: 既定フォーマットへフォールバック

---
## 8. 設定項目（`contributes.configuration`）
|キー|型|既定|説明|
|----|--|----|----|
|timestampedCopy.format|string|`YYYY-MM-DD HH:mm`|日時フォーマット / ISO / RFC / custom:<pattern>|
|timestampedCopy.timezone|string|`local`|`local` / `UTC` / IANA TZ|
|timestampedCopy.locale|string|`auto`|`auto` or BCP47 (ja-JP 等)|
|timestampedCopy.position|string|`prefix`|`prefix` / `suffix`|
|timestampedCopy.brackets|string|`square`|`square` / `round` / `none`|
|timestampedCopy.separator|string|` `|タイムスタンプと本文の間文字列|
|timestampedCopy.fallbackTarget|string|`currentLine`|`currentLine` / `prompt` / `none`|
|timestampedCopy.quickFormats|string[]|`["YYYY-MM-DD HH:mm","YYYY/MM/DD HH:mm:ss","ISO8601"]`|Quick Pick 候補|

---
## 9. UI / UX 要件
|要素|要件|
|----|----|
|コマンドパレット|3 コマンドを表示|
|ショートカット|重複しない形でユーザー任意設定推奨|
|右クリックメニュー|選択時のみ "Copy with Timestamp"|
|Quick Pick|ラベル + サンプル例表示|
|直近フォーマット記憶|セッション内保持（設定不変更）|
|通知言語|英/日（nls ファイル）|

---
## 10. 非機能要件
|カテゴリ|要件|
|--------|----|
|パフォーマンス|処理 <10ms + クリップボード I/O|
|依存|外部 NPM 追加なし|
|テレメトリ|送信なし|
|セキュリティ|テキストを永続保存せず|
|プライバシー|ログに本文含めない|
|i18n|英語 / 日本語対応|
|可搬性|Win / macOS / Linux|
|アクセシビリティ|通知は簡潔で主要情報先頭|

---
## 11. 受け入れ基準（サンプル）
|ID|観点|合格条件|
|--|----|--------|
|AC-01|基本コピー|選択テキストに設定フォーマット＋TZ 付与|
|AC-02|フォールバック行|未選択 + currentLine で行文字列取得|
|AC-03|一時フォーマット|設定値非変更で出力のみ変更|
|AC-04|位置/括弧/区切り|設定変更が即反映|
|AC-05|タイムスタンプのみ|`copyNow` が本文無し出力|
|AC-06|失敗通知|クリップボード失敗時に通知|
|AC-07|ロケール auto|OS ロケールに沿った表記|

---
## 12. テスト観点
|カテゴリ|ケース例|
|--------|--------|
|タイムゾーン|local / UTC / Asia/Tokyo|
|フォーマット|既定 / 秒付き / ISO8601 / RFC3339|
|ロケール|auto / ja-JP / en-US|
|フォールバック|currentLine / prompt / none|
|マルチバイト|日本語・絵文字|
|複数行|改行含む選択保持|
|空行|空文字扱い判定|
|大量文字|>100KB パフォーマンス|
|失敗系|クリップボード例外モック|
|無効設定|フォーマット/TZ フォールバック|
|括弧 none|括弧除去動作|

---
## 13. 実装方針（概要）
- Intl.DateTimeFormat + シンプル置換 (YYYY, MM, DD, HH, mm, ss, TZ)
- タイムゾーン: Intl の timeZone オプション
- Quick Pick: 設定配列 + サンプルプレビュー生成
- 例外処理: try/catch → showErrorMessage
- nls: 英日キー分離

### 13.1 擬似コード
```ts
const cfg = vscode.workspace.getConfiguration('timestampedCopy');
const text = getSelectionOrFallback(cfg.fallbackTarget); // returns string or empty
if (!text) { warn('No selection.'); return; }
const ts = formatNow(cfg.format, cfg.timezone, cfg.locale); // Intl + tokens
const wrapped = wrap(ts, cfg.brackets); // [ts] / (ts) / ts
const output = cfg.position === 'prefix'
  ? `${wrapped}${cfg.separator}${text}`
  : `${text}${cfg.separator}${wrapped}`;
await vscode.env.clipboard.writeText(output);
info(`Copied with timestamp: ${ts} (${output.length} chars)`);
```

---
## 14. `package.json` 主要エントリ例
```jsonc
{
  "name": "timestamped-copy",
  "displayName": "Timestamped Copy",
  "activationEvents": [
    "onCommand:timestampedCopy.copySelection",
    "onCommand:timestampedCopy.copySelectionWithFormat",
    "onCommand:timestampedCopy.copyNow"
  ],
  "contributes": {
    "commands": [
      { "command": "timestampedCopy.copySelection", "title": "Copy with Timestamp" },
      { "command": "timestampedCopy.copySelectionWithFormat", "title": "Copy with Timestamp (Choose Format)" },
      { "command": "timestampedCopy.copyNow", "title": "Copy Timestamp Only" }
    ],
    "menus": {
      "editor/context": [
        { "command": "timestampedCopy.copySelection", "group": "navigation", "when": "editorHasSelection" }
      ]
    },
    "configuration": {
      "title": "Timestamped Copy",
      "properties": {
        "timestampedCopy.format": { "type": "string", "default": "YYYY-MM-DD HH:mm" },
        "timestampedCopy.timezone": { "type": "string", "default": "local" },
        "timestampedCopy.locale": { "type": "string", "default": "auto" },
        "timestampedCopy.position": { "type": "string", "enum": ["prefix","suffix"], "default": "prefix" },
        "timestampedCopy.brackets": { "type": "string", "enum": ["square","round","none"], "default": "square" },
        "timestampedCopy.separator": { "type": "string", "default": " " },
        "timestampedCopy.fallbackTarget": { "type": "string", "enum": ["currentLine","prompt","none"], "default": "currentLine" },
        "timestampedCopy.quickFormats": {
          "type": "array",
          "items": { "type": "string" },
          "default": ["YYYY-MM-DD HH:mm","YYYY/MM/DD HH:mm:ss","ISO8601"]
        }
      }
    }
  }
}
```

---
## 15. リスクと軽減策
|リスク|説明|軽減策|
|------|----|------|
|TZ 差異|環境による表記差異|UTC + 主要TZ テスト|
|無効TZ|ユーザー入力ミス|UTC フォールバック + 警告|
|曖昧フォーマット|仕様拡張要求|MVP トークン限定公開|
|大容量遅延|巨大ペースト|結合回数最小化 + 計測|
|ロケール差異|auto 期待不一致|ドキュメント明記|

---
## 16. 想定外要求への姿勢
- カスタムトークン拡張 / 相対時刻は v1.1 以降検討
- 履歴永続化はプライバシーポリシー検討後

---
## 17. 将来拡張（展望）
- 複数選択個別タイムスタンプ
- テンプレート `{ts} — {file}:{line} — {text}`
- 相対時刻併記
- 出力履歴 Quick Pick
- Issue/PR 用ハイパーリンク生成

---
## 18. 受入テスト計画（概要）
|フェーズ|目的|手段|
|--------|----|----|
|単体|時刻生成・整形|Mock Date + パラメータテスト|
|結合|コマンド～クリップボード|VS Code Extension Test Runner|
|UI|Quick Pick / 通知|手動確認 + スクショ|
|国際化|英日表示|環境ロケール切替|

---
## 19. 承認
|ロール|氏名|承認日|
|------|----|------|
|PO| | |
|Dev Lead| | |
|Test Lead| | |

---
（本書は MVP 実装着手前の要件確定ドラフトです）
