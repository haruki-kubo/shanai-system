# 営業日報システム 要件定義書

## 1. システム概要

営業担当者が日々の活動を報告し、上長がフィードバックを行うための日報管理システム

## 2. 機能要件

### 2.1 日報機能
- 営業担当者は1日1件の日報を作成できる
- 日報には複数の顧客訪問記録を登録できる
- 各訪問記録には訪問先顧客と訪問内容を記載
- 課題・相談事項（Problem）を記載できる
- 明日の予定（Plan）を記載できる

### 2.2 コメント機能
- 上長は日報に対してコメントを追加できる
- コメントは複数件登録可能

### 2.3 マスタ管理
- 顧客マスタ：顧客情報の管理
- 営業マスタ：営業担当者情報の管理（上長関係を含む）

## 3. データ構造

### 3.1 ER図

@docs/er-diagram.md

## 4. エンティティ一覧

| エンティティ | テーブル名 | 説明 |
|-------------|-----------|------|
| 営業担当者 | sales_staff | 営業担当者の情報、上長への紐付け |
| 顧客 | customer | 顧客マスタ情報 |
| 日報 | daily_report | 日報の基本情報 |
| 訪問記録 | visit_record | 顧客訪問の詳細 |
| コメント | comment | 上長からのコメント |

## 5. テーブル定義

### 5.1 営業担当者（sales_staff）

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | INT | PK, AUTO_INCREMENT | 営業担当者ID |
| name | VARCHAR(100) | NOT NULL | 氏名 |
| email | VARCHAR(255) | NOT NULL, UNIQUE | メールアドレス |
| manager_id | INT | FK (self) | 上長ID |
| is_active | BOOLEAN | NOT NULL, DEFAULT TRUE | 有効フラグ |
| created_at | DATETIME | NOT NULL | 作成日時 |
| updated_at | DATETIME | NOT NULL | 更新日時 |

### 5.2 顧客（customer）

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | INT | PK, AUTO_INCREMENT | 顧客ID |
| name | VARCHAR(200) | NOT NULL | 顧客名 |
| address | VARCHAR(500) | | 住所 |
| phone | VARCHAR(20) | | 電話番号 |
| email | VARCHAR(255) | | メールアドレス |
| is_active | BOOLEAN | NOT NULL, DEFAULT TRUE | 有効フラグ |
| created_at | DATETIME | NOT NULL | 作成日時 |
| updated_at | DATETIME | NOT NULL | 更新日時 |

### 5.3 日報（daily_report）

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | INT | PK, AUTO_INCREMENT | 日報ID |
| sales_staff_id | INT | FK, NOT NULL | 営業担当者ID |
| report_date | DATE | NOT NULL | 報告日 |
| problem | TEXT | | 課題・相談 |
| plan | TEXT | | 明日の予定 |
| created_at | DATETIME | NOT NULL | 作成日時 |
| updated_at | DATETIME | NOT NULL | 更新日時 |

**ユニーク制約**: (sales_staff_id, report_date)

### 5.4 訪問記録（visit_record）

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | INT | PK, AUTO_INCREMENT | 訪問記録ID |
| daily_report_id | INT | FK, NOT NULL | 日報ID |
| customer_id | INT | FK, NOT NULL | 顧客ID |
| content | TEXT | NOT NULL | 訪問内容 |
| visit_time | TIME | | 訪問時刻 |
| created_at | DATETIME | NOT NULL | 作成日時 |
| updated_at | DATETIME | NOT NULL | 更新日時 |

### 5.5 コメント（comment）

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | INT | PK, AUTO_INCREMENT | コメントID |
| daily_report_id | INT | FK, NOT NULL | 日報ID |
| commenter_id | INT | FK, NOT NULL | コメント者ID（上長） |
| content | TEXT | NOT NULL | コメント内容 |
| created_at | DATETIME | NOT NULL | 作成日時 |
| updated_at | DATETIME | NOT NULL | 更新日時 |

## 6. ビジネスルール

1. **日報の一意性**: 1営業担当者につき、1日1件の日報のみ作成可能
2. **コメント権限**: コメントは上長（manager_idで紐づく営業担当者）のみ可能
3. **訪問記録**: 1日報につき0件以上の訪問記録を登録可能
4. **論理削除**: マスタデータは is_active フラグによる論理削除を採用

## 7. 将来の拡張検討事項

- 日報のステータス管理（下書き/提出済み/承認済み）
- コメントへの返信機能（スレッド形式）
- 部署管理機能
- 添付ファイル機能

## 8. 使用技術

**言語:** TypeScript
**フレームワーク** Next.js(Aop Router)
**UI** shadcn/ui
**APIスキーマ定義** OpenAPI(Zodによる検証)
**DBスキーマ定義** Prisma.js
**テスト** Vitest
**デプロイ** Google Cloud Cloud Run

## 9. 画面設計

@docs/screen-definition.md

## 10. API仕様書

@docs/api-specification.md

## 11. テスト仕様書

@doc/test-specification.md