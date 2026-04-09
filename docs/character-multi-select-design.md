# キャラクター複数選択対応 設計書

## 目的

スタート画面のキャラクター選択を単一選択から複数選択へ変更し、選択されたキャラクターを同時にモーションブック内へ登場させる。

今回の仕様変更で満たす要件は次の 3 点である。

- 古代魚、モヤシの妖精、悪魔を複数選択できる
- 選択されたキャラクターはすべて同時に表示される
- 選択されたキャラクター同士はぶつからない

加えて、ユーザー要望として次も重視する。

- 各キャラクターの動きはできるだけ現状を維持する
- 選択なしも許可する

## この設計で重視すること

今回の変更では、機能追加よりも「今ある動きの質を崩さないこと」を優先する。

- `SegmentedFish` の遊泳感を維持する
- `BeanSproutFairy` の跳ね方を維持する
- `DevilPair` の漂う動きを維持する
- 既存の文字回避ロジックを大きく崩さずに拡張する
- 将来キャラクターが増えても、単一選択前提の分岐を増やしすぎない
- 新規キャラクター追加時の変更点を登録情報へ寄せる

## 非目標

今回の設計では、次は主目的にしない。

- キャラクターの見た目変更
- 文字配置アルゴリズムの全面刷新
- 設定保存形式の変更
- キャラクターごとの新規エフェクト追加

## 現行実装の整理

現行コードは、UI とランタイムの両方が単一選択を前提にしている。

### UI

- `index.html` のキャラクター選択は `input[type="radio"][name="character"]`
- `style.css` の選択状態スタイルも `radio:checked` 前提
- スタート前のプレビュー更新も単体カード前提

### ランタイム

- 選択状態は `selectedCharacter` という単一の文字列で保持している
- シーン側は `character` という単体インスタンスを持つ
- `createCharacter(type, panelLayout, bounds)` が単体キャラを返す
- `loop()` は `character.update()` / `character.emitParticles()` / `character.draw()` を直接呼ぶ
- 文字回避は `character.contains(...)` を使っている
- `buildPanel()` の `activeMetrics`、`estimateBlockedSlots()`、`getMotionBounds()` も単体キャラ前提

つまり現行実装は、表面上は `character` 抽象になっているが、実質的には「1 体だけ存在するキャラクター」を扱う構造である。

## 結論

今回の仕様変更では、キャラクター個別クラスの動作ロジックをできるだけそのまま残し、その上に複数体管理レイヤーを追加する。

採用方針は次の通り。

- UI は `radio` から `checkbox` へ変更する
- 状態は `selectedCharacterIds: string[]` で保持する
- ランタイムの主語を単体 `character` から `characterGroup` へ置き換える
- `characterGroup` は既存の `update` / `draw` / `contains` / `emitParticles` 契約を引き継ぐ
- キャラクター同士の非衝突は「共有空間 + 保守的な衝突代理形状 + 更新後の分離補正」で保証する
- 選択数に応じてキャラクターをわずかに縮小し、衝突解決の余白を確保する
- 選択なしは `NullCharacterGroup` で扱う

この方針なら、レーン固定や画面分割のような大きな行動制限を避けつつ、各キャラクターの現状の動き方を比較的保ちやすい。

## 採用しない案

### 1. 画面を固定レーンに分割する案

これは非衝突を最も簡単に保証できる。

ただし次の問題がある。

- 魚の遊泳範囲が急に狭くなる
- 妖精の跳躍先が不自然に制限される
- 悪魔の漂い方が「閉じ込められた」印象になる
- 選択組み合わせごとに見え方が大きく変わる

今回の「できるだけ現状維持」という要件に対して、制約が強すぎるため採用しない。

### 2. 完全に自由移動のまま衝突を無視する案

これは実装が最小だが、要件の「ぶつからない」を満たせないため採用しない。

## UI 仕様

### 基本仕様

- キャラクター選択 UI は 3 つのチェックボックスへ変更する
- 選択順に意味は持たせず、内部では安定順序で扱う
- 選択なしを許可する

安定順序は次とする。

1. `fish`
2. `sprout`
3. `devil`

### 初期状態

