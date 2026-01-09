# 営業日報システム API仕様書

## 概要

- ベースURL: `/api/v1`
- 認証方式: Bearer Token (JWT)
- コンテンツタイプ: `application/json`

---

## 共通仕様

### リクエストヘッダー

| ヘッダー名 | 必須 | 説明 |
|-----------|------|------|
| Authorization | ○ | `Bearer {token}` 形式（認証API以外） |
| Content-Type | ○ | `application/json` |

### レスポンス形式

#### 成功時
```json
{
  "success": true,
  "data": { ... }
}
```

#### エラー時
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ"
  }
}
```

### HTTPステータスコード

| コード | 説明 |
|--------|------|
| 200 | 成功 |
| 201 | 作成成功 |
| 400 | リクエスト不正 |
| 401 | 認証エラー |
| 403 | 権限エラー |
| 404 | リソースが見つからない |
| 409 | 競合（重複など） |
| 500 | サーバーエラー |

### ページネーション

一覧取得APIはページネーションをサポート

#### リクエストパラメータ
| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| page | number | 1 | ページ番号 |
| per_page | number | 20 | 1ページあたりの件数（最大100） |

#### レスポンス
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total_pages": 5,
      "total_count": 100
    }
  }
}
```

---

## API一覧

| カテゴリ | メソッド | エンドポイント | 説明 |
|---------|---------|---------------|------|
| 認証 | POST | /auth/login | ログイン |
| 認証 | POST | /auth/logout | ログアウト |
| 認証 | GET | /auth/me | 自分の情報取得 |
| 日報 | GET | /daily-reports | 日報一覧取得 |
| 日報 | GET | /daily-reports/:id | 日報詳細取得 |
| 日報 | POST | /daily-reports | 日報作成 |
| 日報 | PUT | /daily-reports/:id | 日報更新 |
| 日報 | DELETE | /daily-reports/:id | 日報削除 |
| コメント | GET | /daily-reports/:id/comments | コメント一覧取得 |
| コメント | POST | /daily-reports/:id/comments | コメント追加 |
| コメント | DELETE | /comments/:id | コメント削除 |
| 顧客 | GET | /customers | 顧客一覧取得 |
| 顧客 | GET | /customers/:id | 顧客詳細取得 |
| 顧客 | POST | /customers | 顧客作成 |
| 顧客 | PUT | /customers/:id | 顧客更新 |
| 営業 | GET | /sales-staff | 営業担当者一覧取得 |
| 営業 | GET | /sales-staff/:id | 営業担当者詳細取得 |
| 営業 | POST | /sales-staff | 営業担当者作成 |
| 営業 | PUT | /sales-staff/:id | 営業担当者更新 |

---

## 認証API

### POST /auth/login

ログイン認証を行いトークンを取得

#### リクエスト
```json
{
  "email": "tanaka@example.com",
  "password": "password123"
}
```

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| email | string | ○ | メールアドレス |
| password | string | ○ | パスワード |

#### レスポンス（200 OK）
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_at": "2026-01-09T10:00:00Z",
    "user": {
      "id": 1,
      "name": "田中一郎",
      "email": "tanaka@example.com",
      "is_manager": false
    }
  }
}
```

#### エラー（401 Unauthorized）
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "メールアドレスまたはパスワードが正しくありません"
  }
}
```

---

### POST /auth/logout

ログアウト処理

#### レスポンス（200 OK）
```json
{
  "success": true,
  "data": {
    "message": "ログアウトしました"
  }
}
```

---

### GET /auth/me

ログインユーザーの情報を取得

