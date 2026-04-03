# 生き物と文字の距離を等間隔にする修正案（更新版 2）

## 目的

生き物の輪郭と文字の間にできる余白を、見た目としてできるだけ等間隔にそろえる。

この修正案は魚専用ではなく、現在の `BeanSproutFairy` を含む既存キャラと、将来的な別シルエットにも流用できる形を目指す。

## この版で重視すること

今回は、見た目改善だけでなく、次も同時に満たす方針を取る。

- 既存コードを大きく崩さない
- 第 1 段階の実装コストを上げすぎない
- 将来のキャラ追加時に修正箇所を増やさない
- 役割分担を明確にして保守しやすくする

## 現行実装の整理

現行コードでは、文字配置はすでに `fish` 直結ではなく `character` 抽象で動いている。

- `SegmentedFish` と `BeanSproutFairy` はどちらも `update()` / `draw()` / `contains()` を持つ
- レイアウト側は `character.contains(slot.x, slot.y, panel.textClearance)` を使って文字スロットを除外している
- `getFlowTargets()` は `updateTextFlow()` の再計算時にだけ走る
- `distributeRowSlots()` は span ごとの比例配分と、先頭左寄せ / 最後右寄せで文字位置を決めている
- 空行は `textLines` 上で保持され、表示行を 1 行消費する

問題の本質は、魚依存そのものではなく次の点にある。

- `contains()` が真偽値しか返さないため、輪郭からの距離差を扱えない
- span の選び方が輪郭境界ではなく左右端基準なので、輪郭近傍に不自然な空きが残る
- 改行や空行の保持は現行コードにあるが、提案として明文化されていない
- `estimateBlockedSlots()` と `getMotionBounds()` にも形状依存が残っている

## 結論

第 1 段階では、`sampleSignedDistance()` を必須にしない。

先にやるべきなのは、既存の `contains()` を再利用して、行ごとの禁止区間を安定して作ること。

具体的には:

- 新しい実行時基底クラスは導入しない
- 第 1 段階では `character.contains()` を使った共通ヘルパーで禁止区間を作る
- 文字は「障害物に接する境界側」から採用スロットを選ぶ
- ただし最終的な文字順は必ず `x` 昇順に保つ
- 明示改行と空行の仕様は現行動作を維持する
- `sampleSignedDistance()` は第 2 段階以降の任意拡張に後ろ倒しする

これが、見た目改善とメンテナンス性の両立として最も現実的。

## メンテナンス方針

この修正では、保守性のために次を原則にする。

### 1. 実行時の契約面は最小限に保つ

JavaScript では interface 強制がないため、第 1 段階で `LayoutObstacleLike` のような基底クラスを実コードに追加する必要はない。

今回は、ドキュメント上の「契約」としてだけ定義し、実コードでは既存の `SegmentedFish` / `BeanSproutFairy` をそのまま使う。

### 2. 共通ロジックはレイアウト側に寄せる

禁止区間の計算を最初から各キャラに実装すると、形状が増えるたびに重複実装が増える。

そのため第 1 段階では:

- `contains()` を使った共通ヘルパーをレイアウト側に置く
- キャラ固有の最適化は、必要になってから optional override として追加する

### 3. 単位の違う値を混ぜない

名前と返り値の単位は一致させる。

- スロット数を返すなら `estimateBlockedSlots()`
- 面積を返すなら `estimateBlockedArea()`

今回は現行コードとの整合を優先し、`estimateBlockedSlots()` の名前を維持する。

### 4. 小さな純関数へ分割する

保守しやすくするため、`getFlowTargets()` へ複雑な条件を直接書き足さない。

分ける候補:

- `buildBlockedRangesForRow(...)`
- `buildAvailableRangesForRow(...)`
- `allocateSlotsAcrossRanges(...)`
- `rebalanceSmallFragments(...)`
- `sortSelectedSlotsForReadingOrder(...)`

この形なら、将来 `main.js` から分離する時も安全に切り出せる。

### 5. 早すぎるモジュール分割をしない

今回の変更だけで `layout/` や `obstacles/` に分けると、責務整理より移動コストが先に立つ可能性が高い。

