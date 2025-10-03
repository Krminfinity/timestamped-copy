import assert from 'assert';

// テスト対象関数（本来はimport、ここではダミー実装例）
function formatNowBy(cfg: any, date: Date = new Date(2025, 9, 2, 14, 3, 5)) {
  const tz = cfg.timezone || 'local';
  const fmt = cfg.format || 'YYYY-MM-DD HH:mm';
  const pad = (n:number)=> String(n).padStart(2,'0');
  const YYYY = date.getFullYear();
  const MM = pad(date.getMonth()+1);
  const DD = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return fmt
    .replace('YYYY', String(YYYY))
    .replace('MM', MM)
    .replace('DD', DD)
    .replace('HH', hh)
    .replace('mm', mm)
    .replace('ss', ss);
}
function wrap(ts: string, cfg: any) {
  if (cfg.brackets === 'square') return `[${ts}]`;
  if (cfg.brackets === 'round')  return `(${ts})`;
  return ts;
}

// テストケース
const baseCfg = {
  format: 'YYYY-MM-DD HH:mm',
  timezone: 'local',
  brackets: 'square',
  separator: ' ',
  position: 'prefix'
};

describe('formatNowBy', () => {
  it('基本フォーマット', () => {
    const ts = formatNowBy(baseCfg);
    assert.strictEqual(ts, '2025-10-02 14:03');
  });
  it('秒付き', () => {
    const ts = formatNowBy({ ...baseCfg, format: 'YYYY-MM-DD HH:mm:ss' });
    assert.strictEqual(ts, '2025-10-02 14:03:05');
  });
  it('ISO8601', () => {
    const ts = formatNowBy({ ...baseCfg, format: 'YYYY-MM-DDTHH:mm:ssZ' });
    assert.strictEqual(ts, '2025-10-02T14:03:05Z');
  });
});

describe('wrap', () => {
  it('角括弧', () => {
    assert.strictEqual(wrap('2025-10-02 14:03', { brackets: 'square' }), '[2025-10-02 14:03]');
  });
  it('丸括弧', () => {
    assert.strictEqual(wrap('2025-10-02 14:03', { brackets: 'round' }), '(2025-10-02 14:03)');
  });
  it('括弧なし', () => {
    assert.strictEqual(wrap('2025-10-02 14:03', { brackets: 'none' }), '2025-10-02 14:03');
  });
});

describe('出力組み立て', () => {
  it('prefix', () => {
    const ts = '[2025-10-02 14:03]';
    const text = '本文';
    const sep = ' ';
    const out = baseCfg.position === 'prefix' ? `${ts}${sep}${text}` : `${text}${sep}${ts}`;
    assert.strictEqual(out, '[2025-10-02 14:03] 本文');
  });
  it('suffix', () => {
    const ts = '[2025-10-02 14:03]';
    const text = '本文';
    const sep = ' ';
  const position: string = 'suffix';
  const out = position === 'prefix' ? `${ts}${sep}${text}` : `${text}${sep}${ts}`;
    assert.strictEqual(out, '本文 [2025-10-02 14:03]');
  });
});