#### レスポンス（200 OK）
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "田中一郎",
    "email": "tanaka@example.com",
    "manager": {
      "id": 10,
      "name": "佐藤部長"
    },
    "subordinates": [],
    "is_manager": false,
    "is_active": true
  }
}
```

---

## 日報API

### GET /daily-reports

日報一覧を取得

#### クエリパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| date_from | date | - | 検索開始日（YYYY-MM-DD） |
| date_to | date | - | 検索終了日（YYYY-MM-DD） |
| sales_staff_id | number | - | 営業担当者ID |
| customer_id | number | - | 顧客ID（訪問先で絞り込み） |
| page | number | - | ページ番号 |
| per_page | number | - | 1ページあたり件数 |

#### レスポンス（200 OK）
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "report_date": "2026-01-08",
        "sales_staff": {
          "id": 1,
          "name": "田中一郎"
        },
        "visit_count": 3,
        "comment_count": 2,
        "created_at": "2026-01-08T18:00:00Z",
        "updated_at": "2026-01-08T18:00:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total_pages": 5,
      "total_count": 100
    }
  }
}
```

---

### GET /daily-reports/:id

日報詳細を取得

#### パスパラメータ

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| id | number | 日報ID |

#### レスポンス（200 OK）
```json
{
  "success": true,
  "data": {
    "id": 1,
    "report_date": "2026-01-08",
    "sales_staff": {
      "id": 1,
      "name": "田中一郎",
      "email": "tanaka@example.com"
    },
    "visit_records": [
      {
        "id": 1,
        "customer": {
          "id": 1,
          "name": "株式会社ABC"
        },
        "visit_time": "09:00",
        "content": "新製品の提案を実施。先方は前向きに検討中。"
      },
      {
        "id": 2,
        "customer": {
          "id": 2,
          "name": "有限会社XYZ"
        },
        "visit_time": "11:00",
        "content": "見積もり提出。来週回答予定。"
      }
    ],
    "problem": "ABC社の案件について、価格交渉が難航している。",
    "plan": "・ABC社へ再訪問（10:00）\n・新規顧客への電話アプローチ",
    "comments": [
      {
        "id": 1,
        "commenter": {
          "id": 10,
          "name": "佐藤部長"
        },
        "content": "値引きは10%まで対応可能です。",
        "created_at": "2026-01-08T18:30:00Z"
      }
    ],
    "created_at": "2026-01-08T18:00:00Z",
    "updated_at": "2026-01-08T18:00:00Z"
  }
}
```

---

### POST /daily-reports

日報を新規作成

#### リクエスト
```json
{
  "report_date": "2026-01-08",
  "visit_records": [
    {
      "customer_id": 1,
      "visit_time": "09:00",
      "content": "新製品の提案を実施"
    },
    {
      "customer_id": 2,
      "visit_time": "11:00",
      "content": "見積もり提出"
    }
  ],
  "problem": "ABC社の案件について、価格交渉が難航している。",
  "plan": "・ABC社へ再訪問\n・新規顧客への電話アプローチ"
}
```

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| report_date | date | ○ | 報告日（YYYY-MM-DD） |
| visit_records | array | ○ | 訪問記録（1件以上） |
| visit_records[].customer_id | number | ○ | 顧客ID |
| visit_records[].visit_time | time | - | 訪問時刻（HH:mm） |
| visit_records[].content | string | ○ | 訪問内容 |
| problem | string | - | 課題・相談 |
| plan | string | - | 明日の予定 |

#### レスポンス（201 Created）
```json
{
  "success": true,
  "data": {
    "id": 1,
    "report_date": "2026-01-08",
    "message": "日報を作成しました"
  }
}
```

#### エラー（409 Conflict）
```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_REPORT",
    "message": "この日付の日報は既に存在します"
  }
}
```

---

### PUT /daily-reports/:id

日報を更新

#### パスパラメータ

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| id | number | 日報ID |

#### リクエスト
```json
{
  "visit_records": [
    {
      "id": 1,
      "customer_id": 1,
      "visit_time": "09:00",
      "content": "新製品の提案を実施（更新）"
    },
    {
      "customer_id": 3,
      "visit_time": "14:00",
      "content": "新規訪問記録"
    }
  ],
  "problem": "更新された課題",
  "plan": "更新された予定"
}
```