まずは `main.js` 内で純関数として整理し、仕様が固まった時点で分離する方が保守しやすい。

## ドキュメント上の契約

以下は実行時の基底クラスではなく、設計上の契約を説明する擬似 API である。

```js
const CharacterLayoutContract = {
  update(dt, timestamp) {},
  draw(ctx) {},

  // 第 1 段階で必須
  contains(x, y, padding = 0) {
    return false;
  },

  // 第 2 段階以降の任意最適化
  getBlockedRangesAtRow(y, inflate, rowBounds) {
    return undefined;
  },

  // buildPanel 用の任意最適化
  estimateBlockedSlots(cellWidth, lineHeight) {
    return undefined;
  },

  // getMotionBounds 用の任意最適化
  getMotionInsets() {
    return undefined;
  },

  // 将来の高精度化用。第 1 段階では必須ではない
  sampleSignedDistance(x, y) {
    return undefined;
  },
};
```

重要なのは次の整理である。

- 第 1 段階の必須契約は `contains()` だけ
- 他は optional capability として扱う
- override が無ければ、レイアウト側の共通ヘルパーまたは既存ロジックへフォールバックする

## 第 1 段階の推奨実装

### 1. 計算タイミング

禁止区間の計算は、毎描画フレームではなく `updateTextFlow()` の再計算時だけ行う。

つまり:

- `drawText()` 中では計算しない
- `character.update()` のたびに直接再計算しない
- 既存の `textFlowIntervalMs` ごとの更新タイミングにそろえる

これで、現行の負荷特性を大きく崩さない。

### 2. 禁止区間の作り方

第 1 段階では、`sampleSignedDistance()` を使わず、行スロットをもとに禁止区間を作る。

推奨方法:

1. 対象行の `rowSlots` を取得する
2. 各スロット中心について `character.contains(slot.x, slot.y, panel.textClearance)` を評価する
3. blocked なスロットを連続区間としてまとめる
4. その blocked 区間から available 区間を作る

この方式の利点:

- 既存の `contains()` をそのまま再利用できる
- キャラ側へ新規メソッドをすぐ要求しない
- 計算単位が現在のスロット粒度と一致する

### 3. optional override の扱い

将来、キャラ側でより効率よく禁止区間を返せるなら、`getBlockedRangesAtRow()` を optional override として使ってよい。

ただし第 1 段階では、これを必須にしない。

優先順:

1. `character.getBlockedRangesAtRow?.(...)`
2. 無ければレイアウト側の `contains()` ベース共通ヘルパー

### 4. 使用可能区間でのスロット選択

文字の配置は、区間ごとの「障害物に接する側」から採用スロットを選ぶ。

判定ルール:

- available 区間の左境界が blocked 区間の右境界に接していれば、その available 区間は障害物の右側にあるものとして左端から取る
- available 区間の右境界が blocked 区間の左境界に接していれば、その available 区間は障害物の左側にあるものとして右端から取る
- 両側が blocked 区間に接している場合は、より近い境界側から取る
- 距離が同じなら左境界側を優先する
- その行に blocked 区間が無い場合は、現行互換で左端から取る
- ただし論理行の先頭表示行では、行頭の不自然な空白を避けるため、最も左の available 区間を左から詰めて使う
- ただし同一論理行の継続表示行では、輪郭寄せより行頭の読みやすさを優先し、available 区間を `x` 昇順で使って左端から詰める

例:

- 生き物の左側にある available 区間なら右端から取る
- 生き物の右側にある available 区間なら左端から取る
- 2 つの blocked 区間の間にある available 区間なら、より近い障害物境界側から優先して取る
- ただし新しい論理行の開始位置なら、左端の available 区間に先頭から連続して文字を置く
- ただし前の表示行からの継続文字列なら、その表示行の先頭文字は最も左の available slot から置く

最後のケースは、現行キャラで常時発生することを前提にはしない。

ただし第 1 段階でも、blocked 区間が 1 個とは限らない一般形として扱い、キャラ固有の特例分岐を増やさない。

ただし、採用後は必ず `x` 昇順に戻し、その順で文字を入れる。

