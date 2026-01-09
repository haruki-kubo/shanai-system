# 営業日報システム ER図

## ER図（Mermaid）

```mermaid
erDiagram
    sales_staff {
        int id PK "営業担当者ID"
        string name "氏名"
        string email "メールアドレス"
        int manager_id FK "上長ID（自己参照）"
        boolean is_active "有効フラグ"
        datetime created_at "作成日時"
        datetime updated_at "更新日時"
    }

    customer {
        int id PK "顧客ID"
        string name "顧客名"
        string address "住所"
        string phone "電話番号"
        string email "メールアドレス"
        boolean is_active "有効フラグ"
        datetime created_at "作成日時"
        datetime updated_at "更新日時"
    }

    daily_report {
        int id PK "日報ID"
        int sales_staff_id FK "営業担当者ID"
        date report_date "報告日"
        text problem "課題・相談"
        text plan "明日の予定"
        datetime created_at "作成日時"
        datetime updated_at "更新日時"
    }

    visit_record {
        int id PK "訪問記録ID"
        int daily_report_id FK "日報ID"
        int customer_id FK "顧客ID"
        text content "訪問内容"
        time visit_time "訪問時刻"
        datetime created_at "作成日時"
        datetime updated_at "更新日時"
    }

    comment {
        int id PK "コメントID"
        int daily_report_id FK "日報ID"
        int commenter_id FK "コメント者ID（上長）"
        text content "コメント内容"
        datetime created_at "作成日時"
        datetime updated_at "更新日時"
    }

    sales_staff ||--o{ daily_report : "作成する"
    sales_staff ||--o{ comment : "コメントする"
    sales_staff ||--o{ sales_staff : "上長である"
    daily_report ||--o{ visit_record : "含む"
    daily_report ||--o{ comment : "受ける"
    customer ||--o{ visit_record : "訪問される"
```

## リレーション説明

| 親テーブル | 子テーブル | 関係 | 説明 |
|-----------|-----------|------|------|
| sales_staff | daily_report | 1:N | 営業担当者は複数の日報を作成 |
| sales_staff | comment | 1:N | 上長は複数のコメントを投稿 |
| sales_staff | sales_staff | 1:N | 上長は複数の部下を持つ（自己参照） |
| daily_report | visit_record | 1:N | 日報は複数の訪問記録を含む |
| daily_report | comment | 1:N | 日報は複数のコメントを受ける |
| customer | visit_record | 1:N | 顧客は複数回訪問される |

## インデックス推奨

```sql
-- 日報検索用
CREATE INDEX idx_daily_report_date ON daily_report(report_date);
CREATE INDEX idx_daily_report_staff ON daily_report(sales_staff_id);
CREATE UNIQUE INDEX idx_daily_report_unique ON daily_report(sales_staff_id, report_date);

-- 訪問記録検索用
CREATE INDEX idx_visit_record_report ON visit_record(daily_report_id);
CREATE INDEX idx_visit_record_customer ON visit_record(customer_id);

-- コメント検索用
CREATE INDEX idx_comment_report ON comment(daily_report_id);
```
