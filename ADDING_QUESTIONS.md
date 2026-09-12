# 問題パックの追加手順

アプリロジックは変更せず、次の3か所を更新します。

1. `data/part3/pack02.json` などに新しい問題パックを追加。
2. 各セットの完成済みMP3を `audio/part3/` などに追加。
3. `data/catalog.json` の `packs` に新パックの情報を追記。

```json
{"id":"part3-pack02","part":3,"title":"Part 3 · Pack 02","path":"data/part3/pack02.json","setCount":10,"questionCount":30,"revision":1}
```

既存のpacks要素は残してください。初期パックと同じ構造を用います。

| フィールド | 内容 |
|---|---|
| schemaVersion | 1 |
| id | パックの不変ID |
| sets | セットの配列 |
| sets[].id | 全パック共通で一意のセットID（例 P3-0007） |
| sets[].packId | 所属パックID |
| sets[].part | 3 または 4 |
| sets[].title / difficulty / genre | タイトル・難易度・ジャンル |
| sets[].audio | アプリルート基準の相対MP3パス |
| sets[].speakers | id・label・voiceを持つ話者一覧 |
| sets[].transcript | speaker・text・translationを持つ発話の配列 |
| sets[].questions | 必ず3問。各問にid・text・options・answer・explanation |
| sets[].questions[].options | A〜D順の文字列4つ |
| sets[].questions[].answer | **0始まり**。A=0 / B=1 / C=2 / D=3 |
| sets[].expressions | english・japaneseを持つ重要表現 |

`questions[].id` は例 `P3-0007-Q1`。表示番号とは別で、削除・採番し直し・使い回しは禁止です。

## 音声

- 複数話者も必ず1セット1本に結合します。
- 本文だけを読み上げ、長い開始説明や設問読み上げは付けません。
- 話者は `en-US-GuyNeural` / `en-US-AriaNeural` / `en-GB-RyanNeural` / `en-GB-SoniaNeural` を初期採用。
- `scripts/generate_audio.py` はカタログの全パックを読み、欠けているMP3だけ生成します。
- 音声サービスへの通信はこの作成処理だけです。配信済みアプリにはAPIキーも生成ライブラリも不要。
- MP3を同じURLで置き換えた場合は端末の「音声ごと保存」をやり直してください。大幅な修正は新セットIDと新ファイル名を推奨。

## 検証と公開

```sh
python3 scripts/validate.py
npm test
```

検証は全パックの重複ID、正答の範囲、話者参照、音声の存在・形式・長さを調べます。

`data/catalog.json` はオンライン時に取得し直すので、パック追加だけならアプリ本体のバージョン変更は不要です。すでに開いている画面は、ホームから一度アプリを開き直して新パックを読み込んでください。追加しても既存履歴は残ります。

## 次に問題作成を依頼するとき

> ADDING_QUESTIONS.mdと既存pack01.jsonの形式に従い、Part 3を○セット、Part 4を○セット追加してください。各セット3問、日本語訳・解説・重要表現を含めてください。既存IDと履歴を維持し、新JSON・MP3・カタログ追記だけで追加してください。生成後にvalidate.pyとnpm testを実行してください。
