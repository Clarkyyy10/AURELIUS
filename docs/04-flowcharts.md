# System Flowcharts

Source: manuscript Section 3.12 (Figures 7 to 10), redrawn from the text and updated with the grill-me decisions. They are not copies of the manuscript images.

Colors show who acts: **blue** is the customer, **green** is the system, **amber** is the owner. Decisions use the color of the actor who decides. Dashed arrows are return paths.

## Status lifecycles

### Custom order (viewer design)

```mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> Submitted: customer submits
    Submitted --> UnderReview
    UnderReview --> Submitted: revision requested, customer resubmits
    UnderReview --> Rejected: owner rejects
    UnderReview --> DesignApproved: owner approves
    DesignApproved --> QuotationIssued
    QuotationIssued --> QuotationAccepted: customer accepts
    QuotationIssued --> Declined: customer declines
    QuotationIssued --> QuotationIssued: expired, refreshed quotation
    QuotationAccepted --> DownPaymentVerified
    DownPaymentVerified --> InProduction
    InProduction --> ReadyForClaiming
    ReadyForClaiming --> Claimed
    ReadyForClaiming --> Unclaimed: unclaimed period passes
    Draft --> [*]: customer deletes
    Rejected --> [*]
    Declined --> [*]
    Claimed --> [*]
```

### Service request

```mermaid
stateDiagram-v2
    [*] --> Submitted
    Submitted --> Received: owner receives the item
    Received --> UnderAssessment
    UnderAssessment --> QuotationIssued: binding quotation after inspection
    QuotationIssued --> QuotationAccepted
    QuotationIssued --> QuotationDeclined
    QuotationDeclined --> ReturnPending: Declined, item to be returned
    ReturnPending --> Claimed
    QuotationAccepted --> DownPaymentVerified
    DownPaymentVerified --> InProgress
    InProgress --> Completed
    Completed --> ReadyForClaiming
    ReadyForClaiming --> Claimed
    ReadyForClaiming --> Unclaimed: unclaimed period passes
    Claimed --> [*]
```

### Ready-made order

The status sequence is not defined yet (N45, **Open**). This is a proposal.

```mermaid
stateDiagram-v2
    [*] --> Placed
    Placed --> Confirmed: owner confirms, one unit reserved
    Placed --> Cancelled: customer cancels
    Confirmed --> PaymentSubmitted: customer submits proof or pays cash
    Confirmed --> Expired: reservation deadline passes, unit returns
    PaymentSubmitted --> PaymentVerified
    PaymentSubmitted --> Confirmed: proof rejected
    PaymentVerified --> ReadyForClaiming
    ReadyForClaiming --> Claimed
    Claimed --> [*]
```

## Figure 7. 3D Design Customization

```mermaid
flowchart TD
    A1(["Customer opens the ring viewer"]):::cust
    A2["Customer picks ring style, metal, color, stones, size"]:::cust
    S1["System renders the ring in 3D"]:::sys
    S2["System shows itemized estimate of weight and price,<br/>labeled as an estimate"]:::sys
    D1{"Happy with the design?"}:::cust
    A3["Customer saves a draft"]:::cust
    A4["Customer submits the design"]:::cust
    S3["System saves itemized rate snapshot<br/>and notifies the owner"]:::sys
    O1["Owner reviews the design and estimate"]:::own
    D2{"Owner decision"}:::own
    O2["Owner writes revision remarks"]:::own
    S4["System notifies the customer"]:::sys
    A5["Customer reads remarks and adjusts the design"]:::cust
    O3["Owner rejects with reason"]:::own
    O4["Owner approves the design"]:::own
    S5["Order moves to quotation"]:::sys
    S6["System shows a notice if the estimate<br/>changed when a draft is reopened"]:::sys
    X(["End"]):::sys

    A1 --> A2 --> S1 --> S2 --> D1
    D1 -- "No, change options" --> A2
    D1 -- "Save for later" --> A3
    A3 -.-> S6 -.-> A2
    D1 -- "Yes" --> A4 --> S3 --> O1 --> D2
    D2 -- "Revise" --> O2 --> S4 --> A5
    A5 -. "resubmit" .-> S3
    D2 -- "Reject" --> O3 --> X
    D2 -- "Approve" --> O4 --> S5 --> X

    classDef cust fill:#dbeafe,stroke:#1d4ed8,color:#0f172a
    classDef sys fill:#dcfce7,stroke:#15803d,color:#0f172a
    classDef own fill:#fef3c7,stroke:#b45309,color:#0f172a
```

## Figure 8. E-Commerce

Part A covers ready-made products. Part B covers the quotation, payment and claiming steps shared by custom orders, owner-entered orders and services.