これにより:

- 視覚上は輪郭側へ詰まる
- 読順は壊れない
- フレームごとの文字入れ替わりを避けやすい

### 5. `minFragment` の扱い

現行の `minFragment = 3` は、1 文字や 2 文字だけの孤立スパンを避けるための視覚的な制約である。

第 1 段階では、これを即廃止しない。

ただし、現行の「最初と最後だけを見る」ロジックから、より中立的な扱いへ変える。

推奨ルール:

- `minFragment` は `minClusterSlots` として残す
- `take >= 3` の時だけ有効にする
- ある区間への割当が 1 または 2 で、隣接区間へ逃がせるなら再配分する
- 逃がし先が無い場合や、総文字数が少ない場合は 1 や 2 を許容する

これで、短い行の自然さとルールの単純さの両方を保てる。

### 6. 改行と空行の扱い

現行の動作を仕様として固定する。

- `textLines` は入力テキストの改行単位を保持する
- 空行は `[]` として 1 行ぶん消費する
- 連続空行は圧縮しない
- ある表示行の全スロットが blocked の場合、その表示行だけをスキップし、論理行は消費しない
- ある論理行の残り文字は次の表示行へ送ってよい
- 継続表示行の先頭文字は、その表示行で最も左の available slot から置く
- ただし次の論理行を前行の余白へ流し込まない
- 行数が足りなければ後続の論理行を落としてよい
- 入力文字数が少ないときでも補完やループはしない

### 7. `estimateBlockedSlots()` の扱い

この修正では、面積ベースの新 API は導入しない。

代わりに:

- 現行の `estimateBlockedSlots()` を名称ごと維持する
- 将来キャラ側で上書きしたい場合は `character.estimateBlockedSlots?.(cellWidth, lineHeight)` を許可する
- override が無ければ既存ロジックを使う

これで単位の混乱を避けられる。

なお、現行の関数版は `estimateBlockedSlots(metrics, cellWidth, lineHeight)` だが、メソッド化する場合は各キャラが自身の `metrics` を参照する前提なので、シグネチャ差異は意図的である。

### 8. `getMotionBounds()` の扱い

移動範囲も、同じ方針で optional override 化できる。

- `character.getMotionInsets?.()`
- 無ければ現行の metrics ベース計算

ここも第 1 段階で大きく構造変更せず、差し替え点だけ明確にする。

## 第 2 段階の任意改善

第 1 段階で見た目が十分改善するなら、ここへ進まなくてもよい。

必要になった時だけ、次を追加する。

- `character.getBlockedRangesAtRow()` の個別最適化
- `character.estimateBlockedSlots()` の個別最適化
- `character.getMotionInsets()` の個別最適化
- 純関数群の `layout/` への切り出し

この段階でも、まだ `sampleSignedDistance()` は必須ではない。

## 第 3 段階の高精度化

判定輪郭と描画輪郭の差が目立ち、第 1 段階では視覚品質が足りない場合だけ、距離ベースへ進む。

この段階で初めて、`sampleSignedDistance()` を導入候補にする。

### `sampleSignedDistance()` に関する注意

これは実装コストが高い。

- `BeanSproutFairy` のような複合形状では、boolean 判定より明確に難しい
- 楕円距離は単純な解析式で済まない
- 各パーツの合成も設計が必要

したがって、第 1 段階で必須にしない。

### `glyphRadius` の扱い

`glyphRadius` は距離ベースへ進んだ時だけ使う。

第 1 段階では、`panel.textClearance` をそのまま inflate 値として使えばよい。

第 3 段階で導入する場合の暫定式は次とする。

```js
const glyphRadius = Math.min(cellWidth, lineHeight) * 0.25;
const inflate = clearance + glyphRadius;
```

この値は厳密解ではなく、まずは視覚調整用の近似値として扱う。

## パフォーマンス方針

第 1 段階では、性能面も保守的に扱う。