初期状態は、現行の開始体験を極力維持するため `fish` のみ選択済みとする。

ただし、ユーザーが手動で全解除することは可能にする。

### 見た目

- 選択済みカードは現行と同様に枠線と背景色で強調する
- `radio:checked` を前提にした CSS は `checkbox:checked` へ置き換える
- フォーカスリングの見た目は現行のまま維持する

### スタート前プレビュー

開始前の UI は現行どおり「カードごとの個別プレビュー」を維持する。ここでのプレビューは、複数選択結果を 1 枚のキャンバスへ合成表示するものではない。

- 各カードは常にそのキャラクター単体の静的プレビューを表示する
- 複数選択時も、全選択カードが同時に強調表示されるだけで、カード内の描画内容は変えない
- 開始前には複数キャラクターの合成レイアウトやアニメーション再生は持ち込まない

### アクセシビリティ

- `label` 包含構造は現行を維持する
- キーボード操作で個別にオン・オフできる
- 選択数に関わらず `start` ボタンの有効条件は変えない

## ランタイム設計

### 状態の持ち方

単一値の `selectedCharacter` は廃止し、次へ置き換える。

```js
let selectedCharacterIds = ['fish'];
let characterGroup = null;
```

補助関数は次を追加する。

```js
function getSelectedCharacterIds() {
  return CHARACTER_ORDER.filter((id) => {
    const input = document.querySelector(`input[name="character"][value="${id}"]`);
    return Boolean(input?.checked);
  });
}
```

ここで `CHARACTER_ORDER` は `['fish', 'sprout', 'devil']` とする。

### `CharacterRegistry` の導入

保守性のため、`fish` / `sprout` / `devil` という文字列分岐を `main.js` 全体へ散らさず、キャラクター定義は 1 か所へ集約する。

概念上の登録情報は次とする。

```js
const CHARACTER_REGISTRY = {
  fish: {
    order: 0,
    createBaseMetrics: createFishMetrics,
    scaleMetrics: scaleFishMetrics,
    createInstance: (metrics, bounds) => new SegmentedFish(metrics, bounds),
    drawPreview: drawFishPreview,
  },
  sprout: {
    order: 1,
    createBaseMetrics: createSproutMetrics,
    scaleMetrics: scaleSproutMetrics,
    createInstance: (metrics, bounds) => new BeanSproutFairy(metrics, bounds),
    drawPreview: drawSproutPreview,
  },
  devil: {
    order: 2,
    createBaseMetrics: createDevilMetrics,
    scaleMetrics: scaleDevilMetrics,
    createInstance: (metrics, bounds) => new DevilPair(metrics, bounds),
    drawPreview: drawDevilPreview,
  },
};
```

この登録情報から次を派生させる。

- `CHARACTER_ORDER`
- `buildPanel()` 内の base metrics 生成
- `createCharacterGroup()` のインスタンス生成
- スタート前カードのプレビュー描画

これにより、4 体目追加時の主な変更点は「クラス追加」と「registry への 1 エントリ追加」に寄せられる。

### `CharacterGroup` の導入

既存ループを大きく壊さないため、複数体管理は `CharacterGroup` が引き受ける。

```js
const CharacterRuntimeContract = {
  update(dt, timestamp) {},
  draw(ctx) {},
  emitParticles(particleSystem, dt) {},
  contains(x, y, padding = 0) {
    return false;
  },
  estimateBlockedSlots(cellWidth, lineHeight, padding) {
    return 0;
  },
  getMotionInsets() {
    return { left: 0, right: 0, top: 0, bottom: 0 };
  },
};
```

#### `CharacterGroup` の責務

- 選択されたキャラクターの生成
- 選択数に応じた縮尺決定
- 各キャラクターの更新実行
- キャラクター同士の衝突判定
- 更新後の分離補正
- `contains()` の論理和
- `emitParticles()` の中継
- 描画順の管理
- 文字量見積もり用の `estimateBlockedSlots()` 集約
- 動作領域見積もり用の `getMotionInsets()` 集約

#### `NullCharacterGroup`

選択なしを安全に扱うため、何もしない実装を持つ。

