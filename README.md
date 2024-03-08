# Hardhat スターターキット

ブロックチェーンの開発フレームワークである Hardhat の基本的な使用例を示しています。サンプルのコントラクト、そのコントラクトのテスト、そのコントラクトをデプロイするスクリプトが含まれています。TypeScript に対応済み。

# Usage

## Requirements

- Node.js
- npm

もしくは、docker を使って実行することもできます。
場合はすべての`npm`, `npx`コマンドの前に`docker compose run`を追加して実行してください。

## Setup

- プロジェクトをクローンする

```bash
git clone https://github.com/ertlnagoya/hardhat-starter-kit.git
cd hardhat-starter-kit
```

- パッケージのインストール

```bash
npm install
```

- .env ファイルを作成する
  .env.example をコピー・編集して.env ファイルを作成してください。

```bash
cp .env.example .env
```

## コマンド

- コンパイル

```bash
npx hardhat compile
```

- コントラクトの型定義ファイルの生成

```bash
npx hardhat typechain
```

- テスト

```bash
npx hardhat test
```

- ローカルネットワークの起動

```bash
npx hardhat node
```

- デプロイ  
  --network オプションでデプロイ先のネットワークを指定できます。sepolia(テストネット), localhost(ローカルネットワーク), hardhat(コード実行時のみ動作する使い捨てネットワーク) が指定でき、デフォルトは hardhat です。また sepolia を指定した際には etherscan へのコード検証を行います。

```bash
npx hardhat run scripts/deploy.ts --network {network}
```
