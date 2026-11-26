# Entity Relationship Diagram

Source: manuscript Section 3.11 and Figure 6. The diagram is redrawn from the text and extended with the grill-me decisions. Entities and fields marked _(proposed)_ come from the decision notes, not from the manuscript. Field lists are a starting point for the Prisma schema, not final.

## Figure 6. ERD

```mermaid
erDiagram
    users ||--o{ custom_designs : creates
    users ||--o{ orders : places
    users ||--o{ service_requests : submits
    users ||--o{ chat_sessions : opens
    users ||--o{ notifications : receives
    users |o--o| users : "profile linked to account"

    chat_sessions ||--o{ chat_messages : contains
    chat_sessions |o--o{ custom_designs : "drafts from chat"

    custom_designs }o--o{ design_options : uses
    custom_designs |o--o| orders : "becomes"
    products ||--o{ order_items : "listed in"
    orders ||--o{ order_items : contains
    orders ||--o{ quotations : has
    orders ||--o{ payments : "paid by"
    orders ||--o| releases : "released by"

    services ||--o{ service_requests : "requested as"
    service_requests ||--o{ quotations : has
    service_requests ||--o{ payments : "paid by"
    service_requests ||--o| releases : "released by"

    quotations ||--o{ payments : "basis for"
    app_settings ||--o{ payment_accounts : holds
    store_faq }o--|| app_settings : "part of"

    users {
        uuid id PK
        string role "customer or owner, not client-writable"
        string full_name
        string contact_number
        string email "nullable for walk-in profile"
        uuid auth_user_id "null for walk-in profile"
        uuid linked_profile_id "nullable, manual link"
        boolean consent_recorded
        datetime consent_at
    }
    products {
        uuid id PK
        string name
        string description
        string material
        decimal price
        int stock_quantity "proposed"
        string availability "available, made_to_order, unavailable"
        boolean archived "proposed"
    }
    design_options {
        uuid id PK
        string kind "material, color, gemstone, ring_size, ring_style"
        string name
        decimal rate
        decimal density_or_carat "proposed"
        boolean archived "proposed"
    }
    custom_designs {
        uuid id PK
        uuid user_id FK
        string status "draft, submitted, under_review, revision_requested, approved, rejected"
        string source "viewer, chatbot, owner_entered"
        json selected_options
        json estimate_snapshot "itemized, on submission"
        string notes
        datetime submitted_at
    }
    orders {
        uuid id PK
        uuid user_id FK
        string type "ready_made or custom"
        string status
        string source "viewer, owner_entered_outside_viewer"
        string claim_code "unique, unguessable"
        decimal total_price
        datetime reservation_expires_at "ready-made only"
    }
    order_items {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        int quantity
        decimal unit_price_snapshot
    }
    services {
        uuid id PK
        string name
        string description
        boolean archived "proposed"
    }
    service_requests {
        uuid id PK
        uuid user_id FK
        uuid service_id FK
        string item_description
        string preliminary_range "optional, non-binding"
        string status
        string claim_code
    }
    quotations {
        uuid id PK
        uuid order_id FK "nullable"
        uuid service_request_id FK "nullable"
        decimal final_price
        decimal down_payment
        date expected_completion
        json rate_snapshot "itemized"
        datetime valid_until
        string status "issued, accepted, declined, expired"
    }
    payments {
        uuid id PK
        uuid quotation_id FK "nullable"
        decimal amount
        date paid_on
        string channel "cash or transfer"
        string reference_number "unique across payments"
        string proof_path "private storage"
        string state "pending, verified, rejected"
        string rejection_reason
        string settlement "refunded_full, refunded_part, retained"
        decimal settlement_amount
        string settlement_reason
    }
    releases {
        uuid id PK
        string recipient_name
        boolean is_representative
        boolean authorization_seen
        decimal balance_paid
        datetime released_at
    }
    chat_sessions {
        uuid id PK
        uuid user_id FK
        datetime started_at
        datetime expires_at "90 days"
    }
    chat_messages {
        uuid id PK
        uuid session_id FK
        string role "customer or assistant"
        string content
    }
    notifications {
        uuid id PK
        uuid user_id FK
        string event
        string channel "in_app or email"
        datetime read_at
    }
    app_settings {
        uuid id PK
        int reservation_days
        int quotation_valid_days
        int unclaimed_days
        string refund_policy_text
    }
    payment_accounts {
        uuid id PK
        string channel
        string account_name
        string account_number
    }
    store_faq {
        uuid id PK
        string question
        string answer
    }
```

## Design notes

- **Core entities** follow the manuscript: `users`, `custom_designs`, `orders`, `service_requests`, `chat_sessions`, `notifications`, `products`, `design_options`, `services`, `order_items`, `quotations`, `payments`.
- **Walk-in profiles (N30).** A `users` row with no `auth_user_id` is an owner-created profile. The owner links it to a later account manually (N33). The role field is set only on the server, and Row Level Security blocks customers from changing it (N67).
- **Snapshots (N79).** `estimate_snapshot` and `rate_snapshot` freeze the itemized estimate and rates at submission and at quotation. Later rate changes do not alter them.
- **Archive, not delete (N81).** `archived` flags on `products`, `design_options` and `services` keep history readable.
- **Payments.** A `reference_number` cannot repeat across payments (N22). A zero down payment creates no payment row (N29).
- **Release (N86).** `releases` records who received an item, when, and the balance paid. The system warns when the balance is not zero.
- **Chat (N53).** Transcripts are linked to the customer and expire after 90 days (proposed).
- **Drafts (N11).** A draft has status `draft` and is visible only to its customer.
- **Open:** Row Level Security rules for archived records (N84). Draft retention (N13). Whether `payments` allows a reference number again after a rejected proof (N24).