#### 備考
- `visit_records[].id` がある場合は更新、ない場合は新規追加
- リクエストに含まれない既存の訪問記録は削除される

#### レスポンス（200 OK）
```json
{
  "success": true,
  "data": {
    "id": 1,
    "message": "日報を更新しました"
  }
}
```

#### エラー（403 Forbidden）
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "この日報を編集する権限がありません"
  }
}
```

---

### DELETE /daily-reports/:id

日報を削除

#### パスパラメータ

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| id | number | 日報ID |

#### レスポンス（200 OK）
```json
{
  "success": true,
  "data": {
    "message": "日報を削除しました"
  }
}
```

---

## コメントAPI

### GET /daily-reports/:id/comments

日報のコメント一覧を取得

#### パスパラメータ

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| id | number | 日報ID |

#### レスポンス（200 OK）
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "commenter": {
          "id": 10,
          "name": "佐藤部長"
        },
        "content": "値引きは10%まで対応可能です。",
        "created_at": "2026-01-08T18:30:00Z"
      },
      {
        "id": 2,
        "commenter": {
          "id": 10,
          "name": "佐藤部長"
        },
        "content": "資料を共有フォルダに入れておきました。",
        "created_at": "2026-01-08T19:00:00Z"
      }
    ]
  }
}
```

---

### POST /daily-reports/:id/comments

日報にコメントを追加（上長のみ）

#### パスパラメータ

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| id | number | 日報ID |

#### リクエスト
```json
{
  "content": "明日の訪問頑張ってください。"
}
```

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| content | string | ○ | コメント内容 |

#### レスポンス（201 Created）
```json
{
  "success": true,
  "data": {
    "id": 3,
    "content": "明日の訪問頑張ってください。",
    "created_at": "2026-01-08T20:00:00Z"
  }
}
```

#### エラー（403 Forbidden）
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "コメントを追加する権限がありません"
  }
}
```

---

### DELETE /comments/:id

コメントを削除

#### パスパラメータ

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| id | number | コメントID |

#### レスポンス（200 OK）
```json
{
  "success": true,
  "data": {
    "message": "コメントを削除しました"
  }
}
```

---

## 顧客API

### GET /customers

顧客一覧を取得

#### クエリパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| name | string | - | 顧客名（部分一致） |
| is_active | boolean | - | 有効フラグ |
| page | number | - | ページ番号 |
| per_page | number | - | 1ページあたり件数 |

#### レスポンス（200 OK）
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "株式会社ABC",
        "address": "東京都千代田区...",
        "phone": "03-1234-5678",
        "email": "contact@abc.co.jp",
        "is_active": true,
        "created_at": "2026-01-01T00:00:00Z",
        "updated_at": "2026-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total_pages": 3,
      "total_count": 50
    }
  }
}
```

---

### GET /customers/:id

顧客詳細を取得

#### パスパラメータ

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| id | number | 顧客ID |