```mermaid
flowchart TD
    subgraph PartA["A. Ready-made order"]
        A1(["Customer browses the catalog"]):::cust
        D1{"Stock available?"}:::sys
        A2["Customer places an order"]:::cust
        S1["System shows listed price<br/>and notifies the owner by email"]:::sys
        D2{"Owner confirms?"}:::own
        O1["Owner confirms<br/>one unit reserved"]:::own
        S2["System sends payment instructions<br/>and reservation deadline"]:::sys
        O0["Owner declines the order"]:::own
        N1["Not orderable, marked unavailable"]:::sys
        D3{"Proof or cash within the deadline?"}:::sys
        S3["Reservation expires<br/>unit returns to stock"]:::sys
        A1 --> D1
        D1 -- "No" --> N1
        D1 -- "Yes" --> A2 --> S1 --> D2
        D2 -- "No" --> O0
        D2 -- "Yes" --> O1 --> S2 --> D3
        D3 -- "No" --> S3
    end

    subgraph PartB["B. Quotation, payment, claiming"]
        Q1["Owner issues quotation<br/>final price, down payment, date, validity"]:::own
        S4["System saves rate snapshot<br/>and emails the customer"]:::sys
        D4{"Customer decision"}:::cust
        C1["Customer declines, order ends"]:::cust
        C2["Customer accepts"]:::cust
        D5{"Valid before expiry?"}:::sys
        R1["Customer requests a refreshed quotation"]:::cust
        P1["Customer submits transfer proof<br/>or pays cash in the store"]:::cust
        O2["Owner verifies the payment"]:::own
        D6{"Proof valid?"}:::own
        O3["Owner rejects with a reason"]:::own
        S5["System notifies the customer"]:::sys
        O4["Owner records payment and balance"]:::own
        O5["Owner updates the status to in production"]:::own
        S6["System notifies the customer of status changes"]:::sys
        S7["Ready for claiming:<br/>system issues the claim code"]:::sys
        C3["Customer comes to the store with code and ID"]:::cust
        O6["Owner checks code and ID<br/>representative needs authorization and own ID"]:::own
        D7{"Balance is zero?"}:::sys
        O7["Owner confirms release anyway"]:::own
        O8["Owner records recipient, date, balance paid<br/>status Claimed"]:::own
        U1["Unclaimed period passes<br/>Unclaimed, owner's discretion"]:::sys
        Q1 --> S4 --> D4
        D4 -- "Decline" --> C1
        D4 -- "Accept" --> D5
        D5 -- "Expired" --> R1
        R1 -. "new quotation" .-> Q1
        D5 -- "Valid" --> C2 --> P1 --> O2 --> D6
        D6 -- "No" --> O3 --> S5
        S5 -. "customer resubmits" .-> P1
        D6 -- "Yes" --> O4 --> O5 --> S6 --> S7
        S7 --> C3 --> O6 --> D7
        D7 -- "No" --> O7 --> O8
        D7 -- "Yes" --> O8
        S7 -. "reminders, then" .-> U1
    end

    D3 -- "Yes" --> O2

    classDef cust fill:#dbeafe,stroke:#1d4ed8,color:#0f172a
    classDef sys fill:#dcfce7,stroke:#15803d,color:#0f172a
    classDef own fill:#fef3c7,stroke:#b45309,color:#0f172a
```

### Cancellation and settlement

```mermaid
flowchart TD
    A(["Customer or owner requests cancellation"]):::cust
    D1{"Down payment verified?"}:::sys
    S1["Cancel freely, nothing to settle"]:::sys
    S2["Request goes to the owner"]:::sys
    O1["Owner decides and records the outcome:<br/>refunded in full, refunded in part with reason, or retained with reason"]:::own
    S3["System notifies the customer"]:::sys
    O2["Owner hands back any refund as cash or transfer<br/>outside the system"]:::own
    A --> D1
    D1 -- "No" --> S1
    D1 -- "Yes" --> S2 --> O1 --> S3 --> O2
    classDef cust fill:#dbeafe,stroke:#1d4ed8,color:#0f172a
    classDef sys fill:#dcfce7,stroke:#15803d,color:#0f172a
    classDef own fill:#fef3c7,stroke:#b45309,color:#0f172a
```

## Figure 9. Service Management