- 禁止区間計算は `updateTextFlow()` のタイミングでのみ実行する
- `sampleSignedDistance()` を全スロットへ毎回かけることはしない
- まずは `contains()` ベースで行ごとの blocked / available を作る
- キャッシュは「1 回の再計算中の局所キャッシュ」までに留める
- キャラは常に動いているため、フレームをまたぐ複雑なキャッシュは第 1 段階では入れない

補足:

- 行ベースの区間化は、実装次第では現行より効率化する可能性がある
- ただし無理に最適化を先行させず、まずはロジックを単純化してから測る

## 変更対象

第 1 段階で主に触るのは次。

- `getFlowTargets()`
- `splitRowIntoSpans()` 相当の row 区間化ロジック
- `selectSpanSlots()` / `distributeRowSlots()` 相当の割当ロジック
- `estimateBlockedSlots()`
- `getMotionBounds()`

必要なら追加する純関数:

- `buildBlockedRangesForRow(...)`
- `buildAvailableRangesForRow(...)`
- `allocateSlotsAcrossRanges(...)`
- `rebalanceSmallFragments(...)`
- `sortSelectedSlotsForReadingOrder(...)`

想定している対応関係は次の通り。

- `buildAvailableRangesForRow(...)` は、現行の `splitRowIntoSpans()` を置き換える
- `allocateSlotsAcrossRanges(...)` は、現行の `selectSpanSlots()` と `distributeRowSlots()` の責務を吸収する
- `rebalanceSmallFragments(...)` は、現行の `minFragment` 調整の置き換えである

`SegmentedFish` と `BeanSproutFairy` は、第 1 段階では無改造または最小変更に留める方が保守しやすい。

## 受け入れ条件

- `SegmentedFish` と `BeanSproutFairy` が同じレイアウト経路で動く
- 第 1 段階の必須契約は `contains()` のままでよい
- 生き物近傍の文字間隔が現状より視覚的に均一になる
- 行内の文字順が左から右で安定する
- フレーム間で文字の並び替わりが起きにくい
- 改行が多い文章でも空行と行順が維持される
- 連続空行を含む文章でも空行が詰められない
- 全スロットが blocked の表示行でも、論理行の文字が不正に消費されない
- 論理行の先頭表示行に不自然な行頭空白が残らない
- 継続表示行の先頭文字が不自然に中央寄りから始まらない
- 短い行で 1 文字だけの不自然な孤立スパンが増えない
- 狭い画面と広い画面の両方で破綻しない
- 新しいキャラを追加する時、最初は `contains()` だけあればレイアウトへ参加できる

## 検証観点

最低限、次で確認する。

- `fish`
- `sprout`
- 短文
- 長文
- 改行が多い文章
- 連続空行を含む文章
- 横幅の狭い画面
- 横幅の広い画面

見るべき点:

- 輪郭近傍の不自然な空きセルが減っているか
- 文字順が崩れていないか
- 論理行の先頭表示行が左から自然に始まっているか
- 継続表示行の先頭が左から始まっているか
- 空行がつぶれていないか
- 全 blocked 行で文字が不正に消費されていないか
- 1 文字や 2 文字だけの孤立スパンが増えていないか
- キャラ追加時にレイアウト側の分岐が増えすぎていないか

## リスク

- 第 1 段階では、描画輪郭とのずれがまだ残る
- `contains()` ベースでは、曲線輪郭に対する厳密な等距離までは保証できない
- 小断片の再配分ルールを複雑にしすぎると、逆に保守性が落ちる
- 高精度化を急ぐと、`sampleSignedDistance()` 実装でコストが跳ね上がる

## まず入れるべき最小修正

最初に入れるべきなのは次の 5 点。

- `contains()` ベースで行ごとの禁止区間を作る共通ヘルパーを追加する
- `getFlowTargets()` を禁止区間ベースへ変更する
- 採用スロットは輪郭境界基準で選び、最終的に `x` 昇順へ戻す
- ただし論理行の先頭表示行では左端の available 区間を先に埋める
- ただし継続表示行の先頭だけは左端から始める
- `minFragment` を中立的な `minClusterSlots` ルールへ置き換える
- 改行と空行の保持を受け入れ条件に含める

この形なら、見た目改善、実装負荷、保守性のバランスが最もよい。