#### レスポンス（200 OK）
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "株式会社ABC",
    "address": "東京都千代田区...",
    "phone": "03-1234-5678",
    "email": "contact@abc.co.jp",
    "is_active": true,
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-01T00:00:00Z"
  }
}
```

---

### POST /customers

顧客を新規作成（管理者のみ）

#### リクエスト
```json
{
  "name": "株式会社DEF",
  "address": "大阪府大阪市...",
  "phone": "06-1234-5678",
  "email": "contact@def.co.jp"
}
```

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| name | string | ○ | 顧客名 |
| address | string | - | 住所 |
| phone | string | - | 電話番号 |
| email | string | - | メールアドレス |

#### レスポンス（201 Created）
```json
{
  "success": true,
  "data": {
    "id": 51,
    "name": "株式会社DEF",
    "message": "顧客を作成しました"
  }
}
```

---

### PUT /customers/:id

顧客を更新（管理者のみ）

#### パスパラメータ

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| id | number | 顧客ID |

#### リクエスト
```json
{
  "name": "株式会社ABC（更新）",
  "address": "東京都港区...",
  "phone": "03-9876-5432",
  "email": "new@abc.co.jp",
  "is_active": true
}
```

#### レスポンス（200 OK）
```json
{
  "success": true,
  "data": {
    "id": 1,
    "message": "顧客を更新しました"
  }
}
```

---

## 営業担当者API

### GET /sales-staff

営業担当者一覧を取得

#### クエリパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| name | string | - | 氏名（部分一致） |
| is_active | boolean | - | 有効フラグ |
| page | number | - | ページ番号 |
| per_page | number | - | 1ページあたり件数 |

#### レスポンス（200 OK）
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "田中一郎",
        "email": "tanaka@example.com",
        "manager": {
          "id": 10,
          "name": "佐藤部長"
        },
        "is_active": true,
        "created_at": "2026-01-01T00:00:00Z",
        "updated_at": "2026-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total_pages": 1,
      "total_count": 15
    }
  }
}
```

---

### GET /sales-staff/:id

営業担当者詳細を取得

#### パスパラメータ

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| id | number | 営業担当者ID |

#### レスポンス（200 OK）
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "田中一郎",
    "email": "tanaka@example.com",
    "manager": {
      "id": 10,
      "name": "佐藤部長"
    },
    "subordinates": [],
    "is_active": true,
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-01T00:00:00Z"
  }
}
```

---

### POST /sales-staff

営業担当者を新規作成（管理者のみ）

#### リクエスト
```json
{
  "name": "新人太郎",
  "email": "shinjin@example.com",
  "password": "password123",
  "manager_id": 10
}
```

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| name | string | ○ | 氏名 |
| email | string | ○ | メールアドレス |
| password | string | ○ | パスワード（8文字以上） |
| manager_id | number | - | 上長ID |

#### レスポンス（201 Created）
```json
{
  "success": true,
  "data": {
    "id": 16,
    "name": "新人太郎",
    "message": "営業担当者を作成しました"
  }
}
```

#### エラー（409 Conflict）
```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_EMAIL",
    "message": "このメールアドレスは既に使用されています"
  }
}
```

---

### PUT /sales-staff/:id

営業担当者を更新（管理者のみ）

#### パスパラメータ

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| id | number | 営業担当者ID |

#### リクエスト
```json
{
  "name": "田中一郎（更新）",
  "email": "tanaka-new@example.com",
  "manager_id": 10,
  "is_active": true
}
```

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| name | string | - | 氏名 |
| email | string | - | メールアドレス |
| password | string | - | パスワード（変更時のみ） |
| manager_id | number | - | 上長ID |
| is_active | boolean | - | 有効フラグ |

#### レスポンス（200 OK）
```json
{
  "success": true,
  "data": {
    "id": 1,
    "message": "営業担当者を更新しました"
  }
}
```

---

## エラーコード一覧

| コード | HTTPステータス | 説明 |
|--------|---------------|------|
| INVALID_CREDENTIALS | 401 | 認証情報が不正 |
| TOKEN_EXPIRED | 401 | トークン有効期限切れ |
| FORBIDDEN | 403 | 権限なし |
| NOT_FOUND | 404 | リソースが見つからない |
| VALIDATION_ERROR | 400 | バリデーションエラー |
| DUPLICATE_REPORT | 409 | 日報の重複 |
| DUPLICATE_EMAIL | 409 | メールアドレスの重複 |
| INTERNAL_ERROR | 500 | サーバー内部エラー |

---

## バリデーションエラー詳細

バリデーションエラー時は `details` フィールドに詳細を含む

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力内容に誤りがあります",
    "details": [
      {
        "field": "email",
        "message": "正しいメールアドレスを入力してください"
      },
      {
        "field": "password",
        "message": "パスワードは8文字以上で入力してください"
      }
    ]
  }
}
```