```js
class NullCharacterGroup {
  update() {}
  draw() {}
  emitParticles() {}
  contains() { return false; }
  estimateBlockedSlots() { return 0; }
  getMotionInsets() { return { left: 0, right: 0, top: 0, bottom: 0 }; }
}
```

これにより `null` ガードのために描画や更新が止まる問題を避ける。

### メトリクス責務の分離

`buildPanel()` はレイアウト算出と基準メトリクス生成だけを担い、選択数に応じたスケール適用は行わない。スケール適用の責務は `createCharacterGroup()` 側へ寄せる。

- `buildPanel()` は `baseMetricsById` を生成し、registry に登録された各キャラクターの基準値を 1 回だけ作る
- `activeMetrics` は廃止し、文字量見積もりと可動域計算は `characterGroup` 経由へ寄せる
- `createScaledMetrics()` は基準メトリクスから個体別の scaled metrics を作る唯一の場所にする
- scaled metrics は元メトリクスと同じく `estimateBlockedSlots()` と `getMotionInsets()` を必ず提供する

### キャラクター生成方針

既存の `createCharacter(type, panelLayout, bounds)` は単体生成として残しつつ、呼び出し側を `createCharacterGroup(selectedIds, panelLayout, bounds)` へ置き換える。

概念上は次の構造にする。

```js
function createScaledMetrics(id, baseMetrics, scale) {
  const definition = CHARACTER_REGISTRY[id];
  return scale === 1 ? baseMetrics : definition.scaleMetrics(baseMetrics, scale);
}

function createCharacterGroup(selectedIds, panelLayout, bounds) {
  if (!selectedIds.length) {
    return new NullCharacterGroup();
  }

  const scale = getSelectionScale(selectedIds.length, panelLayout);
  const entries = selectedIds.map((id) => {
    const definition = CHARACTER_REGISTRY[id];
    const baseMetrics = panelLayout.baseMetricsById[id];
    const scaledMetrics = createScaledMetrics(id, baseMetrics, scale);
    const instance = definition.createInstance(scaledMetrics, bounds);

    return { id, metrics: scaledMetrics, instance };
  });

  return new CharacterGroup(entries, bounds);
}
```

ここでの責務は次で固定する。

- `CharacterRegistry` はキャラクター固有の factory と order を持つ
- `buildPanel()` は registry を走査して base metrics を用意するだけ
- `createScaledMetrics()` は base metrics のスケーリングとメソッド整合を担う
- `createCharacterGroup()` は registry を使って渡された metrics から単体インスタンスを生成するだけ

これで「スケール適用はどこが担うか」を `createCharacterGroup()` 側へ明確に寄せられる。

### 動きを維持するための方針

今回の最重要方針は、各キャラクターの既存アルゴリズムを大きく書き換えないことにある。

そのため、次を原則にする。

- 魚の `pickTarget()`、遊泳、履歴、体節更新の流れは維持する
- 妖精の `startHop()`、放物線的な hop、着地と発射演出は維持する
- 悪魔の `pickTarget()`、漂い、揺れ、呼吸表現は維持する
- 既存の `update(dt, timestamp)` は各クラス内の主処理として残す
- 複数体対応で必要な変更は「周辺フックの追加」に留める

言い換えると、各クラスを協調制御対応にするが、運動そのものは現在の式をなるべく変えない。

## 非衝突設計

### 基本方針

非衝突は、各キャラクターが同じ可動領域を共有したまま実現する。

実装上は次の 2 段構えにする。

1. 各キャラクターに保守的な衝突代理形状を持たせる
2. 更新後に `CharacterGroup` が重なりを検出し、最小限の分離補正を掛ける

これにより、動きの自由度は維持しつつ、最終表示では重ならない状態へ収束させる。

### 衝突代理形状

描画輪郭そのものをそのまま衝突判定に使うと実装コストが高い。

そのため、複数体制御では「文字回避用の `contains()`」とは別に、キャラクター同士の衝突だけに使う保守的な代理形状を導入する。

追加契約は次とする。

```js
const CharacterCollisionContract = {
  getCollisionNodes() {
    return [];
  },
  applyExternalDisplacement(dx, dy) {},
  requestRetargetAwayFrom(point) {},
};
```

#### 代理形状の設計

#### 魚

