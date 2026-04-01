# 生き物と文字の距離を等間隔にする汎用修正案

## 目的

生き物の輪郭と文字の間にできる余白を、見た目としてできるだけ等間隔にそろえる。

この案は魚専用ではなく、将来的に別のキャラや任意のシルエットへ差し替えても再利用できる設計を前提にする。

## 結論

現在の実装は、魚の形状と文字配置が密結合しているため、別キャラへの差し替えに強くない。

汎用化するには、次の 2 層に分離する必要がある。

- 形状層: キャラの輪郭を「距離」と「行ごとの禁止区間」として提供する
- レイアウト層: その情報だけを使って文字を配置する

レイアウト層が `fish` や `SegmentedFish` を直接知らない構成にすれば、魚以外のキャラにも適応できる。

## 現状の問題

- 文字配置が `fish.contains(...)` に直接依存している。
- 文字の詰め方が「左右端基準」で、輪郭境界基準になっていない。
- 余白判定がセル中心の内外判定だけなので、輪郭からの距離を正確に扱えない。
- 本体、ヒレ、尾など部位ごとに別ロジックで膨張しているため、輪郭全体で一定幅の余白にならない。

これらは魚なら調整でしのげても、別形状に変わるたびにレイアウト側まで修正が必要になる。

## 設計方針

### 方針 1: 「魚」をやめて「文字を避けるシルエット」を抽象化する

`SegmentedFish` をそのままレイアウトに見せず、共通インターフェースを 1 枚挟む。

例:

```js
class TextObstacle {
  update(dt, timestamp) {}
  draw(ctx) {}
  getBounds() {}
  sampleSignedDistance(x, y) {}
  getBlockedRangesAtRow(y, inflate) {}
}
```

ポイント:

- `draw()` は見た目の描画
- `sampleSignedDistance()` は輪郭までの signed distance
- `getBlockedRangesAtRow()` は特定行で文字を置けない x 区間

これを守れば、魚、鳥、人型、マスコット、ロゴ形状でも同じレイアウトエンジンを使える。

### 方針 2: レイアウトは「行ごとの禁止区間」だけを見る

現在は「各セルが魚の内側か外側か」を見ているが、汎用化するなら行単位で禁止区間を作る方がよい。

処理の流れ:

1. 文字行の y 座標を決める
2. 障害物に `getBlockedRangesAtRow(y, inflate)` を問い合わせる
3. パネル横幅から禁止区間を差し引いて、使用可能区間を得る
4. 使用可能区間のうち、輪郭境界に近い側から文字を詰める

これなら、形状が複雑で 1 行中に 2 個でも 3 個でも穴が空いても扱える。

### 方針 3: 等間隔の定義を「輪郭からの最短距離」で統一する

等間隔に見せたいなら、基準はセル番号ではなく輪郭までの最短距離にするべき。

使用条件は次のように定義する。

```js
available if signedDistance(slotCenter) >= clearance + glyphRadius
```

ここで:

- `clearance`: 輪郭と文字の最低余白
- `glyphRadius`: 文字の見た目半径の近似

この形にすると、どんなシルエットでも同じルールで判定できる。

## 推奨アーキテクチャ

### 1. `ObstacleAdapter` 層

役割:

- 個別キャラの形状を汎用 API に変換する

想定実装:

- `FishObstacleAdapter`
- `HumanoidObstacleAdapter`
- `SpriteMaskObstacleAdapter`
- `PathObstacleAdapter`

重要なのは、レイアウト側が Adapter の種類を知らないこと。

### 2. `TextFlowLayoutEngine` 層

役割:

- 行ごとの禁止区間を受け取り、文字をどこに置くか決める

この層は次だけ見ればよい。

- パネル矩形
- 行高
- 文字幅
- テキスト内容
- `getBlockedRangesAtRow(y, inflate)`

### 3. `Renderer` 層

役割:

- 生き物を描く
- 背景を描く
- 配置済み文字を描く

ここは余白ロジックから切り離す。

## 形状取得の方法

汎用化の手段は大きく 2 つある。

### 方式 A: 幾何形状ベース

魚のように、楕円、線分、多角形で輪郭を近似する。

利点:

- 軽い
- アニメーション中でも精度を保ちやすい

欠点:

- キャラごとに距離関数を実装する必要がある

向いているケース:

- プログラムで形状を作っているキャラ

### 方式 B: マスク / SDF ベース

キャラをオフスクリーンに描き、その alpha から signed distance field を作る。

利点:

- 任意の形に対応しやすい
- 描画結果と当たり判定のずれが小さい

欠点:

- 実装コストと計算コストが高い

向いているケース:

- 将来的にキャラ差し替えが多い
- SVG、画像、自由形状を扱いたい

## このリポジトリでの推奨案

現状のコードベースには、段階的には次の案が最も現実的。

### 第 1 段階

- `SegmentedFish` を `FishObstacleAdapter` とみなす
- `sampleSignedDistance()` を追加する
- `getBlockedRangesAtRow()` を追加する
- レイアウトから `fish.contains()` 依存を除く

### 第 2 段階

- レイアウトエンジンを `TextFlowLayoutEngine` として切り出す
- `fish` 固有の左右判定や末尾スパン特例をなくす
- 複数スパンでも「境界側から詰める」ルールに統一する

### 第 3 段階

- 必要なら `SpriteMaskObstacleAdapter` を導入する
- 魚以外のキャラはマスク or パスベースで差し替え可能にする

## 具体的な API 案

### 障害物 API

```js
class TextObstacle {
  update(dt, timestamp) {}
  draw(ctx) {}

  // 正: 外側, 0: 輪郭上, 負: 内側
  sampleSignedDistance(x, y) {
    return Infinity;
  }

  // ある行で文字を置けない x 区間を返す
  getBlockedRangesAtRow(y, inflate) {
    return [];
  }
}
```

### レイアウト API

```js
function layoutText({
  textLines,
  rows,
  cols,
  cellWidth,
  lineHeight,
  panelRect,
  obstacle,
  clearance,
  glyphRadius,
}) {
  return positionedGlyphs;
}
```

## 行ごとの配置ルール

### 現在の問題のあるルール

- 左スパンは左から詰める
- 右スパンは右から詰める
- 最後の span だから右側扱い、という仮定がある

このやり方だと、生き物近傍に未使用セルが残る。

### 変更後のルール

各使用可能区間について、輪郭に近い境界から文字を詰める。

例:

- 生き物の左側区間なら右端から左へ詰める
- 生き物の右側区間なら左端から右へ詰める
- 上下や複数の突起で区間が複雑でも、各区間ごとに「最寄りの禁止境界」を基準にする

さらに汎用化するなら、各セル候補に対して「最寄り輪郭距離」でソートして配置してもよい。

## 変更対象の整理

### `main.js`

主な変更対象:

- `SegmentedFish.contains()` 依存の削除
- `TextObstacle` 相当の抽象導入
- `getFlowTargets()` の再設計
- `splitRowIntoSpans()` / `distributeRowSlots()` の境界基準化

### 将来的に分割したい責務

- `obstacles/`
  - `FishObstacleAdapter.js`
  - `SpriteMaskObstacleAdapter.js`
- `layout/`
  - `TextFlowLayoutEngine.js`

## 実装ステップ

### ステップ 1

- 現在の魚ロジックを `FishObstacleAdapter` として包む
- `sampleSignedDistance()` を追加する
- 既存の `draw()` と `update()` はそのまま使う

### ステップ 2

- `getBlockedRangesAtRow(y, inflate)` を追加する
- 初期実装はサンプリング近似でもよい

### ステップ 3

- `getFlowTargets()` を「禁止区間から使用可能区間を作る」方式へ変更する
- 区間ごとに境界側から文字を詰める

### ステップ 4

- `fish` という変数名や fish 固有の条件分岐を減らし、`obstacle` へ置き換える

### ステップ 5

- 魚以外のダミー形状を 1 つ追加し、差し替えても同じレイアウトが動くか確認する

## 受け入れ条件

- 魚以外のシルエットに差し替えても、レイアウトエンジンのコード変更が不要
- 生き物の左右どちらでも、文字と輪郭の距離が視覚的にそろう
- 突起のある形状でも、近い場所だけ不自然に文字が離れない
- 文字が短い行でも、生き物近傍に不自然な空きセルが残らない
- 入力文字数が少ないときでも、ループ補完しない

## リスク

- signed distance を厳密にやると実装コストが上がる
- 行ごとの禁止区間計算は、複雑形状で負荷が増える
- マスク / SDF 化は汎用性が高いが、初期導入コストが大きい

## まず入れるべき最小修正

最初の段階では、完全汎用化を一気にやる必要はない。

先に入れるべきなのは次の 3 点。

- `fish.contains()` 依存を `sampleSignedDistance()` 依存へ置き換える
- 文字配置を「左右端基準」ではなく「輪郭境界基準」に変える
- レイアウトコード内の `fish` 前提を `obstacle` 前提に置き換える

これで、まず魚の見た目改善をしつつ、次のキャラ差し替えにも耐えられる土台になる。