```mermaid
flowchart TD
    A1(["Customer opens the service catalog"]):::cust
    A2["Customer submits a request:<br/>item details and service type"]:::cust
    S1["System records the request as Submitted<br/>and emails the owner"]:::sys
    O1["Owner may give an optional<br/>non-binding estimate range"]:::own
    A3["Customer brings the item to the store"]:::cust
    O2["Owner marks it Received<br/>and inspects it: Under assessment"]:::own
    O3["Owner issues the binding quotation:<br/>cost, procedure, date, validity"]:::own
    S2["System notifies the customer"]:::sys
    D1{"Customer decision"}:::cust
    C1["Quotation declined"]:::cust
    S3["Status: Declined, item to be returned"]:::sys
    O4["Customer picks up the item<br/>status Claimed"]:::own
    C2["Quotation accepted"]:::cust
    O5["Owner records the down payment, if any<br/>after acceptance only"]:::own
    O6["Owner sets In progress"]:::own
    O7["Owner sets Completed"]:::own
    S4["Status: Ready for claiming<br/>system issues claim code and emails the customer"]:::sys
    A4["Customer claims the item and pays the balance"]:::cust
    O8["Owner records release<br/>recipient, date, balance paid"]:::own
    D2{"Customer cancels before work starts?"}:::cust
    S5["Owner is notified<br/>verified down payment goes to the owner's decision"]:::sys
    W1["Walk-in without account:<br/>owner creates the profile and the request<br/>no online tracking, owner contacts by text or call"]:::own

    A1 --> A2 --> S1 --> O1 --> A3 --> O2 --> O3 --> S2 --> D1
    D1 -- "Decline" --> C1 --> S3 --> O4
    D1 -- "Accept" --> C2 --> O5 --> O6 --> O7 --> S4 --> A4 --> O8
    D2 -. "Yes" .-> S5
    W1 -. "same status flow" .-> O2

    classDef cust fill:#dbeafe,stroke:#1d4ed8,color:#0f172a
    classDef sys fill:#dcfce7,stroke:#15803d,color:#0f172a
    classDef own fill:#fef3c7,stroke:#b45309,color:#0f172a
```

## Figure 10. AI Chatbot

```mermaid
flowchart TD
    A1(["Customer sends a message<br/>English, Filipino or Taglish"]):::cust
    S1["System checks rate limit and message length"]:::sys
    D0{"Within limits?"}:::sys
    S0["Ask the customer to wait or shorten the message"]:::sys
    S2["System reads live store data from the database:<br/>products, services, options and rates, policy, FAQ"]:::sys
    S3["Gemini 2.5 Flash answers from that data only"]:::sys
    D1{"Inside scope?"}:::sys
    S4["Refer the customer to the owner<br/>no final price, no completion date<br/>unsupported pieces: platform covers rings only"]:::sys
    D2{"Customer wants help preparing a request?"}:::cust
    S5["Reply in the customer's language"]:::sys
    S6["Chatbot asks for type, material, color, gemstone, size<br/>using only the owner's current options, plus notes"]:::sys
    A2["Customer reviews, edits and confirms the summary"]:::cust
    S7["System saves a Draft<br/>visible only to the customer, owner not notified"]:::sys
    S8["Chatbot gives a link to open the draft in the 3D viewer"]:::sys
    D3{"Customer wants to submit?"}:::cust
    A3["Customer edits in the viewer and submits"]:::cust
    A4["Customer tells the chatbot to submit<br/>second explicit confirmation"]:::cust
    S9["System creates the owner-visible request<br/>and sends the owner alert"]:::sys
    X(["End"]):::sys

    A1 --> S1 --> D0
    D0 -- "No" --> S0 --> X
    D0 -- "Yes" --> S2 --> S3 --> D1
    D1 -- "No" --> S4 --> X
    D1 -- "Yes" --> D2
    D2 -- "No, a question" --> S5 --> X
    D2 -- "Yes" --> S6 --> A2 --> S7 --> S8 --> D3
    D3 -- "Later" --> X
    D3 -- "In viewer" --> A3 --> S9
    D3 -- "In chat" --> A4 --> S9
    S9 --> X

    classDef cust fill:#dbeafe,stroke:#1d4ed8,color:#0f172a
    classDef sys fill:#dcfce7,stroke:#15803d,color:#0f172a
    classDef own fill:#fef3c7,stroke:#b45309,color:#0f172a
```

The service-request draft flow (FR-37) is assumed to follow the same draft-then-submit pattern. Confirm it (N14, **Open**).

## Owner alerts and scheduled jobs

```mermaid
flowchart LR
    E1["New order<br/>submitted custom order<br/>service request<br/>payment proof<br/>cancellation request"]:::sys --> M1["Email through Resend<br/>short summary and link"]:::sys --> OW(["Owner"]):::own
    J1["Daily job"]:::sys --> M2["Digest: items waiting,<br/>reservations expiring soon"]:::sys --> OW
    J2["Scheduled jobs"]:::sys --> M3["Reservation expiry<br/>quotation expiry<br/>unclaimed-item reminders"]:::sys
    classDef sys fill:#dcfce7,stroke:#15803d,color:#0f172a
    classDef own fill:#fef3c7,stroke:#b45309,color:#0f172a
```