- 体軸に沿った複数円で近似する
- 候補は頭部、中腹、尾側の 3 から 4 点
- 半径は各体節の `halfWidth` と `segmentSpacing` から求める

これなら、現在の `segments` をそのまま再利用できる。

#### モヤシの妖精

- 頭部豆
- 胴体中央
- 下半身

の 2 から 3 円で近似する。

跳躍中の姿勢変化はあるが、保守的な円で包めば十分扱える。

#### 悪魔

- 左頭部
- 右頭部
- 下半身中央

の 3 円で近似する。

悪魔は横幅が広いため、1 円だけで近似すると空振りが大きすぎる。3 円に分けた方が現状の漂い方を殺しにくい。

### 更新シーケンス

`CharacterGroup.update()` は次の順で動かす。

1. 各キャラクターの元の `update(dt, timestamp)` を通常通り実行する
2. 各キャラクターの `getCollisionNodes()` を収集する
3. ペアごとの重なりを検出する
4. 重なりがあれば、重なり深さに応じて双方を押し戻す
5. 押し戻し量が大きいペアは `requestRetargetAwayFrom()` で進行先を更新する
6. 補正後の位置が範囲外ならクランプする

#### 分離補正の原則

- 1 フレームの反復回数は最大 4 回とする。今回の最大同時表示は 3 体で、衝突ペアは最大 3 通りのため、3 回で補正伝播を一巡し、4 回目を三つ巴の余裕に使う
- 片方だけを大きく動かさず、原則は半分ずつ押し戻す
- 押し戻し先は現在の共有 `bounds` の内側に丸める
- 4 回後も閾値以上の重なりが残る場合は、そのフレームでの追加押し戻しを打ち切り、後順位側を優先して再ターゲットさせて次フレームで解消する

安定順序は `fish -> sprout -> devil` とし、同一条件では後ろのキャラクターを優先して進路変更させる。

### 既存クラスへ入れる最小変更

各キャラクタークラスに必要な変更は、次の最小セットに留める。

### `SegmentedFish`

- `getCollisionNodes()`
- `applyExternalDisplacement(dx, dy)`
- `requestRetargetAwayFrom(point)`

`applyExternalDisplacement()` では、`x` / `y` だけでなく `history` も同じ量だけ平行移動する。これで体節形状を壊さない。

### `BeanSproutFairy`

- `getCollisionNodes()`
- `applyExternalDisplacement(dx, dy)`
- `requestRetargetAwayFrom(point)`

`applyExternalDisplacement()` では、`x` / `y` に加えて `hopStartX/Y`、`hopEndX/Y`、`targetX/Y` も同じだけ平行移動する。これで hop 途中の軌道を急に壊さない。

### `DevilPair`

- `getCollisionNodes()`
- `applyExternalDisplacement(dx, dy)`
- `requestRetargetAwayFrom(point)`

`CharacterGroup` からは `DevilPair` だけを操作し、内部の `DevilWanderer` を直接触らない。`DevilPair` に上記 3 メソッドを追加し、その内部で `this.anchor` へ委譲する。

- `applyExternalDisplacement()` は `anchor.x/y` と `anchor.targetX/Y` を同量だけ平行移動する
- `requestRetargetAwayFrom()` は `DevilPair` から `DevilWanderer` の再ターゲット処理を呼ぶ
- 必要なら `DevilWanderer` 側に薄い helper を足すが、外部契約は `DevilPair` に閉じ込める

### 選択数に応じた縮尺

共有空間のまま非衝突を維持するには、選択数が増えた時に少しだけ縮尺を下げた方が安定する。

初期方針は次とする。

- 1 体: `1.00`
- 2 体: `0.92`
- 3 体: `0.84`

この縮小は見た目を大きく変えない範囲に留める。

実装では、必要なら次の式へ置き換えてよい。

```js
selectionScale = clamp(baseScaleByCount[count] * viewportFitScale, 0.76, 1);
```

ただし第 1 実装では、まず固定係数で十分である。

### 文字レイアウトとの関係

文字配置の正解判定は、これまで通り `contains()` を使う。

つまり、複数体対応後も次は維持する。

