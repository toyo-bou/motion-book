# motion-book

ローカルサーバを起動して、ブラウザで絵本を開く構成です。

## 使い方

### いちばん簡単

`start-motion-book.bat` を実行します。

- 必要なら自動で `vite build` を実行します
- ローカルサーバを起動します
- 既定のブラウザで絵本を開きます

### 停止

`stop-motion-book.bat` を実行します。

## npm から実行する場合

```bash
npm run start:local
```

停止:

```bash
npm run stop:local
```

## 前提

- Windows
- Node.js / npm がインストール済み

## 補足

- ローカルサーバは `127.0.0.1` の空きポートを自動で使います
- すでに起動中なら、そのサーバを再利用してブラウザだけ開きます
