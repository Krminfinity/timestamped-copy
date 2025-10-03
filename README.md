# Timestamped Copy

VS Codeで選択テキストや現在行にタイムスタンプ（日時）を付与してクリップボードへコピーできる拡張です。

## 主な用途
- ログやエラーメッセージの監査・再現性向上
- Issueやチャットで「いつの情報か」を明示
- 質問・議事録・抜粋メモの時刻付与

## 主な機能
- 選択テキスト＋時刻をコピー（コマンド/右クリック）
- 未選択時は現在行・プロンプト入力・何もしない（設定可）
- タイムスタンプの書式・タイムゾーン・位置・括弧・区切りカスタム
- その場で書式を選んでコピー（Quick Pick）
- 時刻のみコピー
- 英日メッセージ対応

## コマンド一覧
- `Copy with Timestamp` … 選択/現在行＋時刻をコピー
- `Copy with Timestamp (Choose Format)` … 書式選択してコピー
- `Copy Timestamp Only` … 時刻のみコピー

## 設定例
```jsonc
{
  "timestampedCopy.format": "YYYY-MM-DD HH:mm:ss",
  "timestampedCopy.timezone": "UTC",
  "timestampedCopy.position": "suffix",
  "timestampedCopy.brackets": "round",
  "timestampedCopy.separator": " - ",
  "timestampedCopy.fallbackTarget": "prompt",
  "timestampedCopy.quickFormats": ["YYYY-MM-DD HH:mm","YYYY/MM/DD HH:mm:ss","ISO8601"]
}
```

## インストール・使い方
1. コマンドパレット（Ctrl+Shift+P）で「Copy with Timestamp」等を実行
2. 右クリックメニュー（選択時）からも利用可能
3. 設定で書式や動作をカスタマイズ

## ライセンス
MIT