- 行ごとの blocked 判定は `contains()` ベース
- 文字の実配置は `buildBlockedRangesForRow()` を通す
- `getFlowTargets()` の主構造は維持する

変更点は、`contains()` の呼び先が単体キャラから `characterGroup` に変わることだけである。

```js
contains(x, y, padding) {
  return this.entries.some(({ instance }) => instance.contains(x, y, padding));
}
```

### `estimateBlockedSlots()` の扱い

現行は単一キャラの `activeMetrics` を基準に文字量を見積もっている。

複数体対応後は、`CharacterGroup` が各キャラクターの見積もりを集約する。

設計上は次のルールにする。

- 選択なし: `0`
- 1 体: 既存キャラと同じ見積もり
- 2 体以上: 各キャラの `estimateBlockedSlots()` を単純加算する
- ただし合計値は `slots.length - spareSlots - MIN_VISIBLE_CHARS` を上限に clamp し、文字量の下限は現行どおり維持する

ここで `MIN_VISIBLE_CHARS` は現行の `visibleTarget` 下限に合わせて `120` とする。単純加算はやや保守的だが、過少見積もりより安全である。3 体選択かつ狭い画面の最悪ケースでも、文字量はこの下限までしか減らさない。

### `getMotionInsets()` の扱い

`getMotionBounds()` は単一 `activeMetrics` 依存から `characterGroup.getMotionInsets()` 依存へ変える。

ルールは次。

- 各キャラクターの必要 inset を計算する
- グループとしては各辺の最大値を返す
- `CharacterGroup` 側で `metrics.motionInsets` 直参照のフォールバックは持たず、scaled metrics 生成時点で `getMotionInsets()` 契約をそろえる

```js
getMotionInsets() {
  const insetsList = this.entries.map((entry) => entry.metrics.getMotionInsets());
  return {
    left: Math.max(...insetsList.map((insets) => insets.left), 0),
    right: Math.max(...insetsList.map((insets) => insets.right), 0),
    top: Math.max(...insetsList.map((insets) => insets.top), 0),
    bottom: Math.max(...insetsList.map((insets) => insets.bottom), 0),
  };
}
```

これにより、最も大きい悪魔が選ばれていても他のキャラが端で欠けない。

### 選択なしの仕様

選択なしでは、モーションブックは「文字のみ表示」の状態として動作させる。

- 背景、紙、文字は通常通り描画する
- キャラクターは描画しない
- キャラクター由来のパーティクルは発生しない
- blocked slot は 0 扱いとする

この状態はエラーではなく、正規の表示モードとして扱う。

### 描画順

複数体同時表示時の描画順は固定する。

1. 古代魚
2. モヤシの妖精
3. 悪魔

理由は次の通り。

- 安定順序がある方が見た目のちらつきがない
- 悪魔は塊感が強いため最前面の方が自然
- 魚は輪郭が長いため奥にいても読み取りやすい

この順序は、衝突解決の優先順位ともそろえる。

## 実装対象ファイル

主な変更対象は次の通り。

- `index.html`
- `style.css`
- `main.js`
- `docs/character-multi-select-design.md`

第 1 実装では `CharacterGroup` / `NullCharacterGroup` / 関連 helper も `main.js` に置く。今回はモジュール分割を同時に進めず、既存の単一ファイル構成のまま差分を閉じることを優先する。

ただし設計上は、機能安定後に次の責務分割へ寄せる前提とする。

- `main.js`: DOM イベント、シーン再構築、レンダリングループ
- `characters/character-registry.js`: `CHARACTER_REGISTRY` と `CHARACTER_ORDER`
- `characters/character-group.js`: `CharacterGroup` / `NullCharacterGroup` / 衝突補正 helper
- `characters/segmented-fish.js`: `SegmentedFish`
- `characters/bean-sprout-fairy.js`: `BeanSproutFairy`
- `characters/devil-pair.js`: `DevilPair` と必要なら `DevilWanderer`

この分割により、UI 変更・複数体制御・個別キャラクター挙動の関心事を切り分ける。

## `main.js` の想定変更点

### 状態管理

- `selectedCharacter` を `selectedCharacterIds` へ変更
- `character` を `characterGroup` へ変更

### シーン構築

- `CharacterRegistry` を追加
- `buildPanel()` の単一 `activeMetrics` 依存を解消し、`baseMetricsById` を返す
- `createCharacterGroup()` を追加
- `createScaledMetrics()` を追加
- `rebuildScene()` で `characterGroup` を生成

### 更新ループ

- `character.update` を `characterGroup.update` へ変更
- `character.emitParticles` を `characterGroup.emitParticles` へ変更
- `character.draw` を `characterGroup.draw` へ変更

### 文字回避

- `character.contains` を `characterGroup.contains` へ変更
- `estimateBlockedSlots()` をグループ集約へ変更
- `getMotionBounds()` をグループ inset 集約へ変更

### 入力イベント

- `input[name="character"]` の `change` で選択配列を再取得する
- スタート時と戻る時の読取処理も配列化する
- プレビュー描画も `CharacterRegistry` の `drawPreview` から呼ぶ

## 受け入れ条件

- 3 種のキャラクターが複数同時選択できる
- どの組み合わせでも、選択したキャラクターがすべて表示される
- 全解除でも開始でき、文字だけ表示される
- 2 体以上選択時もキャラクター同士が重ならない
- 魚の遊泳、妖精の hop、悪魔の漂いの基本印象が現行から大きく変わらない
- 既存の文字回避は壊れない
- 狭い画面でもキャラクターが紙面外へ欠けない
- スタート前プレビューの見た目が破綻しない

## 検証観点

最低限、次の組み合わせを確認する。

- 0 体
- 魚のみ
- 妖精のみ
- 悪魔のみ
- 魚 + 妖精
- 魚 + 悪魔
- 妖精 + 悪魔
- 魚 + 妖精 + 悪魔

見るべき点は次。

- キャラクター同士の接触が発生しないか
- 衝突回避時に不自然なワープが起きないか
- 魚の体節が補正後に崩れないか
- hop 途中の妖精が補正で不自然に折れないか
- 悪魔の漂いが壁打ちのようにならないか
- 文字の読順が崩れないか
- 選択なしで文字が全面表示されるか
- スタート前は選択されたカードだけが強調され、個別プレビュー表示が崩れないか

## リスク

- 共有空間での分離補正が強すぎると、見た目が「押し戻されている」印象になる
- 代理形状が大きすぎると、実際には離れていても避けすぎる
- 代理形状が小さすぎると、見た目上の接触が残る
- 選択数 3 で狭い画面の場合、縮尺係数の調整が必要になる
- `estimateBlockedSlots()` を単純加算にすると、文字数がやや控えめになる可能性がある

## 段階的な実装順

実装は次の順が安全である。

### 第 1 段階

- UI を複数選択対応へ変更する
- `selectedCharacterIds` と `NullCharacterGroup` を導入する
- `CharacterGroup` を追加して描画・更新・文字回避を通す

この段階では、まず複数表示と選択なしを成立させる。

### 第 2 段階

- 各キャラクターへ `getCollisionNodes()` を追加する
- `CharacterGroup.update()` に衝突判定と分離補正を追加する
- 選択数に応じた縮尺調整を入れる

この段階で「ぶつからない」を満たす。

### 第 3 段階

- 係数調整
- 代理形状の微調整
- 狭い画面でのチューニング

この段階で見た目の違和感を詰める。

### 第 4 段階

- `CharacterRegistry` ベースの分岐整理を完了する
- `CharacterGroup` と各キャラクター実装を `main.js` から分離する
- 衝突補正と metrics helper を純粋関数として切り出す

この段階で拡張性と保守性を詰める。

## 最終判断

今回の仕様変更は、既存の 3 キャラクターを大改造せずに実現可能である。

鍵になるのは、単体キャラのロジックを保ったまま、その外側に `CharacterGroup` を置くことにある。

この設計なら、

- UI は複数選択へ移行できる
- 選択なしも自然に扱える
- 文字回避ロジックは既存構造を活かせる
- キャラクター同士の非衝突を追加できる
- それぞれの現状の動きも比較的維持しやすい

現状維持を重視するなら、固定レーンではなく、この「共有空間 + 軽い縮小 + 更新後分離補正」の設計が最も妥当である。
