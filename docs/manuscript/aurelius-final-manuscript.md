> **Source:** `aurelius_final.docx` — faithful conversion to Markdown, 24 Nov 2026. No content was added, removed, or corrected; wording, numbering, tables, and figures follow the source document as-is.

**FEU ROOSEVELT**

MARIKINA

![FEU Roosevelt logo](media/feu-logo.png)

# AURELIUS: An Integrated 3D Design Customization, E-Commerce, and Service Management Platform with an AI-Powered Chatbot for Afable’s Jewelry Store

A Capstone Project Presented to the Faculty of the Bachelor of Science in Information Technology

In Partial Fulfillment of the Requirements for CAPSTONE PROJECT

by

**Afable, Gabriel Clark C.**

**Dela Cruz, Timothy Josh L.**

**Hintay, John Patrick C.**

**Nitura, Christian Mark E.**

**Tapel, Gerald C.**

## Approval Sheet

This capstone project entitled “AURELIUS: An Integrated 3D Design Customization, E-Commerce, and Service Management Platform with an AI-Powered Chatbot for Afable’s Jewelry Store” was prepared and submitted by:

**Afable, Gabriel Clark C.**

**Dela Cruz, Timothy Josh L.**

**Hintay, John Patrick C.**

**Nitura, Christian Mark E.**

**Tapel, Gerald C.**

in partial fulfillment of the requirements for Bachelor of Science in Information Technology, has been examined and is recommended for acceptance and approval.

**Jonas Macapagal** Capstone Adviser

**PANEL OF EXAMINERS**

| **Name** | **Role / Designation** | **Signature / Date** |
| -------- | ---------------------- | -------------------- |
|          |                        |                      |
|          |                        |                      |
|          |                        |                      |

Accepted in partial fulfillment of the requirements for the degree Bachelor of Science in Information Technology.

**Jerick M. Quintua** Program Head, BSIT

## Acknowledgement

_(Empty in the source document.)_

## Abstract

_(Empty in the source document.)_

## List of Tables

_(Empty in the source document.)_

## List of Figures

_(Empty in the source document.)_

## Table of Contents

- Chapter I. Introduction
- 1.0 Background of the Study — p. 1
- 1.1 Project Context and Rationale — p. 2
- 1.2 Statement of the Problem — p. 4
- 1.3 Objectives of the Project — p. 5
- 1.3.1 General Objective — p. 5
- 1.3.2 Specific Objective — p. 5
- 1.4 Scope and Limitations — p. 6
- 1.4.1 Scope — p. 6
- 1.4.2 Limitations — p. 6
- 1.5 Significance of the Study — p. 7
- 1.6 Definition of Terms — p. 8
- Chapter II. Review of Related Literature and System
- 2.1 Related Literature — p. 10
- 2.2 Related Studies — p. 15
- 2.3 Synthesis and Research Gap — p. 20
- 2.4 Conceptual Framework — p. 22
- Chapter III. Methodology
- 3.1 Research Design — p. 26
- 3.2 System Development Methodology — p. 27
- 3.3 Requirements Gathering Methods — p. 30
- 3.4 Respondents of the Study — p. 31
- 3.5 Sampling Method — p. 32
- 3.6 Research Instruments — p. 33
- 3.7 Data Gathering Procedure — p. 34
- 3.8 Statistical Treatment — p. 36
- 3.9 System Requirements — p. 38
- 3.9.1 Functional Requirements — p. 38
- 3.9.2 Non-Functional Requirements — p. 43
- 3.10 System Architecture — p. 49
- 3.11 Entity Relationship Diagram — p. 52
- 3.12 System Flowchart — p. 54
- 3.13 Development Tools and Technologies — p. 58
- 3.14 Testing and Evaluation Procedures — p. 61
- 3.15 Ethical Considerations and Data Privacy — p. 69

## CHAPTER I INTRODUCTION

### 1.0 Background of the Study

Jewelry remains an important personal and sentimental purchase for many consumers, but buying and maintaining it often requires close coordination between the customer and the jewelry store. Customers may want a piece that reflects their preferred material, gemstones, size, color, and overall style, while the store must ensure that the requested design is technically feasible, properly priced, and produced according to the customer’s approved specifications. Jewelry stores also provide after-sales services such as cleaning, polishing, resizing, repair, stone setting, restoration, engraving, casting, plating, and ultrasonic cleaning. These services require careful inspection and customer approval because improper handling may damage delicate materials, gemstones, plated surfaces, or water-resistant watches.

For made-to-order jewelry, it can be difficult for customers to imagine how a finished piece will look based only on descriptions or sample photos, which may lead to misunderstandings, revisions, and delays. Customers also increasingly expect to browse products, place orders, settle payments, and follow the progress of their transactions without having to visit the store or contact it repeatedly. Technologies such as 3D visualization, online ordering systems, service-tracking tools, and AI-powered chatbots can address these needs by giving customers a clearer preview of their design, a single online platform for transactions, visible progress updates, and immediate guidance when they prepare their requests.

These needs are evident in Afable’s Jewelry Store, a small business whose owner personally manages the entire operation because the store does not employ separate workers. The owner handles customer inquiries, reviews custom jewelry designs, provides price estimates, confirms orders, coordinates casting and finishing, records service requests, inspects items, updates customers, processes payments, and releases finished jewelry. Although this arrangement allows the owner to maintain direct control over quality and customer service, managing multiple custom orders and service requests manually can become time-consuming and difficult to organize.

To address these concerns, this study proposes AURELIUS, an integrated 3D design customization, e-commerce, and service management platform with an AI-powered chatbot for Afable’s Jewelry Store. The system will allow customers to create jewelry designs using a 3D viewer, customize material, color, gemstones, and size, receive estimated weight and price information, and submit custom orders for the owner’s review. The owner will confirm the final price, request revisions if necessary, and approve the design before production begins. The platform will also allow customers to browse products, place orders, settle quotations and payments, submit service requests, and track their progress, while the AI-powered chatbot guides them in preparing their requests. By combining 3D visualization, online ordering, service tracking, and AI-assisted customer support, AURELIUS aims to reduce the owner’s manual workload, improve communication with customers.

### 1.1 Project Context and Rationale

Afable’s Jewelry Store is a small, owner-operated business in the jewelry retail and service domain. It sells and produces custom jewelry and provides jewelry and watch services such as cleaning, polishing, resizing, and repair. The store does not employ separate workers, so the owner is responsible for all major functions, including customer service, assessment and quotation, production coordination, recordkeeping, follow-up communication, and payment collection. The store accommodates customers through walk-in transactions and through advance inquiries made by phone call or text message. The store is located in Montalban Public Market.

For jewelry and watch services, the owner personally assists walk-in customers, inspects the jewelry or watch, determines the appropriate service, and provides an estimated cost, proposed procedure, and expected completion or retrieval date. Work begins only after the customer agrees to the quotation, and a down payment may be collected depending on the type of service or transaction. After the service is completed, the owner contacts the customer through a text message or phone call or follows the previously agreed retrieval date. Customers then return to the shop to claim their items and settle any remaining balance.

The store also accepts custom jewelry orders based on the customer’s preferred design, materials, dimensions, and other specifications. The owner evaluates these requirements, provides

an estimated cost and production timeline and begins production once the customer approves the proposal. Completed orders are communicated and claimed in the same manner as services.

At present, the store does not maintain formal records for customers, appointments, service transactions, or payments. The owner manages inquiries, assessments, quotations, service execution, customer coordination, and payment collection manually, which may become difficult when the store receives multiple inquiries, service requests, or custom orders at the same time. Four gaps in the current workflow can be identified. First, the design of a custom piece is agreed upon through discussion and estimates, without a visual preview that the customer and the owner can confirm before quotation and production. Second, product inquiries, orders, quotations, and payments are coordinated through walk-ins, calls, and text messages rather than through one organized channel. Third, jewelry and watch services are not listed in a form that customers can review in advance, and customers cannot follow the progress of their items from drop-off to claiming without contacting the owner. Fourth, customers who are unsure how to describe their service needs or custom-order details must rely on the owner to guide them in person, by call, or by text.

An information technology solution is appropriate for several reasons. The store’s work is information intensive such as specifications, quotations, payment details, appointment dates, and the status of each item must be accurate and easy to retrieve, yet they are currently held in the owner’s memory and in scattered calls and text messages, where they can be forgotten, misunderstood, or lost. The store also depends on a single person, so every inquiry, update, and clarification competes for the owner’s time, and much of this communication is repetitive and could be handled without the owner’s direct involvement. In addition, custom jewelry is a visual product made from costly materials, so confirming the appearance of a design before production is important to avoid rework and disagreement, and this kind of confirmation is well suited to digital visualization. Finally, customers who are used to online transactions expect convenient access and visible progress, and a web-based solution can provide this to a small business without requiring heavy infrastructure or additional staff. A centralized information system can therefore organize the store’s daily transactions, reduce the owner’s reliance on manual communication and informal recordkeeping and give customers clearer and more convenient access to the store’s products and services.

### 1.2 Statement of the Problem

This study proposes the development of AURELIUS, an integrated 3D design customization, e-commerce, and service management platform with an AI-powered chatbot for Afable’s Jewelry Store. Upon its successful development, the system could serve as an alternative to the store’s existing manual and owner-managed process, potentially improving the organization of customer transactions, custom orders, and jewelry and watch services.

The project aims to address the following problems:

- How can the system present a visual preview that helps customers and the owner confirm the jewelry design before quotation and production?
- How can the system provide customers to browse jewelry products, place orders or custom-order requests, settle quotations and payments, and track their order status in one online platform?
- How can the system present the available jewelry and watch services in a service catalog and allow customers to submit service requests with item details and service type, then track the progress of each request from drop-off to claiming?
- How can the AI-powered chatbot guide customers in submitting service requests or custom-order details?
  Through these features, AURELIUS could reduce the owner’s manual workload, organize business records, improve communication between the store and its customers, and support a more efficient management of custom orders and jewelry and watch services.

### 1.3 Objectives of the Project

#### 1.3.1 General Objective

The general objective of this study is to develop AURELIUS, an integrated 3D design customization, e-commerce, and service management platform with an AI-powered chatbot, that will help Afable’s Jewelry Store manage custom jewelry orders, online sales, and jewelry and watch services more efficiently and improve communication with its customers.

#### 1.3.2 Specific Objective

Specifically, the study aims to:

- develop a 3D design customization module that allows customers to customize material, color, gemstones, and size, view the design in a 3D viewer, receive estimated weight and price information, and submit a custom order for the owner’s review, price confirmation, revision request, and approval before quotation and production;
- develop an e-commerce module that allows customers to browse jewelry products, place orders or custom-order requests, settle quotations and payments, and track their order status in one online platform, while the owner records and manages these transactions;
- develop a service management module that presents the available jewelry and watch services in a service catalog, allows customers to submit service requests with item details and service type, and tracks the progress of each request from drop-off to claiming, with customer notification when the item is ready for release.
- integrate an AI-powered chatbot that guides customers in submitting service requests and custom-order details.

### 1.4 Scope and Limitations

#### 1.4.1 Scope

This study covers the design and development of AURELIUS for Afable’s Jewelry Store. The platform is intended for two types of users: the customer and the store owner, who also serves as the system administrator. The system will include the following modules:

- A 3D viewer where customers customize jewelry by material, color, gemstones, and size, with estimated weight and price shown. Custom orders are submitted to the owner, who confirms the final price, requests revisions if necessary, and approves the design before production.
- Product browsing, ordering, custom-order requests, quotation, recording of payments, and order status tracking. The owner uses this module to review, update, and keep records of orders, quotations, and payments.
- A service catalog, service request submission with item details and service type, and status tracking from drop-off to claiming. The owner uses this module to record and update service requests and to notify customers when their item is ready for release.
- AI-Powered Chatbot guidance for customers in submitting service requests and custom-order details.
- The platform is primarily intended for customers residing in or near Montalban, Rizal. However, customers from other areas may also use the system, provided that they can visit Afable’s Jewelry Store for product claiming, service drop-off, and service claiming.

#### 1.4.2 Limitations

The study also has the following limitations:

- The system is developed specifically for Afable’s Jewelry Store and its existing processes; its results may not apply directly to other jewelry stores.
- The 3D viewer is limited to the design options, materials, gemstones, and sizes defined in the system. The estimated weight and price are approximations based on values set by the owner, and the final price remains subject to the owner’s confirmation.
- The system does not replace the owner’s physical inspection of jewelry and watches. Service quotations, procedures, and completion dates are still determined by the owner, and the claiming of finished items and the settlement of any remaining balance take place in the store.
- The payment function is limited to the recording and verification of payments and balances.
- The chatbot is limited to topics related to the store’s products, custom orders, and services, and inquiries it cannot handle are referred to the owner.
- The system is a web-based platform and requires an internet connection and a compatible device or browser.
- The study does not cover inventory of raw materials, employee management, or delivery and courier tracking, since the store has no employees and finished items are claimed in the store.
- The system does not include delivery and courier tracking. Customers outside the store’s immediate service area may place orders or service requests through the platform, but product claiming, service drop-off, service claiming, and any delivery arrangements must be coordinated directly with Afable’s Jewelry Store.

### 1.5 Significance of the Study

The AURELIUS will provide a convenient and transparent platform for managing custom jewelry orders, online sales, and jewelry and watch services at Afable’s Jewelry Store, benefiting multiple stakeholders:

- **Store Owner.** AURELIUS will help the owner organize inquiries, custom orders, quotations, service requests, and payments in one platform. It will reduce repetitive manual tasks and informal recordkeeping, allow the owner to review and approve designs before production, and make it easier to monitor the progress of each order and service.
- **Customers.** Customers will be able to preview and customize jewelry designs, browse products, place orders, submit service requests, and follow the progress of their transactions online. The chatbot will give them guidance in preparing their requests without waiting for the owner to reply, which will make the process more convenient and transparent.
- **Afable’s Jewelry Store.** As a business, the store may benefit from more organized operations, clearer communication with customers, and a more modern way of presenting its products and services, which may support its efficiency and service quality.
- **Future Researchers and Developers.** This study may serve as a reference for those who wish to develop similar systems that combine 3D visualization, e-commerce, service management, and AI-assisted support for small, owner-operated businesses.
- **The Proponents.** The study allows the proponents to apply the knowledge and skills gained in the Bachelor of Science in Information Technology program to a real business problem and to gain experience in analyzing, designing, and developing a complete information system.

### 1.6 Definition of Terms

The following terms are defined as they are used in this study:

- **3D Design Customization** – The feature that allows customers to modify the material, color, gemstones, and size of a jewelry design and view the result in a 3D viewer.
- **AI-Powered Chatbot** – A conversational feature of the system that guides customers in submitting service requests and custom-order details.
- **AURELIUS** – The name of the proposed integrated 3D design customization, e-commerce, and service management platform with an AI-powered chatbot for Afable’s Jewelry Store.
- **Custom Order** – A request for a jewelry piece made according to the customer’s chosen design, material, color, gemstones, size, and other specifications.
- **E-Commerce** – The online browsing, ordering, quotation, payment, and order tracking of jewelry products through the system.
- **Estimated Weight and Price** – Approximate values generated by the system for a customized design, based on the options selected by the customer and the rates set by the owner, subject to the owner’s final confirmation.
- **Order Tracking** – The feature that allows customers to view the status of their orders or custom-order requests.
- **Owner** – The proprietor of Afable’s Jewelry Store, who manages the store’s operations and serves as the system administrator.
- **Quotation** – The estimated cost, procedure or production timeline, and expected completion or retrieval date that the owner provides for a service or a custom order.
- **Service Catalog** – The list of jewelry and watch services offered by the store, such as cleaning, polishing, resizing, repair, stone setting, restoration, engraving, casting, plating, and ultrasonic cleaning, that customers can view in the system.
- **Service Management** – The recording, monitoring, and updating of service requests from drop-off to claiming, together with customer notification.
- **Service Request** – A request submitted by a customer for a jewelry or watch service, including item details and the type of service needed.
- **Status Tracking** – The monitoring of the progress of a service request or order, from submission or drop-off up to the claiming of the finished item.
- **Web-Based Platform** – A system accessed through an internet browser that does not require the user to install it on a device.

## CHAPTER II REVIEW OF RELATED LITERATURE AND SYSTEM

This chapter presents the literature, studies, and systems that are related to the development of AURELIUS. It discusses the concepts and technologies behind 3D design customization, e-commerce, service management, and AI-powered chatbots. It then compares existing studies and systems, identifies the gaps that the proposed platform addresses, and presents the conceptual framework that guides the study.

### 2.1 Related Literature

**Online Product Customization and Sales Configurators**

Made-to-order jewelry is a form of product customization in which the customer specifies part of the product before it is produced. In online retail, the tool that allows a customer to choose among product options and see the result is called a sales configurator. Research on mass customization describes the quality of a configurator through its online sales configurator capabilities: focused navigation, which leads the customer quickly to suitable options; flexible navigation, which allows the customer to change an earlier choice without starting over; easy comparison of alternative configurations; benefit-cost communication, which shows what each choice adds and what it costs; and a user-friendly description of the available options. Meddeb and Moulins (2024) surveyed 263 consumers immediately after they had customized a product online. They found that the perceived usefulness of these capabilities increased the customers' sense of psychological empowerment, and that empowerment led to purchase intention through psychological ownership, the feeling that the configured product was already their own.

The success of a configurator also depends on the whole customization journey and not only on the availability of options. Reviewing more than 15 years of configurator research and practice, Blazek (2023) described how the field moved from proving that configurators are technically viable toward designing customer-centered choice navigation. He argued that a configurator needs a sound technical foundation, but that it succeeds only when its interface is intuitive, guides users through complex choices to a suitable solution, fits the device being used, and uses appropriate visualization to evoke an emotional response. He also identified long loading times and confusing complexity as the main pain points to be removed.

Configurators also matter for the accuracy of what is produced. In a survey of 241 directors responsible for mass customization in the apparel industry, Shi et al. (2023) found through structural equation modeling that a firm's accuracy in measuring consumer preferences directly improved the quality of its customized products and also improved it indirectly through manufacturing flexibility. They also found that customer participation after an order was placed weakened the link between preference measurement and manufacturing flexibility, and they warned that customer changes after the design stage disrupt production. The authors therefore recommended stronger customer service early in the design process. These findings support the expectation in Chapter 1 that capturing and confirming a custom design clearly before production can reduce misunderstanding and rework.

This theme directly informs the 3D design customization module of AURELIUS. The module applies the five capabilities as design criteria:

It limits choices to the materials, colors, gemstones, and sizes that the owner actually offers.

It lets the customer change any option while the 3D model updates.

It shows the estimated weight and price after every change.

It labels each option with its common jewelry name.

In line with the findings of Shi et al. (2023), the design is reviewed and approved by the owner before production begins, so that changes are settled at the design stage rather than after work has started. The options and their rates are maintained by the owner through the administrator interface rather than fixed in the program code, so that the configurator presents only what the store can actually produce at its current prices.

**Immersive Product Visualization in Retail**

Retailers increasingly use three-dimensional (3D), virtual reality (VR), and augmented reality (AR) technologies to let customers inspect products that they cannot physically touch. In a systematic review, Hoffmann and Mai (2022) synthesized 56 empirical papers on consumers' experience with AR, their acceptance of the technology, and its effect on their behavior. They then proposed an integrative framework for future research on what they call augmented shopping reality.

This review shows that interactive product visualization is an established area of retail research, and that its effect on customers depends on their experience and acceptance of the technology rather than on technical realism alone. Together with Blazek's (2023) warning about long loading times, it supports a 3D viewer for AURELIUS that prioritizes clear and responsive interaction and an accurate representation of the selected options over visual effects that could slow the viewer down on ordinary devices.

**E-Commerce Adoption Among Philippine MSMEs**

The digital adoption of small Philippine businesses depends on more than access to technology. Mia et al. (2024) conducted a multiple-case study of nine Philippine MSMEs from different industries, based on in-depth interviews held between December 2020 and November 2021. They found that the firms that adopted digital tools successfully were alert to online opportunities, could reuse their digital skills across business functions, and already had some online presence before the pandemic. Contrary to expectations, lack of money, internet access, and skills were not the main barriers, because free platforms and outsourced help reduced these costs. The main barrier was the hesitation and low readiness of the business owners and their stakeholders, including doubts that digital tools fit their current practices. After adoption, the firms faced a further challenge outside their control: customers' low readiness for digital transactions, driven mainly by cybersecurity concerns, which led some customers to prefer cash on delivery.

The national policy direction has since moved firmly toward digitalization. In April 2024, the Department of Trade and Industry [DTI] (2024) convened the E-Commerce Promotion Council to discuss the E-Commerce Philippines 2024–2028 Roadmap, which builds on the previous roadmap, adds inclusivity and innovation as key elements, and sets 13 strategies and 28 deliverables aimed at building trust between online customers and sellers.

Together, these sources show that a small, owner-operated store such as Afable's Jewelry Store fits the profile of businesses that have remained offline because of established habits and doubts about fit, not because online channels lack value. For this reason, AURELIUS is designed around the owner's existing workflows for quotations, down payments, and claiming rather than replacing them. The sources also show that customer concern about security is a real barrier to trust. AURELIUS therefore includes user authentication, role-based access, records of payments that customers can verify, and compliance with the Data Privacy Act of 2012 (2012).

**After-Sales Service Quality and Operational Transparency**

Jewelry and watch services such as cleaning, resizing, repair, and stone setting are after-sales services, and their quality shapes how customers judge the store. Nguyễn and Lương (2024) surveyed 467 customers of the warranty and repair services of a motorcycle dealership in Vietnam. They found that all five dimensions of after-sales service quality affected loyalty through customer satisfaction, with reliability having the strongest effect (β = 0.357), followed by responsiveness (0.273) and empathy (0.261). Although their setting was vehicle repair, the study shows that delivering a repair as promised and responding to customers promptly are the strongest drivers of satisfaction with an after-sales service.

A large part of the owner's current workload comes from customers asking about the progress of their orders and repairs, and the literature on operational transparency explains why showing this progress matters. Analyzing 4.68 million parcel deliveries of the Cainiao Network, the logistics arm of Alibaba, whose customers could track each step of their delivery, Bray (2023) found that customers punished idle time late in the process more than idle time early in the process. Delivery service scores were higher when visible work activity was concentrated toward the end, which shows that customers are especially sensitive to how a service ends. Hwang et al. (2024) found that when customers could observe the labor and effort that a business put into their service, they felt more gratitude toward it, which raised the perceived value of the service and, in turn, their evaluation of the brand and their intention to purchase. This effect held even in ordinary commercial exchanges between customers and businesses.

This theme supports the status tracking features of both the e-commerce and the service management modules of AURELIUS. In a jewelry or watch service, the work happens out of the customer's sight and often takes several days. The status stages used in the system turn that hidden work into visible progress: _received_, _under assessment_, _in progress_, _completed_, and _ready for claiming_. Based on the reviewed literature, this visibility is expected to reduce follow-up calls and messages to the owner, to make the store's reliability and responsiveness visible to customers, and to improve their perception of the value of the service.

**AI-Powered Chatbots in Customer Service**

Chatbots have become a common tool for automating routine customer inquiries. In a systematic review of 34 studies, Daza et al. (2023) found that text-based chatbots are the type most often implemented by companies. Their main contribution to customer satisfaction, according to the review, is resolving customers' questions and providing solutions to their problems. Nicolescu and Tudorache (2022) reviewed research on customer experience with AI chatbots and grouped the factors that shape it into chatbot-related, customer-related, and context-related factors. This suggests that a chatbot's success depends as much on its fit to the business and its users as on its technology.

For small businesses specifically, Kamil et al. (2026) conducted a systematic review of 39 articles on AI chatbots in micro and small enterprises published between 2014 and 2025. They found that chatbots are most clearly linked to customer satisfaction when they resolve problems quickly and relevantly, and that perceived usefulness is the most consistent driver of adoption. On the customer side, the most consistent barriers were privacy risk, time risk, and anxiety about the technology. On the business side, the practical constraints were integration costs, technical complexity, limited skills, and weak infrastructure.

The literature also documents the limitations of chatbots. Olujimi and Ade-Ibijola (2023), after analyzing 73 articles, noted that ambiguous language can cause a chatbot to misunderstand a query and give a wrong answer, and that domain-specific vocabulary makes implementation more difficult. Large language models (LLMs) add a further risk because they can produce fluent but unsupported content, a problem that Ji et al. (2023) surveyed as hallucination. One widely used remedy is retrieval-augmented generation (RAG). In their survey of retrieval-augmented LLMs, Fan et al. (2024) explained that RAG first retrieves relevant documents from an external knowledge source and then uses them as context for generating the answer. This gives the model reliable and up-to-date knowledge, reduces hallucination, and can be applied to a specific domain with little or no additional training of the model.

These findings shape the boundaries of the AURELIUS chatbot. Because jewelry terms such as stone setting, plating, and resizing are domain-specific, the chatbot draws on a knowledge base of the store's own products, services, and policies. Because an LLM can state information with false confidence, the chatbot is not allowed to give binding prices or completion dates. It must refer inquiries outside its scope to the owner, and it may only pre-fill a draft request that the customer reviews and confirms (FR-36 to FR-40). Because usefulness drives adoption and privacy risk is the main customer barrier, the chatbot is limited to clearly useful tasks and operates under the system's data privacy controls.

### 2.2 Related Studies

**3D Product Presentation and Jewelry Customization**

Zhuzha (2026) studied 3D and AR product visualization in the context most relevant to this project: online jewelry retail, where products are high in value and customers are uncertain about how a piece will look. The study combined case evaluations of the AR try-on features of two jewelry brands with a survey of 264 consumers who had bought jewelry online. Ease of use and emotional engagement with the AR experience predicted brand trust, and brand trust, ease of use, and engagement together predicted purchase intention. Of the respondents, 72% reported greater purchase confidence after an AR try-on. However, the survey was cross-sectional and self-reported, and it covered younger consumers of large brands in the United States.

Raza et al. (2024) conducted three experiments with 174, 154, and 301 participants on virtual reality-based product displays. They found that contextual displays, which show the product in a realistic setting of use, inspired consumers more and led to higher purchase intention than imaginative displays. Inspiration mediated the effect of the display on purchase intention, and consumers' need for uniqueness moderated the link between inspiration and purchase intention.

On the production side, Chen and Shi (2022) developed GemForest, a generative design system that allows users without design training to create jewelry models that are ready for 3D printing. The system combines a snowflake algorithm with a Fourier transform to generate varied geometric patterns, and the authors validated it through a case study and a usability test. GemForest shows that customer-driven jewelry design is technically feasible. However, it focuses on producing printable geometry and does not include ordering, price estimation, owner approval, or after-sales service.

Taken together, these studies show that realistic and interactive 3D views make customers more confident and more willing to buy jewelry and other high-involvement products, and that ease of use and seeing the product in a realistic context matter more than visual effects. They also show that existing work treats 3D presentation as a sales tool for a finished product and ends at the purchase. AURELIUS, in contrast, uses the 3D view as a shared design reference that the owner reviews, revises, and approves before production.

**Online Configurators and Virtual Try-On**

Yi et al. (2022) tested how the interaction design of a mobile 3D configurator affects the customization experience. In a 3 × 2 experiment, 180 participants customized a pair of sneakers using interfaces that differed in navigation pattern and in the way prices were displayed. Tab-based navigation produced higher usability, flexible navigation, and perceived control than a dropdown menu. Showing only the total price gave users the lowest sense of control, while showing the price of each module or option gave them more. Krause et al. (2023) examined the uniqueness of mass-customized products in five experiments, including a large field experiment. They found that telling customers that the product they configured is one of a kind substantially increased its value to them in product domains that are matters of subjective taste, but tended to reduce its value in domains judged mainly by objective quality. Both findings are relevant to jewelry, which is bought largely for its design and personal meaning but is also judged on objective qualities such as metal purity and weight. However, these studies used general consumer products and did not cover the fulfillment steps after a configuration is submitted.

Virtual try-on is a related technology in which augmented reality places a product on a live image of the customer. Baber et al. (2026) studied AR virtual try-on specifically in luxury jewelry retail. They used 28 interviews followed by a survey of 488 Indian luxury jewelry consumers, analyzed through structural equation modeling and an artificial neural network. They found that AR experiences increased immersion and engagement, and that perceived innovativeness moderated key relationships leading to purchase intention. They also noted that most try-on research had focused on apparel and cosmetics rather than jewelry.

These studies confirm that interactive visualization adds both practical and emotional value to jewelry shopping, and that a configurator should show how each choice affects the price. For this reason, AURELIUS displays an itemized estimate of metal, gemstone, labor, and finishing costs after every change. Virtual try-on, however, requires camera-based tracking and high-fidelity 3D models that are costly for a small store to produce, and none of these studies connected visualization to a made-to-order production workflow. AURELIUS therefore adopts browser-based 3D customization rather than AR try-on, which is consistent with the limitations of the study.

**Online Ordering, Payment, and Service Tracking Systems**

At the national level, Bacasmas et al. (2022) studied women-led MSMEs in Metro Manila. They found that the COVID-19 pandemic accelerated their adoption of e-commerce, and that adoption substantially improved their sales growth, customer base, customer satisfaction, and business processes. The study supports the expected benefits of bringing a small Philippine business online, although its respondents were mostly sellers of goods rather than service providers.

For jewelry retail specifically, Shabirin et al. (2024) developed an e-commerce information system for the Sumatera Silver jewelry store, whose manual system had limited its efficiency and market reach and prevented real-time tracking of sales. Built with the prototype method, the system provided real-time data tracking, automated sales reports, and better customer access, and the authors reported significant improvements in operational efficiency. The system, however, focused on the sale of finished products and did not cover custom orders or after-sales services.

For payments, Encarnacion et al. (2025) developed a web-based payment monitoring system for student boarding houses near Caraga State University in Butuan City. It replaced notes and verbal reminders with online billing, payment history, balance monitoring, and real-time updates for tenants, and it was evaluated using the ISO/IEC 25010 software quality model in terms of functional suitability, usability, performance efficiency, and reliability.

For service tracking, Umar and Ahnafi (2025) developed a web-based information system for a small smartphone repair shop that had relied on manual service tracking and had no structured records of inventory and finances. The system provided customer data management, repair tracking, inventory control, and transaction logging; it met its functional requirements, received positive user experience scores, and was reported to reduce service errors. In the Philippines, Candido et al. (2026) developed FixIt Clare, a web-based maintenance request and tracking system for St. Clare College in Caloocan. It provided centralized submission of requests, real-time status tracking from submission to completion, and automated notifications when repairs were completed. Evaluated on the same five ISO/IEC 25010 characteristics used in this study, it obtained means of 4.52 for functional suitability, 4.48 for usability, 4.45 for performance efficiency, 4.39 for reliability, and 4.31 for security, for an overall mean of 4.43.

These studies show that web-based systems can replace manual records of orders, payments, and repair jobs in small organizations, and that request-and-status tracking with notifications is well received by users. Their limitation is scope: each handles one type of transaction, either product sales, payments, or repairs. None combines ready-made sales, custom orders, and jewelry and watch services, and none handles the quotation, down payment, and balance that the owner of Afable's Jewelry Store manages for each transaction.

**Agile Development and Quality Evaluation of Web-Based Systems**

Philippine system studies also support the methodology of this project. Tosper et al. (2025) developed WebYu, a web-based information management system for Barangay Yuson in Guimba, Nueva Ecija, using the Scrum methodology through iterative phases from planning to deployment. The system was evaluated by 75 participants using ISO/IEC 25010 for technical quality and the Technology Acceptance Model for user acceptance, obtaining grand means of 4.62 and 4.74, respectively, with perceived usefulness at 4.78 and ease of use at 4.75. Together with the ISO/IEC 25010 evaluations of Encarnacion et al. (2025) and Candido et al. (2026), this study shows that combining Scrum with ISO/IEC 25010 and acceptance measures is an established and workable approach for Philippine web-based systems, which this study adopts.

**AI Chatbot Implementations in Small Businesses**

Marcineková et al. (2025) implemented an AI chatbot in a Slovak micro-enterprise that operates an e-commerce platform and compared the months before and after deployment. The share of inquiries resolved by the chatbot without staff rose from 60.80% to 85.37%, for an average automation rate of 74.2%, and escalations to human operators fell from 225 to 85 per month. Average customer satisfaction increased significantly, from 3.73 to 4.27 on a five-point scale. The drop in average response time from 118.25 to 64.00 minutes, however, was not statistically significant, and the study covered only one firm over a three-month period.

Manmuean and Tadaamnuaychai (2025) built a chatbot for a small homestay in Thailand using ManyChat on Facebook Messenger. Of 19 booking-related conversations, 14 led to bookings, a 73.68% rate. However, satisfaction reached only 67.14%, and staff had to step in for 25% of interactions, both below the targets set by the authors. Response speed received the highest rating and the naturalness of conversation the lowest, and the chatbot struggled with follow-up questions, changes of topic in the middle of a booking, and discount requests.

Hsueh and Lin (2026) addressed the accuracy problem directly by building a customer service chatbot for an import trading company that combines RAG with a knowledge graph. On 101 test queries scored out of 40 points, the LLM-only configuration averaged 28.65, RAG alone averaged 31.81, and RAG with the knowledge graph averaged 34.58, producing the best response in 74.3% of the queries. The authors noted, however, that building the knowledge graph still required extensive manual review and that their results came from a single industry.

These studies show that a chatbot can handle most routine inquiries in a very small business and can improve customer satisfaction. They also show that chatbots struggle with multi-step requests, need a clear way to hand conversations over to a person, and answer more accurately when grounded in the business's own knowledge. In all three studies, the chatbot answered questions or took bookings. None used a chatbot to collect the structured details of a custom order or a repair request for the business to review.

### 2.3 Synthesis and Research Gap

The related studies apply these ideas to jewelry and small-business systems. Studies on jewelry retail found that realistic 3D and augmented reality presentation increases customers’ trust, confidence, and purchase intention. Experiments on configurator design also showed that clear navigation and the display of the price of each option give users a stronger sense of control. In addition, a generative design system demonstrated that customer-driven jewelry design is technically feasible. However, these studies were mostly conducted with online retailers and large or luxury brands, and their scope generally ends at the purchase or at the production of a printable model.

Studies on ordering, payment, and service tracking systems showed that web-based systems can replace manual records in small organizations. An e-commerce system for a jewelry store improved sales efficiency and tracking, but it addressed sales only. A payment monitoring system replaced handwritten notes and verbal reminders with billing and balance records, while repair and maintenance systems provided request submission, status tracking, and notifications that received high software-quality ratings. Philippine studies also showed that developing a system through Scrum and evaluating it using ISO/IEC 25010 and user acceptance measures is a workable approach, which is the approach adopted in this study. Studies on chatbots in small businesses likewise showed that chatbots can handle routine inquiries and bookings and improve response speed. However, they may struggle with multi-step conversations, require a clear handover to a human representative, and provide more accurate responses when connected to the business’s own knowledge base.

Taken together, the literature and related studies agree that visualization, online transactions, visible progress, and limited-scope chatbots can each improve the customer experience of a small business. However, these functions have been studied separately and mostly in settings other than a single-owner jewelry store. Therefore, there is a need for an integrated system that connects 3D customization, sales, payments, and after-sales service tracking within one platform.

Despite these findings, the review reveals four functional gaps that AURELIUS addresses. The first gap is that visualization is not connected to production. Existing 3D and augmented reality studies use visualization to sell finished products, and their scope ends at the purchase. Configurator research shows that settling the design before production reduces disruption, but none of the reviewed jewelry systems treats the 3D design as a specification that the business can review, revise, price, and approve before production.

The second gap is that sales and services are handled by separate systems. The reviewed systems each cover only one type of transaction: jewelry product sales, payments, or repairs. No reviewed system combines ready-made product sales, custom orders, and after-sales jewelry and watch services under one record of quotations, down payments, balances, and statuses.

The third gap is that service progress in jewelry and watch services remains invisible to customers. Request-and-status tracking with notifications has been applied to campus maintenance and smartphone repair, but not to jewelry and watch services, where each job also involves physical inspection, a quotation, and a down payment.

The fourth gap is that chatbots answer questions but do not prepare requests. The reviewed chatbots answered inquiries or took bookings, but none gathered the structured details of a custom order or a repair request for the business to review.

Therefore, AURELIUS addresses the need for an integrated jewelry-store system that connects visualization, custom-order processing, sales and payment management, service tracking, and chatbot-assisted request preparation in a single platform.

### 2.4 Conceptual Framework

**Conceptual Framework of the Existing System**

The existing process of Afable’s Jewelry Store is manual and owner managed. Customers submit inquiries, orders, and service requests through face-to-face communication. The owner manually records quotations, payments, balances, and service updates, which may cause delayed responses and difficulty in tracking records.

**Figure 1. Conceptual Framework of the Existing System**

![Figure 1](media/figure-01.png)

**Input.** The input of the existing system consists of customer inquiries made through walk-in visits, phone calls, or text messages; the jewelry and watch items that customers bring in for cleaning, polishing, resizing, or repair; the details of custom orders, which customers describe verbally in terms of design, materials, dimensions, and other specifications; the owner's own knowledge of prices, materials, and procedures; and the down payments and balances paid by customers.

**Process.** All steps of the process are performed manually by the owner, as the store does not employ separate workers. The owner assists the customer and inspects the item or the custom-order requirements, determines the appropriate service or design, and provides an estimated cost, procedure, and expected completion or retrieval date. Work begins only after the customer agrees to the quotation, and a down payment may be collected depending on the type of service or transaction. The owner then performs the service or coordinates the casting and finishing of the custom piece. When the work is completed, the owner contacts the customer by text message or phone call or follows the previously agreed retrieval date. The customer returns to the store to claim the item and settle the remaining balance.

**Output.** The output of the existing system is the completed jewelry order or jewelry and watch service. However, the store does not keep formal records of customers, service transactions, or payments; these remain in the owner's memory and in scattered calls and text messages, where they can be forgotten, misunderstood, or lost. The process also produces four limitations identified in Chapter 1: custom designs are agreed upon without a visual preview, inquiries, orders, and payments are spread across separate channels, the progress of an item is not visible to the customer, and customers must rely on the owner to guide them in describing their requests.

**Feedback.** The broken arrow represents the feedback in the existing system, which consists mainly of customers' follow-up calls, text messages, and walk-in visits to ask about the status of their items or to clarify their requests. Each follow-up adds to the owner's workload and competes with the time needed for the actual work.

**Conceptual Framework of the Proposed System**

The proposed system of Afable’s Jewelry Store is a web-based platform that integrates 3D jewelry customization, e-commerce, service management, and an AI-powered chatbot. Customers can create custom designs, place orders, submit repair or watch service requests, track service status, and communicate through the chatbot. The owner can manage products, quotations, payments, balances, and service records in one system, reducing manual recording and improving response time and record tracking.

**Figure 2. Conceptual Framework of the Proposed System**

![Figure 2](media/figure-02.png)

**Input.** The input consists of the knowledge, software, and hardware requirements of the project. The knowledge requirements are the owner's workflows for custom orders, services, quotations, and payments, gathered through interview, observation, and document review; the details of the store's products and services; the 3D customization options, together with the owner's rates for computing the estimated weight and price; and the store knowledge base that grounds the chatbot's answers. The software requirements include the web development stack, a WebGL-based 3D library, a database, and a language model interface for the chatbot. The hardware requirements include the developers' computers, a web hosting environment, and the browsers and mobile devices of the users.

**Process.** The process follows the Agile Scrum methodology in two-week sprints, an approach used successfully in comparable Philippine web-based systems (Tosper et al., 2025). It begins with planning and requirements analysis and proceeds to system design through data flow diagrams, entity-relationship diagrams, interface mockups, and the chatbot conversation flow. The four modules are then developed sprint by sprint: 3D design customization, e-commerce, service management, and the AI-powered chatbot. Each sprint ends with unit and integration testing and a review of the working build by the owner, and system testing is performed after all modules are integrated. The process concludes with the evaluation of the system by 30 respondents using a questionnaire based on ISO/IEC 25010, and the responses are analyzed through frequency, percentage, and weighted arithmetic mean.

**Output.** The output of the study is AURELIUS, an integrated 3D design customization, e-commerce, and service management platform with an AI-powered chatbot for Afable's Jewelry Store. The platform provides owner-approved custom designs, centralized records of orders, quotations, and payments, visible service status from drop-off to claiming, and guided preparation of customer requests. A second output is the evaluated quality of the system in terms of functional suitability, performance efficiency, usability, reliability, and security.

**Feedback.** The broken arrow from the output back to the input represents feedback. The owner's comments at each sprint review are added to the product backlog and addressed in the next sprint, and the respondents' evaluation results identify the improvements to be made before deployment. This feedback loop reflects the iterative nature of Agile development and ensures that the finished platform matches the actual needs of the store and its customers.

## CHAPTER III METHODOLOGY

In this chapter, the System and Program flowchart, Entity Relationship Diagram, System Architecture are indicated. These diagrams are important so that the study is readable to anyone.

### 3.1 Research Design

This study will adopt a descriptive-developmental research design paired with the Agile Software Development Life Cycle (SDLC) methodology to describe the operations of Afable’s Jewelry Store and to design, build, and evaluate AURELIUS, an integrated 3D design customization, e-commerce, and service management platform with an AI-powered chatbot.

The descriptive aspect will characterize the store’s existing manual workflow, including how the owner receives inquiries, assesses and quotes custom orders and services, coordinates production, communicates with customers, and collects payments. This examination will identify the operational gaps addressed by the study and establish the functional and non-functional requirements of the system. It is appropriate because the store’s actual practices have to be understood before any solution can be proposed, which ensures that the requirements are grounded in the store’s operations rather than in assumptions.

The developmental aspect will focus on creating the platform through iterative Agile phases, including requirements analysis, system design, sprint development, and continuous testing. These phases will produce four integrated modules: 3D design customization, e-commerce, service management, and the AI-powered chatbot. This aspect is appropriate because the goal of the study is not merely to analyze the problem but to deliver a functional system, and the iterative cycles allow the developers to refine each feature based on the owner’s feedback after every sprint.

To evaluate the developed platform, a structured survey questionnaire based on selected characteristics of the ISO/IEC 25010 software quality model will be used to gather numerical data from 30 evaluators comprising the owner and family members of Afable’s Jewelry Store, business owners, and customers. Frequencies, percentages, and arithmetic means will be applied to analyze the ratings across five selected software quality characteristics: functional suitability, performance efficiency, usability, reliability, and security. These characteristics are selected because they can be directly assessed by the intended users through actual use of the system. This combined approach provides a systematic basis for progressing from the identification of the store’s operational gaps to the development and evaluation of AURELIUS, with the evaluation results serving as empirical evidence of its software quality.

### 3.2 System Development Methodology

**Figure 3. Scrum Framework**

![Figure 3](media/figure-03.png)

The proponents will adopt the Agile software development methodology, applied through the Scrum framework, to develop AURELIUS. Agile is selected over linear models such as Waterfall because the requirements of the system are expected to be refined as the store owner reviews working builds. The 3D design customization module and the AI-powered chatbot in particular require repeated testing and adjustment that a fixed sequential process cannot accommodate. Scrum is chosen over Rapid Application Development and pure prototyping because it provides defined roles, time-boxed cycles, and a prioritized backlog, which suit a five-member team working on a system with four interdependent modules. The presence of a single owner-operator who can evaluate each build against actual daily processes also makes short feedback cycles practical.

**Figure 4. Scrum Roles and Sprint Cycle**

![Figure 4](media/figure-04.png)

The Scrum roles will be assigned as follows. The store owner will serve as the Product Owner, confirming requirements and accepting completed features. One proponent will serve as the Scrum Master, facilitating meetings and removing obstacles, while the remaining proponents will form the Development Team. The project requirements will be recorded in a product backlog, ordered by priority, and developed over two-week sprints. Each sprint will begin with planning, in which backlog items are selected, and end with a sprint review, in which the owner examines the working build, followed by a retrospective among the proponents.

The methodology will be applied in the phases below:

Phase 1 – Planning. The proponents will define the project scope and objectives and assess feasibility within the capstone timeline. The proponents will seek the owner’s agreement to participate and to the boundaries of the system. The team will identify the four modules, select the development technologies, assign roles, and prepare the initial product backlog and sprint schedule.

Phase 2 – Requirements Analysis. Through interviews and direct observation, the proponents will document how the owner handles custom orders, service requests, inquiries, quotations, and payments. These workflows will be traced to the four operational gaps in the problem statement and converted into functional requirements for each module. Non-functional requirements such as usability, reliability, and browser accessibility will also be set. The requirements will be written as backlog items and refined at the start of later sprints as the owner’s feedback reveals new needs.

Phase 3 – System Design. The proponents will prepare the database schema, use case diagrams, data flow diagrams, entity-relationship diagrams, and interface mockups for the customer and owner views, with special attention to the 3D viewer’s layout. The chatbot’s scope and conversation flow will also be outlined. The overall architecture will be reviewed against the requirements before development begins, while module-level design will be adjusted within each sprint.

Phase 4 – Sprint Development and Testing. The system will be built incrementally, one module at a time, with testing carried out inside each sprint rather than after all development. The 3D design customization module will be built first because it is the most technically complex. The e-commerce module, service management module, and chatbot will follow in later sprints. At the end of every sprint, the completed features will undergo unit testing and integration testing, and the owner will review the working build. The owner’s comments will be added to the backlog and handled in the next sprint.

Phase 5 – System Testing. After all modules are integrated, the proponents will perform system testing against the full set of functional requirements, covering every user flow for both the customer and the owner. Defects will be corrected before the system is presented to the respondents.

Phase 6 – System Evaluation. The proponents will administer the evaluation questionnaire, based on ISO/IEC 25010, to the respondents. The results will be analyzed using the statistical methods in the Statistical Treatment section and used to determine whether AURELIUS meets its objectives and to identify areas for improvement.

Phase 7 – Deployment and Handover. AURELIUS will be deployed to a live web hosting environment, and an orientation session will be conducted so that the owner can operate it independently. User documentation covering the key functions will be provided, marking the transition of the system to its operating environment.

### 3.3 Requirements Gathering Methods

The proponents will use three methods to gather the requirements for AURELIUS: interview, direct observation, and document review. These methods will be applied during the requirements analysis phase and will be directed at the store owner, who is the sole operator of Afable’s Jewelry Store and the primary source of information about its processes.

Interview. A semi-structured interview will be conducted with the store owner to obtain a complete account of how the store manages its daily operations. The interview guide will cover how inquiries are received and answered, how custom orders and jewelry and watch services are quoted, carried out, and released, how payments are collected and recorded, and what difficulties arise when several transactions are handled at once. The owner will also be asked what the owner would want from a system. The semi-structured format lets the proponents follow prepared questions while pursuing clarifications as they come up. The interview will be held at the store and documented through written notes and, with the owner’s consent, an audio recording used to verify the notes afterward.

Direct Observation. The proponents will observe the store’s physical environment and the owner’s handling of walk-in customer transactions. Observation will allow them to verify the interview responses and to note workflow details the owner does not describe, such as the materials used for recordkeeping, the usual sequence of steps in a service transaction, and how finished items are stored before claiming. These observations will inform the design of the service management module, particularly the status stages that an item passes through from drop-off to release.

Document Review. The proponents will review the written materials the store uses in its operations, namely its price references, service cost estimates, and its informal records of ongoing orders and service requests. This review will identify the data fields and categories that the database and interface need to accommodate, such as the materials, gemstones, and service types to be offered in the system, and the rates behind the price estimate. It will also confirm that the store’s recordkeeping is informal and unsystematized, which supports the rationale for a centralized digital platform.

### 3.4 Respondents of the Study

The population of the study consists of the store owner of Afable’s Jewelry Store and the owner’s family, the customers who have previously transacted with the store, and owners of other small businesses. From this population, the study will involve three participant groups, with a total of 30 respondents in the system evaluation: five (5) from the store owner’s group, twenty (20) customers, and five (5) business owners.

Afable’s Jewelry Owner and Family. The store owner will serve as the key informant during requirements gathering. In the system evaluation, the owner will be joined by members of the owner’s family who are familiar with the store’s operations, for a total of five respondents. As the sole operator of the store, the owner is the subject matter expert on its processes and the primary administrator and end-user of AURELIUS. The owner’s participation in requirements gathering ensures that the system is designed around actual operational needs, and the owner’s participation in the evaluation provides direct feedback from the system’s most critical user. The family members are included because they are familiar with the store and its clients and can assess how well the platform fits the store’s day-to-day operations. Because this group is small and limited to the store owner and the owner’s family, all of them will be included and no sampling will be applied.

Customers. The customers will evaluate the customer-facing side of the system, namely its usability, the clarity of the 3D customization viewer, the convenience of the e-commerce features, the informativeness of the service catalog and progress tracking, and the helpfulness of the AI-powered chatbot. Purposive sampling will be used to select them. To qualify, a customer has to (1) have transacted with the store at least once, (2) be able to use a web browser on a computer or mobile device, and (3) agree to take part in the evaluation. Purposive sampling is appropriate because the system is built for the store’s own customers, and only customers familiar with its products and services can judge whether the platform matches their actual needs. The store has no formal customer records and a small client base, so a probability sample cannot be drawn, and the store owner will help identify qualified customers from the owner’s past and current clients.

Business Owners. Owners of other small businesses will evaluate the system from the viewpoint of an owner-operator who manages orders, services, and customer transactions. They will assess its functional suitability, usability, reliability, and overall usefulness for a small business. Purposive sampling will also be used to select them. To qualify, a business owner has to (1) currently own or manage a small business, (2) have handled customer orders, payments, or service requests, and (3) agree to take part in the evaluation. Purposive sampling is appropriate because only owners with similar operating experience can judge whether the platform would be practical for a small, owner-operated business.

### 3.5 Sampling Method

The study will use purposive sampling, a non-probability technique in which respondents are chosen because they have the knowledge or experience the study requires. It is appropriate because the evaluation needs respondents who can judge whether AURELIUS fits the operations of a small, owner-operated jewelry store, and a random sample of the public cannot reliably supply this. The total sample of 30 respondents will be drawn from three groups.

**Store Owner and Family.** The store owner will be included in full, since the owner is the sole proprietor and operator of Afable’s Jewelry Store and the only person who holds the owner-administrator role in the system, so sampling is not applicable to the owner. The four family members will be selected purposively because they are familiar with the store’s operations and its clients and can assess how well the platform fits its day-to-day work. Together with the owner, they will make up the five respondents in this group.

**Customers.** Twenty customers will be selected purposively based on direct experience transacting with the store, whether through a product purchase, a custom jewelry order, or a jewelry or watch service. Because the store serves a limited and identifiable customer base and keeps no formal customer records, a sampling frame for probability sampling cannot be built. The proponents therefore will work with the store owner to identify past and current clients who meet the inclusion criteria and are willing to participate.

**Business Owners.** Five owners of other small businesses will be selected purposively based on owning or managing a small business and having handled customer orders, payments, or service requests. Their operating experience allows them to assess whether the platform would be practical for an owner-operator beyond the store.

### 3.6 Research Instruments

The proponents will use two research instruments: an interview guide and a system evaluation questionnaire.

**Interview Guide.** The interview guide will be used during requirements gathering to structure the semi-structured interview with the store owner. It will consist of open-ended questions organized around the store’s key operational areas: customer inquiry management, custom jewelry order processing, jewelry and watch service handling, payment collection, recordkeeping practices, and the owner’s difficulties with the current manual process. The questions will be designed to gather descriptive and experiential responses rather than numerical answers, in keeping with the qualitative purpose of this phase. The capstone adviser will review the guide before the interview to ensure that its questions are clear, relevant, and sufficient to cover the information needed for requirements specification, and the proponents will revise it according to the adviser’s comments.

**System Evaluation Questionnaire.** The questionnaire will be used during the evaluation phase to gather structured feedback on the quality of the developed system. It will be based on the ISO/IEC 25010 software product quality model, and five characteristics are selected because they can be judged by the store owner, the owner’s family, customers, and business owners through actual use of the system:

- **Functional Suitability** – the degree to which the system provides functions that meet the stated needs of the store owner and customers;
- **Performance Efficiency** – the degree to which the system performs its functions within appropriate response times under normal operating conditions;
- **Usability** – the degree to which the system can be used by its intended users to achieve their goals effectively, efficiently, and with satisfaction;
- **Reliability** – the degree to which the system operates consistently and without failure under defined conditions; and
- **Security** – the degree to which the system protects information and data so that unauthorized access, use, or modification is prevented.
  The remaining ISO/IEC 25010 characteristics, Compatibility and Maintainability, are not included in the questionnaire because they cannot be reliably judged by respondents through short-term use of the system. They are verified instead through compatibility testing across browsers and devices and through the owner’s user acceptance testing.

Each item will be written as a declarative statement describing a specific system behavior or quality, and respondents will rate their agreement using a five-point Likert scale: 5 – Strongly Agree, 4 – Agree, 3 – Neutral, 2 – Disagree, and 1 – Strongly Disagree.

### 3.7 Data Gathering Procedure

The data gathering procedure will be carried out in chronological order, following the phases of the Agile methodology to be adopted by the proponents.

Step 1 – Securing Permissions and Consent. Before data collection begins, the proponents will obtain the written consent of the store owner of Afable’s Jewelry Store to participate in the study, to allow observation of store operations, and to allow review of existing records. The proponents will explain the purpose of the study, the owner’s role in the requirements gathering and evaluation phases, and how the data will be used. The owner will be informed that participation is voluntary and that the owner can withdraw at any time. The same information will be given to the family members, customers, and business owners invited to the evaluation, and each will give consent before answering the questionnaire.

Step 2 – Requirements Gathering. With the owner’s consent, the proponents will conduct the semi-structured interview, perform direct observation of store operations, and review the store’s existing documents, as described in the Requirements Gathering Methods section. The information collected will be documented, organized, and converted into the functional and non-functional requirements of AURELIUS. The requirements will be reviewed with the owner to confirm their accuracy and completeness before system design begins.

Step 3 – System Design and Development. Using the confirmed requirements, the proponents will carry out the design and development phases in two-week sprints, as described in the System Development Methodology section. At the end of each sprint, the proponents will show the owner the working build and gather the owner’s feedback, which will be added to the product backlog for the next sprint.

Step 4 – System Testing. After all four modules are completed, the proponents will conduct unit, integration, and system testing. All identified defects will be corrected before the system is presented to the respondents.

Step 5 – Instrument Validation. While the system is being finalized, the proponents will prepare the evaluation questionnaire. It will be reviewed by the capstone adviser and two experts in information technology, revised according to their comments, and pilot tested with ten individuals who are not part of the final respondents. The internal consistency of the items will be checked using Cronbach’s alpha before the questionnaire is conducted.

Step 6 – System Evaluation. The tested system will be hosted online for the evaluation. The proponents will administer the questionnaire to the 30 respondents: five from the store owner’s group (the owner and the owner’s family), twenty customers, and five business owners. Each respondent will be given access to the system and a period of guided exploration before completing the questionnaire independently, either on paper or through an online form. The proponents will answer procedural questions but will not influence the respondents’ ratings. Completed questionnaires will be checked for completeness before analysis.

Step 7 – Data Analysis and Reporting. The responses will be tabulated and analyzed using the statistical methods described in the Statistical Treatment section. The results will be interpreted against the verbal interpretation scale of the study and used to determine the extent to which AURELIUS meets the ISO/IEC 25010 quality characteristics assessed. The findings will then be organized and reported in the results and discussion chapter.

Step 8 – Deployment and Handover. After the evaluation, the proponents will incorporate the respondents’ suggestions, deploy AURELIUS to a live web hosting environment, and conduct an orientation session for the store owner. User documentation covering the key functions will be provided, completing the development cycle.

Data Handling. All data will be handled in accordance with the Data Privacy Act of 2012 (Republic Act No. 10173). Questionnaire responses will be anonymous, and the interview notes and audio recording will be used only for the study. Only the proponents and the capstone adviser will have access to the data, which will be stored securely and kept only until the study is completed, after which the audio recording and personal information collected will be deleted.

### 3.8 Statistical Treatment

To convert the perceptions of the respondents into quantitative measures, statistical analyses will be applied to the data collected from the system evaluation questionnaire. The statistical tools utilized in this study include:

- **Frequency and Percentage Distribution:** Used to analyze the profile of the respondents and to summarize the distribution of responses across the Likert scale ratings. The formula is expressed as:
  P = (f / n) × 100

Where,

**P** = is the percentage

**f** = is the frequency or number of responses in a category

**n** = is the total number of respondents, which is 30

- **Weighted Arithmetic Mean (WAM):** Used to compute the average rating given by the respondents for every questionnaire item and ISO/IEC 25010 quality characteristic, accounting for the different weights assigned to the Likert scale options. The formula is expressed as:
  X̄ = Σ(f · w) / N

**X̄** = Weighted Arithmetic Mean

**f** = Frequency of responses for each scale option

**w** = Weight or numerical value assigned to the Likert scale option (5, 4, 3, 2, 1)

**N** = Total number of respondents (**N = 30**)

**Σ** = Summation operator representing the sum of all weighted frequencies

The score of each quality characteristic will be computed as the mean of the weighted arithmetic means of its items, and the overall evaluation score will be computed as the mean of the five characteristic scores. The weighted means will be interpreted using the scale in Table 1.

**Table 1: Scale and Verbal Interpretation of the Weighted Mean**

| **Scale / Weight** | **Statistical Range** | **Verbal Interpretation**               |
| ------------------ | --------------------- | --------------------------------------- |
| 5                  | 4.51 – 5.00           | Highly Acceptable (Strongly Agree)      |
| 4                  | 3.51 – 4.50           | Acceptable (Agree)                      |
| 3                  | 2.51 – 3.50           | Moderately Acceptable (Neutral)         |
| 2                  | 1.51 – 2.50           | Unacceptable (Disagree)                 |
| 1                  | 1.00 – 1.50           | Highly Unacceptable (Strongly Disagree) |

### 3.9 System Requirements

#### 3.9.1 Functional Requirements

**Table 2: Functional Requirements**

| **ID**                                     | **Functional Requirement**                                                                                                                                                                                                                                                                                                                                                                                                               | **Priority** |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| **MODULE 1 – 3D Design Customization**     |                                                                                                                                                                                                                                                                                                                                                                                                                                          |              |
| FR-01                                      | The system shall allow customers to select the jewelry material (e.g., gold, silver, stainless steel) from a predefined list set by the owner.                                                                                                                                                                                                                                                                                           | Must         |
| FR-02                                      | The system shall allow customers to select the jewelry color or finish (e.g., yellow gold, white gold, rose gold) from the available options.                                                                                                                                                                                                                                                                                            | Must         |
| FR-03                                      | The system shall allow customers to select the gemstone type, cut, and quantity from a predefined list set by the owner.                                                                                                                                                                                                                                                                                                                 | Must         |
| FR-04                                      | The system shall allow customers to select the jewelry size (e.g., ring size, bracelet length, necklace length) from the available options.                                                                                                                                                                                                                                                                                              | Must         |
| FR-05                                      | The system shall display the customized jewelry design in a 3D viewer that updates whenever the customer changes an option.                                                                                                                                                                                                                                                                                                              | Must         |
| FR-06                                      | The system shall compute and display an estimated weight and price from the customer’s selected options and the rates configured by the owner and shall label them as estimates subject to the owner’s final confirmation.                                                                                                                                                                                                               | Must         |
| FR-07                                      | The system shall allow customers to submit a custom order request with their design specifications for the owner’s review, either directly from the 3D viewer or through the e-commerce module. Both entry points shall create the same single request record.                                                                                                                                                                           | Must         |
| FR-08                                      | The system shall allow the owner to review a submitted custom order request and to confirm, revise, or reject the final price and design before production.                                                                                                                                                                                                                                                                              | Must         |
| FR-09                                      | The system shall allow the owner to request design revisions with written remarks and shall notify the customer of the requested changes.                                                                                                                                                                                                                                                                                                | Must         |
| FR-10                                      | The system shall allow the customer to view the owner’s revision remarks, adjust the design in the 3D viewer, and resubmit it for review.                                                                                                                                                                                                                                                                                                | Must         |
| FR-11                                      | The system shall allow the owner to approve a custom order design, after which the order proceeds to quotation and production.                                                                                                                                                                                                                                                                                                           | Must         |
| **MODULE 2 – E-Commerce**                  |                                                                                                                                                                                                                                                                                                                                                                                                                                          |              |
| FR-12                                      | The system shall allow customers to browse a catalog of jewelry products showing photos, descriptions, materials, and prices.                                                                                                                                                                                                                                                                                                            | Must         |
| FR-13                                      | The system shall display an availability status for each product (available, made to order, or unavailable) and shall prevent orders for products marked unavailable.                                                                                                                                                                                                                                                                    | Must         |
| FR-14                                      | The system shall allow customers to place an order for an available ready-made jewelry product.                                                                                                                                                                                                                                                                                                                                          | Must         |
| FR-15                                      | The system shall allow the owner to issue a quotation for a customer’s order or custom-order request, specifying the final price, the down payment required (if any), and the expected completion date.                                                                                                                                                                                                                                  | Must         |
| FR-16                                      | The system shall allow customers to view a quotation issued by the owner and to accept or decline it.                                                                                                                                                                                                                                                                                                                                    | Must         |
| FR-17                                      | The system shall allow customers to submit payment details (amount, date, reference number) and upload an image of the proof of payment (e.g., receipt or transfer screenshot) for a down payment or full payment.                                                                                                                                                                                                                       | Must         |
| FR-18                                      | The system shall allow the owner to verify and record payments and outstanding balances for each order.                                                                                                                                                                                                                                                                                                                                  | Must         |
| FR-19                                      | The system shall allow customers to track the status of their orders (e.g., pending, confirmed, in production, ready for claiming).                                                                                                                                                                                                                                                                                                      | Must         |
| FR-20                                      | The system shall allow the owner to update the status of each order.                                                                                                                                                                                                                                                                                                                                                                     | Must         |
| FR-21                                      | The system shall allow the owner to view, manage, and maintain records of all orders, quotations, and payments.                                                                                                                                                                                                                                                                                                                          | Must         |
| FR-22                                      | The system shall allow customers to cancel an order or custom-order request that has not yet been confirmed or started in production and shall notify the owner. Later cancellations are referred to the owner.                                                                                                                                                                                                                          | Should       |
| FR-23                                      | The system shall allow customers to view the history of their own orders, custom-order requests, quotations, and payments.                                                                                                                                                                                                                                                                                                               | Should       |
| FR-24                                      | The system shall allow the owner to add, edit, hide, and remove products (photos, description, material, price, and availability status) through the administrator interface.                                                                                                                                                                                                                                                            | Must         |
| **MODULE 3 – Service Management Platform** |                                                                                                                                                                                                                                                                                                                                                                                                                                          |              |
| FR-25                                      | The system shall display a service catalog listing the available jewelry and watch services (e.g., cleaning, polishing, resizing, repair, stone setting, restoration, engraving, casting, plating, ultrasonic cleaning) with descriptions.                                                                                                                                                                                               | Must         |
| FR-26                                      | The system shall allow customers to submit a service request specifying the item to be serviced, the type of service needed, and relevant item details.                                                                                                                                                                                                                                                                                  | Must         |
| FR-27                                      | The system shall allow the owner to review a submitted service request and issue a service quotation with the estimated cost, proposed procedure, and expected completion or retrieval date.                                                                                                                                                                                                                                             | Must         |
| FR-28                                      | The system shall allow customers to view the service quotation and to accept or decline it before work begins.                                                                                                                                                                                                                                                                                                                           | Must         |
| FR-29                                      | The system shall allow the owner to record and update the progress status of each service request from drop-off to claiming (e.g., received, under assessment, in progress, completed, ready for claiming).                                                                                                                                                                                                                              | Must         |
| FR-30                                      | The system shall allow the owner to record the down payment collected at drop-off and the remaining balance to be settled upon claiming.                                                                                                                                                                                                                                                                                                 | Must         |
| FR-31                                      | The system shall allow customers to track the status of their service requests.                                                                                                                                                                                                                                                                                                                                                          | Must         |
| FR-32                                      | The system shall allow the owner to view and manage records of all service requests, quotations, and payments.                                                                                                                                                                                                                                                                                                                           | Must         |
| FR-33                                      | The system shall allow customers to cancel a service request before the owner begins work on it and shall notify the owner.                                                                                                                                                                                                                                                                                                              | Should       |
| FR-34                                      | The system shall allow the owner to add, edit, and hide service catalog entries (name and description) through the administrator interface.                                                                                                                                                                                                                                                                                              | Must         |
| **MODULE 4 – AI-Powered Chatbot**          |                                                                                                                                                                                                                                                                                                                                                                                                                                          |              |
| FR-35                                      | The system shall provide an AI-powered chatbot accessible to customers within the platform.                                                                                                                                                                                                                                                                                                                                              | Must         |
| FR-36                                      | The chatbot shall guide customers in preparing a custom order request within the chat interface by asking about design preferences, materials, gemstones, and size, and shall present a pre-filled text draft summary in the chat that the customer reviews, edits, and confirms. The chatbot shall not automatically generate or modify 3D designs, nor shall it submit a request without the customer’s explicit confirmation in chat. | Must         |
| FR-37                                      | The chatbot shall guide customers in preparing a service request by asking about the item, the type of service needed, relevant details and the chatbot shall not submit a request without the customer’s confirmation.                                                                                                                                                                                                                  | Must         |
| FR-38                                      | The chatbot shall answer customer inquiries about the store’s available products, services, and service catalog.                                                                                                                                                                                                                                                                                                                         | Should       |
| FR-39                                      | The chatbot shall recognize when an inquiry falls outside its defined scope and shall refer the customer to the store owner.                                                                                                                                                                                                                                                                                                             | Must         |
| FR-40                                      | The chatbot shall not provide binding quotations, final prices, or production commitments on behalf of the owner.                                                                                                                                                                                                                                                                                                                        | Must         |
| **GENERAL / ADMINISTRATION**               |                                                                                                                                                                                                                                                                                                                                                                                                                                          |              |
| FR-41                                      | The system shall require customers to register with a valid email address and contact number and to verify their email address through a confirmation link before placing orders or submitting requests.                                                                                                                                                                                                                                 | Must         |
| FR-42                                      | The system shall require customers to log in with their credentials before using transactional features.                                                                                                                                                                                                                                                                                                                                 | Must         |
| FR-43                                      | The system shall allow users to reset a forgotten password through a time-limited link sent to their registered email address.                                                                                                                                                                                                                                                                                                           | Must         |
| FR-44                                      | The system shall allow customers to view and update their name and contact details and to change their password.                                                                                                                                                                                                                                                                                                                         | Should       |
| FR-45                                      | The system shall present a data privacy notice at registration and require the customer’s consent before personal data is collected.                                                                                                                                                                                                                                                                                                     | Must         |
| FR-46                                      | The system shall provide the owner with a secure administrator account to manage products, services, orders, quotations, payments, and system settings.                                                                                                                                                                                                                                                                                  | Must         |
| FR-47                                      | The system shall allow the owner to configure the material, color, gemstone, and size options available in the 3D customization module, together with their associated rates.                                                                                                                                                                                                                                                            | Must         |
| FR-48                                      | The system shall maintain a transaction history for each customer, accessible to the owner, covering all orders, service requests, quotations, and payments.                                                                                                                                                                                                                                                                             | Should       |
| FR-49                                      | The system shall notify customers through in-app notifications and email of key events: design revision requested, quotation issued, order or service status changed, and item ready for claiming.                                                                                                                                                                                                                                       | Must         |
| FR-50                                      | The system shall notify the owner through in-app notifications of new orders, custom-order requests, service requests, and payment submissions.                                                                                                                                                                                                                                                                                          | Must         |

#### 3.9.2 Non-Functional Requirements

**Table 3: Non-Functional Requirements**

| **Category**           | **Requirement / Metric**                                                                                                                           | **Target / Criterion**                                                                                                                                                                                                                                                                                                            |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Functional Suitability | All Must-priority functional requirements shall be implemented and verifiable through test cases.                                                  | 100% of Must-priority test cases pass before system evaluation. Any Should-priority requirement not met is recorded in the backlog.                                                                                                                                                                                               |
| Functional Suitability | The 3D viewer shall accurately reflect the customer's selected material, color, gemstone, and size options.                                        | No discrepancy between the selected options and the 3D display across every available option value tested at least once.                                                                                                                                                                                                          |
| Functional Suitability | The estimated weight and price shall be computed from the formula and rates configured by the owner.                                               | Computed price and weight equal the owner's manual computation with the same rates, rounded to the displayed precision (nearest peso for price, 0.01 g for weight), across at least 20 configurations covering all materials, gemstones, and sizes. Finished-piece weight remains an approximation, as stated in the limitations. |
| Functional Suitability | The chatbot shall give correct and relevant responses within its defined scope.                                                                    | At least 80% of responses to a test set of at least 50 queries are correct and relevant; 100% of out-of-scope queries are referred to the owner; no response presents an estimate as a final price or completion date.                                                                                                            |
| Performance Efficiency | Standard pages (product catalog, service catalog, order history) shall load within an acceptable time on a broadband connection.                   | Page load time ≤ 3 seconds (average of at least three runs).                                                                                                                                                                                                                                                                      |
| Performance Efficiency | Standard pages shall remain usable on a mobile data connection.                                                                                    | Page load time ≤ 5 seconds on a 4G mobile connection (average of at least three runs).                                                                                                                                                                                                                                            |
| Performance Efficiency | The 3D viewer shall load and respond within an acceptable time.                                                                                    | Initial load of the base model ≤ 5 seconds; display update ≤ 3 seconds per option change under normal conditions.                                                                                                                                                                                                                 |
| Performance Efficiency | 3D model assets shall be optimized for web and mobile use.                                                                                         | Each 3D model file ≤ 5 MB.                                                                                                                                                                                                                                                                                                        |
| Performance Efficiency | The chatbot shall respond within an acceptable time.                                                                                               | Chatbot response time ≤ 5 seconds per message under normal conditions.                                                                                                                                                                                                                                                            |
| Performance Efficiency | The system shall handle the expected number of concurrent users without degraded response or errors.                                               | Remains functional and within the response time targets above with up to 30 simultaneous users.                                                                                                                                                                                                                                   |
| Usability              | First-time customers shall be able to complete a custom order request and a service request without help beyond the chatbot's guidance.            | At least 80% of customer respondents complete both task scenarios unaided during the evaluation.                                                                                                                                                                                                                                  |
| Usability              | The owner shall be able to review and process orders, quotations, and service requests after the orientation session without developer assistance. | At least 80% of owner-group and business-owner respondents complete the owner task scenarios unaided.                                                                                                                                                                                                                             |
| Usability              | The system shall be rated acceptable for usability by respondents.                                                                                 | Usability characteristic mean (WAM) ≥ 3.51 ("Acceptable"). Any item with a mean below 3.51 is flagged for improvement.                                                                                                                                                                                                            |
| Usability              | The interface and chatbot shall use clear, plain English, and error messages shall state what went wrong and how to correct it.                    | All user-facing text and error messages pass a review checklist. Filipino or Taglish input is outside the defined scope and is listed as a limitation.                                                                                                                                                                            |
| Reliability            | The system shall be available during the evaluation period.                                                                                        | Uptime ≥ 95% during the evaluation period, excluding announced maintenance.                                                                                                                                                                                                                                                       |
| Reliability            | The system shall operate without critical failure during testing and evaluation.                                                                   | No critical failure (core function inoperable or data lost) is recorded in the defect log during system testing and the evaluation period.                                                                                                                                                                                        |
| Reliability            | The system shall preserve the integrity of transaction records when a session ends unexpectedly.                                                   | When a submission is interrupted (browser closed, connection lost), the record is either saved completely or not saved; no partial or duplicate records are created. Tested on order, quotation, service request, and payment submissions.                                                                                        |
| Reliability            | All forms shall validate required fields and formats and shall display descriptive error messages.                                                 | 100% of defined validation rules are enforced with descriptive messages.                                                                                                                                                                                                                                                          |
| Reliability            | The system shall be recoverable after data loss.                                                                                                   | Automated daily database backups retained for at least 7 days; one successful restore test performed before deployment.                                                                                                                                                                                                           |
| Security               | Only authenticated users shall access the platform's transactional features.                                                                       | Unauthenticated access to any protected page redirects to the login screen.                                                                                                                                                                                                                                                       |
| Security               | The administrator functions shall not be accessible to customer accounts, and customers shall not access other customers' records.                 | Role-based access control enforced in all modules, including direct URL and request manipulation.                                                                                                                                                                                                                                 |
| Security               | Passwords shall be stored hashed and shall never be stored or transmitted in plaintext.                                                            | Industry-standard hashing algorithm (e.g., bcrypt) in use; minimum password length of 8 characters.                                                                                                                                                                                                                               |
| Security               | All form inputs shall be validated and sanitized on the server side.                                                                               | No injection or cross-site scripting (XSS) vulnerability is found when tested against the OWASP Top 10 checklist and sample attack inputs.                                                                                                                                                                                        |
| Security               | All data transmission between the browser and the server shall be encrypted.                                                                       | HTTPS enforced on all pages; HTTP requests redirect to HTTPS.                                                                                                                                                                                                                                                                     |
| Security               | Sessions and login attempts shall be controlled.                                                                                                   | Sessions expire after 30 minutes of inactivity and are invalidated on logout; login is temporarily blocked for 15 minutes after 5 consecutive failed attempts.                                                                                                                                                                    |
| Security               | Uploaded proof-of-payment files shall be restricted and checked.                                                                                   | Only JPG, PNG, or PDF files up to 5 MB are accepted; type and size are checked on the server; uploaded files cannot be executed.                                                                                                                                                                                                  |
| Security               | Personal data shall be handled in accordance with the Data Privacy Act of 2012 (RA 10173).                                                         | Only data needed for transactions is collected; consent is recorded at registration; personal data is visible only to the account holder and the owner.                                                                                                                                                                           |
| Compatibility          | The system shall function correctly on the current and one previous major version of Google Chrome, Mozilla Firefox, Microsoft Edge, and Safari.   | All core user flows pass functional testing on every target browser.                                                                                                                                                                                                                                                              |
| Compatibility          | The system shall be fully functional on mobile devices through a responsive layout.                                                                | All customer and owner workflows are completable on a smartphone screen of 360 px width or larger.                                                                                                                                                                                                                                |
| Compatibility          | The 3D viewer shall handle browsers or devices that lack WebGL support.                                                                            | A clear message is shown instead of a blank viewer, and the design options remain usable.                                                                                                                                                                                                                                         |
| Maintainability        | The code shall be organized into modules matching the four functional modules.                                                                     | Each module's code is in a distinct directory or component group, documented in the system design.                                                                                                                                                                                                                                |
| Maintainability        | The owner shall be able to update products, services, and 3D customization options and rates without developer assistance.                         | All configurable content is manageable through the administrator interface without direct database or code changes.                                                                                                                                                                                                               |

### 3.10 System Architecture

**Figure 5. System Architecture of AURELIUS**

![Figure 5](media/figure-05a.png)

![Figure 5](media/figure-05b.png)

The technical framework of AURELIUS follows a modern, serverless three-tier architecture supported by cloud-based API integrations. This structure separates the user interface, the application logic, the external services, and the data storage into independent layers. The separation improves security, maintainability, and response speed, and it suits a small, owner-operated business that has no dedicated IT staff.

- **Presentation Layer (Client Side):** This is the topmost layer, where the customer and the store owner interact with the system through a web browser on desktop or mobile. It is built with React and TypeScript within the Next.js framework and styled with Tailwind CSS and shadcn/ui for a responsive, accessible interface. Three.js, React Three Fiber, and Drei render the 3D jewelry viewer, which updates immediately when the customer changes the material, color, gemstone, or size. React Hook Form manages the order, quotation, and service request forms. The layer is hosted on Vercel, which serves the pages over HTTPS and deploys automatically from GitHub.
- **Application Layer (Serverless Logic):** This is the core operational layer. It runs as Next.js API routes on the Node.js runtime, executed as serverless functions on Vercel. It processes client requests and enforces role-based authorization, so owner functions such as price confirmation, design approval, and payment verification are not available to customers. It also computes the estimated weight and price from the rates set by the owner, and it manages custom orders, quotations, payments, service requests, and status tracking. Zod validates all input on the server before it is saved, and Prisma ORM connects the layer to the database using parameterized queries to prevent SQL injection. The layer also forwards chatbot requests to the AI service and keeps all API keys on the server.
- **External Integration / API Layer:** This layer offloads specialized tasks to third-party cloud services through secure API requests made only from the application layer:
  - **Google Gemini API (Gemini 2.5 Flash):** Powers the embedded AI chatbot, which guides customers in preparing service requests and custom-order details. The chatbot answers only from approved store data, does not give final prices, and refers inquiries it cannot handle to the owner.
  - **Resend:** Handles transactional email delivery, sending quotations, order and service status changes, and ready-for-claiming notices.
  - **Cloudflare Turnstile:** Provides bot protection on the login, registration, and password reset forms, blocking automated abuse and spam without showing a puzzle to most users.
- **Data Layer (Database):** This layer manages permanent, structured data storage on Supabase. PostgreSQL stores customer records, products, orders, quotations, payments, and service requests, and it uses transactions to keep balances correct. Supabase Auth manages email verification, password reset, login sessions, and user roles. Supabase Storage holds proof-of-payment files in JPG, PNG, or PDF format, up to 5 MB each. All requests to this layer come from the application layer.

### 3.11 Entity Relationship Diagram

**Figure 6. Entity Relationship Diagram**

![Figure 6](media/figure-06a.png)

![Figure 6](media/figure-06b.png)

The Entity Relationship Diagram (ERD) illustrates the relational database schema of the AURELIUS: Integrated 3D Design Customization, E-Commerce, and Service Management Platform with an AI-Powered Chatbot for Afable's Jewelry Store, structured to maintain secure user accounts, accurate transaction records, and organized service tracking. The data architecture anchors user identity through the core user’s entity, which maintains direct relational links with custom_designs for jewelry designs created in the 3D viewer, orders for product and custom-order transactions, service_requests for jewelry and watch services, chat_sessions for chatbot conversations, and notifications for customer updates. Complementing this core structure are modular support entities including products for the jewelry catalog, design_options for the materials, colors, gemstones, and 3D models, and services for the service catalog, which operate independently of customer records to ensure easy maintenance and consistent offerings. Transaction entities such as order_items, quotations, and payments then connect these records to track prices, owner approvals, and payment verification. This schema design balances strict data integrity for customer, order, and payment records with scalability, ease of maintenance, and reliable retrieval of information, allowing the owner and the customers to work with accurate and connected data across the platform.

### 3.12 System Flowchart

The System Flowchart presents a step-by-step visualization of the operational logic of AURELIUS. It illustrates the sequence of activities, decision points, and user interactions involved in each major function of the platform. This section is divided into four (4) flowcharts, each representing one of the system's modules: 3D Design Customization, E-Commerce, Service Management, and the AI-Powered Chatbot. Each flowchart shows how the customer, the system, and the store owner interact, and how the system responds to specific inputs and decisions. Each step is color-coded to show who performs it: blue for the customer, green for the system, and amber for the owner. Decision points are colored according to who makes the decision. Dashed lines mark return paths where the process loops back to an earlier step.

1. **3D Design Customization Flowchart**

**Figure 7. 3D Design Customization Flowchart**

![Figure 7](media/figure-07.png)

2. **E–Commerce Flowchart**

**Figure 8. E-Commerce Flowchart**

![Figure 8](media/figure-08a.png)

![Figure 8](media/figure-08b.png)

3. **Service Management Platform Flowchart**

**Figure 9. Service Management Platform Flowchart**

![Figure 9](media/figure-09a.png)

![Figure 9](media/figure-09b.png)

4. **AI-Chatbot Flowchart**

**Figure 10. AI-Chatbot Flowchart**

![Figure 10](media/figure-10a.png)

![Figure 10](media/figure-10b.png)

### 3.13 Development Tools and Technologies

**Table 4: Development Tools and Technologies**

| **Technology / Tool**                | **Version (tentative, as of Nov 2026)** | **Purpose / Justification**                                                                                                                                                                                          |
| ------------------------------------ | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Next.js (App Router)                 | 16.4                                    | Next.js is a full stack React framework. It serves web pages and API routes in one project. It uses Turbopack for fast builds. It deploys directly to Vercel.                                                        |
| React                                | 19.3                                    | React is a component-based user interface library. It builds each module as reusable components. It supports a responsive interface for desktop and mobile devices.                                                  |
| TypeScript                           | 5.9                                     | TypeScript adds type checks to JavaScript. It finds errors before runtime. It makes code easy to maintain for a team of five members.                                                                                |
| Tailwind CSS + shadcn/ui             | 4 / 4.23.0                              | Tailwind CSS is a utility-first styling framework. shadcn/ui gives pre-built accessible components. Together they give fast, consistent, and responsive design.                                                      |
| Three.js + React Three Fiber + Drei  | r187 / 9 / 10.7.7                       | Three.js renders 3D graphics in the browser with WebGL. React Three Fiber connects Three.js to React. Drei gives controls and lighting. The viewer updates when the user changes material, color, gemstone, or size. |
| Node.js                              | 22 LTS                                  | Node.js is the runtime for the Next.js backend. It uses JavaScript on the server. It lets the team use one language for the frontend and the backend.                                                                |
| PostgreSQL via Supabase              | 16                                      | PostgreSQL is a relational database. It stores customers, orders, quotations, payments, and service requests. It uses transactions to keep balances correct.                                                         |
| Prisma ORM                           | 6                                       | Prisma is a type-safe layer between Next.js and PostgreSQL. It uses parameterized queries to prevent SQL injection. It keeps the database schema in sync with the entity-relationship diagram.                       |
| Supabase Auth + Storage              | —                                       | Supabase Auth manages email verification, password reset, login sessions, and user roles. Supabase Storage holds proof-of-payment files. It accepts JPG, PNG, and PDF files up to 5 MB.                              |
| Cloudflare Turnstile                 | —                                       | Cloudflare Turnstile is a bot protection service. It verifies users on login, registration, and password reset forms. It blocks automated abuse and spam. It shows no puzzle to most users.                          |
| Google Gemini API (Gemini 2.5 Flash) | API                                     | Gemini 2.5 Flash is a free-tier AI model. It powers the chatbot through a Next.js API route. The API key stays on the server. The chatbot uses only approved store data. It does not give final prices.              |
| pnpm                                 | 12.x                                    | pnpm is a fast package manager. It shares packages to save disk space. It works well on low-spec laptops. It works with Vercel builds.                                                                               |
| ESLint + Prettier + Husky            | 9 / 3                                   | ESLint finds code errors. Prettier formats code automatically. Husky runs these checks before each commit. Together they keep code style consistent for all team members.                                            |
| Git + GitHub + GitHub Actions        | —                                       | Git controls versions of the code. GitHub stores the code and supports teamwork. GitHub Actions runs lint, type-check, and build checks on each push.                                                                |
| Visual Studio Code                   | 1.x                                     | Visual Studio Code is the main code editor. It has extensions for Next.js, TypeScript, Prisma, and Tailwind CSS. It is light and fast.                                                                               |
| Resend                               | —                                       | Resend sends transactional email. It sends quotations, status changes, and ready-for-claiming notices. It works with Next.js API routes.                                                                             |
| React Hook Form + Zod                | 4.x                                     | React Hook Form manages order and service forms. Zod validates input on the server. Together they stop invalid data before it is saved.                                                                              |
| Vitest + Playwright                  | 3.x / 1.65.1                            | Vitest tests components and API logic. Playwright tests the system in real browsers. Together they check key flows such as order placement and service tracking.                                                     |
| Vercel                               | —                                       | Vercel hosts the Next.js application. It gives HTTPS by default. It deploys automatically from GitHub. Its free tier supports development and evaluation.                                                            |

### 3.14 Testing and Evaluation Procedures

The proponents will test AURELIUS in stages, and each stage checks a different level of the system. Defects found in one stage will be fixed before the next stage begins. This order finds errors early and keeps the cost of each fix low. Testing will first be done on a local laptop and then on a Vercel staging link that uses the same setup as the live site. Only fictitious data will be used in all tests, and no real customer data will be used in any test.

The test strategy covers unit, integration, functional, system, usability, performance, security, compatibility, reliability, and user acceptance testing. Each test will use the criteria in Section 3.9.2. The proponents will record each result and each defect in a test log. After testing, the system will undergo pilot testing and instrument validation, and then evaluation by the respondents.

**Table 5. Summary of Test Types and Criteria**

| **Test type**   | **What it verifies**                                                                            | **Pass criterion**                                                                                        |
| --------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Unit            | One small part of the code: form validation, price estimates, status updates, role access rules | All unit test cases pass                                                                                  |
| Integration     | Two or more parts working as one flow: Next.js with Supabase, file upload to Supabase Storage   | All integration test cases pass; run in each sprint                                                       |
| Functional      | Each key user flow, from start to end, in a real browser                                        | Every test case matches its stated expected result                                                        |
| System          | All four modules working as one system                                                          | 100% of Must-priority test cases pass before the evaluation                                               |
| Usability       | Whether users finish task scenarios without help                                                | At least 80% of participants complete the scenarios unaided; every message states the problem and the fix |
| Performance     | Load time, response time, model size, concurrent users                                          | Every target in Table 7 is met                                                                            |
| Security        | Access control, passwords, sessions, input handling, uploads, transport                         | No injection or cross-site scripting flaw; all unauthorized access attempts refused                       |
| Compatibility   | Four browsers, smartphone screens, WebGL fallback                                               | All core flows pass in each browser                                                                       |
| Reliability     | Uptime, record integrity, validation, backup and restore                                        | Uptime of at least 95%; no critical failure; no partial or duplicate records                              |
| User acceptance | The owner's administrator tasks in the live workflow                                            | The owner accepts the build                                                                               |

**Unit Testing and Integration Testing**

The proponents will use Vitest for unit tests. A unit test checks one small part of the code. The unit tests will cover form validation, price estimates, status updates, and the access rules for each user role.

The proponents will then run integration tests. An integration test checks two or more parts as one flow. The integration tests will cover the link between Next.js and the Supabase database and the upload of files to Supabase Storage. The proponents will run these tests in each sprint.

**Functional Testing and System Testing**

The proponents will use Playwright for functional tests. Playwright acts like a real user in a real browser and tests each key flow from start to end. The proponents will write one test case for each key flow, and each test case will state its expected result before the test runs.

After all, four modules are complete, the proponents will run system testing. System testing checks all modules as one system. The proponents will correct all defects before the system is presented to the respondents. All Must-priority functional requirements must pass, and the pass rate for Must-priority test cases must reach 100 percent before the evaluation.

**Table 6. Test Cases for Key Flows**

| **Test case** | **Flow**                       | **Expected result**                                                                                                                                                         |
| ------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TC-01         | Registration and login         | The user registers, verifies the email, and logs in. Cloudflare Turnstile checks each authentication form.                                                                  |
| TC-02         | 3D design change               | The viewer updates at once when the user changes the material, color, gemstone, or size. The display matches the selected options.                                          |
| TC-03         | Price and weight estimate      | The estimate matches the manual computation with the same rates. The price rounds to the nearest peso and the weight to 0.01 g. The test covers at least 20 configurations. |
| TC-04         | Order and quotation            | The customer submits an order. The owner issues a quotation. The customer accepts or declines the quotation.                                                                |
| TC-05         | Payment proof upload           | The system accepts a JPG, PNG, or PDF file up to 5 MB. The system rejects other file types and larger files.                                                                |
| TC-06         | Service request and tracking   | The customer submits a service request. The owner updates the status. The customer sees the new status.                                                                     |
| TC-07         | Chatbot, in-scope question     | The chatbot gives a correct and relevant answer. At least 80 percent of at least 50 test queries pass.                                                                      |
| TC-08         | Chatbot, out-of-scope question | The chatbot refers the customer to the owner. It gives no final price and no completion date. All out-of-scope queries pass.                                                |
| TC-09         | Owner administration           | The owner adds, edits, and hides products, services, and 3D options and rates without developer help.                                                                       |
| TC-10         | Access control                 | A customer cannot open the record of another customer. The test also tries direct URL access and request changes.                                                           |

For each test case, the proponents will record the actual result and the status in the test log. The status is either Pass or Fail. Chapter 4 will report the full test case table with the actual results.

**Usability Testing**

The proponents will run usability tests with task scenarios. Each customer participant will try a custom order request and a service request. Each participant will work without help, except for the guidance of the chatbot.

At least 80 percent of customer participants must complete both task scenarios without help. At least 80 percent of the owner-group and business-owner participants must complete the owner task scenarios without developer help. The owner group will first receive an orientation session. The proponents will record each task result, each error, and each point of confusion.

The proponents will also check all user text and error messages. Each message must state what went wrong and how the user can fix the problem.

**Performance Testing**

The proponents will measure load time and response time on a low-spec laptop and on the staging link. Each measure will be run at least three times, and the proponents will record the average result. The system must meet each target in Table 7.

**Table 7. Performance Targets**

| **Measure**                                 | **Target**                                                                     |
| ------------------------------------------- | ------------------------------------------------------------------------------ |
| Standard page load, broadband               | 3 seconds or less                                                              |
| Standard page load, 4G mobile data          | 5 seconds or less                                                              |
| 3D viewer, first load of the base model     | 5 seconds or less                                                              |
| 3D viewer, display update per option change | 3 seconds or less                                                              |
| 3D model file size                          | 5 MB or less per file                                                          |
| Chatbot response time per message           | 5 seconds or less                                                              |
| Concurrent users                            | The system stays within the targets above with up to 30 users at the same time |

**Security Testing**

The proponents will test the security controls in Section 3.9.2. The tests will check that only logged-in users can open transactional features, and that a user who is not logged in is sent to the login screen. The tests will check role-based access in all modules and will also try direct URL access and request changes.

The tests will check the password rules:

- The system stores passwords with a strong hash such as bcrypt and never stores a password in plain text.
- The minimum password length is 8 characters.
- Sessions end after 30 minutes without activity and at logout.
- Login is blocked for 15 minutes after 5 failed attempts in a row.
- Cloudflare Turnstile protects the login, registration, and password reset forms.
  The proponents will test all form inputs on the server using the OWASP Top 10 checklist and sample attack inputs. No injection flaw and no cross-site scripting flaw may remain. The system must use HTTPS on all pages, and HTTP requests must move to HTTPS. Upload tests will check the file type and file size on the server, and uploaded files must not be able to run as code.

**Compatibility Testing**

The proponents will test all core flows in four browsers: Google Chrome, Mozilla Firefox, Microsoft Edge, and Safari. They will test the current version and the previous major version of each browser. All core flows must pass in each browser.

The proponents will also test the system on mobile devices. All customer and owner workflows must work on a smartphone screen of 360 px width or larger. The 3D viewer will also be tested on a low-spec laptop.

The proponents will test the WebGL fallback. A browser or device without WebGL support must show a clear message and must not show a blank viewer. The design options must stay usable without the 3D view.

**Reliability Testing and Backup Testing**

The proponents will check that the system stays up during the evaluation period. Uptime must reach at least 95 percent, and announced maintenance does not count. No critical failure may occur in testing or in the evaluation. A critical failure means that a core function stops or data is lost.

The proponents will test record integrity by closing the browser and cutting the connection during a submission. The record must save in full or not at all, and no partial or duplicate record may appear. The test covers orders, quotations, service requests, and payments.

The proponents will test form validation. All defined validation rules must work, and each error message must describe the problem. The system takes a daily database backup, and each backup is kept for at least 7 days. The proponents will run one restore test before deployment.

**User Acceptance Testing**

The store owner will run user acceptance testing. The owner is the sole operator of the store and will test the administrator tasks in the live workflow. The tasks cover products, services, orders, quotations, payments, and 3D options and rates.

The owner will confirm that each task works without developer help and will list each problem in the test log. The proponents will fix each major problem, and the owner will then repeat the failed task. The system moves to respondent evaluation only after the owner accepts the build.

**Pilot Testing and Instrument Validation**

The capstone adviser and two experts in information technology will review the evaluation questionnaire. The proponents will revise the questionnaire based on their comments. This step checks that each item is clear and relevant.

The proponents will then pilot test the questionnaire with 10 people who are not part of the 30 respondents. Each pilot user will use the system and answer the questionnaire. The proponents will record errors, delays, and points of confusion.

The proponents will check the internal consistency of the items with Cronbach's alpha and will revise any weak item before the main evaluation. They will also fix major system problems that the pilot test shows and repeat the failed tasks to confirm each fix.

**Evaluation by Respondents**

The proponents will host the tested system online for the evaluation. Each respondent will get access to the system and a period of guided exploration. Each respondent will then answer the evaluation questionnaire on paper or through an online form. The proponents will answer questions about the process only and will not influence the ratings. They will check each form for completeness before analysis.

The evaluation uses 30 respondents, selected by purposive sampling as stated in Section 3.5.

**Table 8. Respondent Groups**

| **Respondent group**   | **Count** | **What the group rates**                                                                           |
| ---------------------- | --------- | -------------------------------------------------------------------------------------------------- |
| Store owner and family | 5         | Fit of the system with the day-to-day work of the store                                            |
| Customers              | 20        | Usability, clarity of the 3D viewer, ease of ordering, service tracking, and help from the chatbot |
| Business owners        | 5         | Use of the system for a small, owner-run business that handles orders, services, and payments      |

The questionnaire uses a 5-point Likert scale. A rating of 5 means Strongly Agree and a rating of 1 means Strongly Disagree. It rates five criteria from the ISO/IEC 25010 model in Section 3.6.

**Table 9. Evaluation Criteria**

| **Criterion**          | **What the respondent rates**                                                  |
| ---------------------- | ------------------------------------------------------------------------------ |
| Functional Suitability | The system gives the functions that the owner and the customers need.          |
| Performance Efficiency | The system responds within a proper time under normal use.                     |
| Usability              | Users can learn the system and use it with ease and satisfaction.              |
| Reliability            | The system works in a steady way and without failure under set conditions.     |
| Security               | The system protects data and blocks access, use, or change without permission. |

Compatibility and Maintainability are not in the questionnaire because respondents cannot judge these two traits in short use. The proponents will verify Compatibility through the tests in Section 3.14.6 and both traits through the owner acceptance test in Section 3.14.8.

The proponents will use frequency and percentage distribution and the weighted arithmetic mean, as stated in Section 3.8. They will compute the weighted mean for each item and for each criterion. The overall score is the mean of the five criterion scores. Each weighted mean will be read with Table 1 in Section 3.8. A criterion with a weighted mean of 3.51 or higher is acceptable, and any item with a mean below 3.51 will be flagged for improvement.

**Defect Documentation and Retesting**

The proponents will record each defect in a test log. Each entry will state the test case, the defect, the severity, the steps to repeat the defect, the expected result, the actual result, the fix, and the retest result.

The proponents will fix each defect and retest the same case, and they will close an entry only after the retest passes. They will not start the respondent evaluation with an open major defect. After the evaluation, the proponents will add the respondents' suggestions to the backlog. They will then deploy the system and give the owner an orientation session and user documentation.

### 3.15 Ethical Considerations and Data Privacy

The study involves human respondents and customer data. The proponents will therefore follow clear ethical rules that protect each respondent and each customer. The rules also guide how the proponents collect, store, and delete data.

The safeguards cover eight points: informed consent, voluntary participation, confidentiality, access control, data minimization, retention and disposal, permissions, and compliance with the Data Privacy Act of 2012.

**Table 10. Summary of Ethical Safeguards**

| **Safeguard**           | **Main measure**                                                                                      | **Section** |
| ----------------------- | ----------------------------------------------------------------------------------------------------- | ----------- |
| Informed consent        | Written consent from each respondent before the test; data privacy notice and consent at registration | 3.15.1      |
| Voluntary participation | Respondents may stop or skip any question at any time without penalty                                 | 3.15.2      |
| Permissions             | Written consent of the store owner; permission before audio recording                                 | 3.15.3      |
| Confidentiality         | Anonymous questionnaire with respondent codes R01 to R30; group results only                          | 3.15.4      |
| Access control          | Only the proponents and the capstone adviser access raw data; role-based access in the system         | 3.15.5      |
| Data minimization       | Only data that the study and the system need                                                          | 3.15.6      |
| Retention and disposal  | Study data kept only until the study is complete; test data deleted after testing                     | 3.15.9      |
| Legal compliance        | Compliance with the Data Privacy Act of 2012 (Republic Act No. 10173)                                 | 3.15.10     |

**Informed Consent**

The proponents will get written consent from each respondent before the test. The consent form will state the purpose of the study and the tasks for the respondent. It will also state the data that the proponents will collect and how they will use and protect the data.

The system will also show a data privacy notice at registration. A customer must give consent before the system collects personal data. This rule is FR-45 in Section 3.9.1.

**Voluntary Participation**

Participation is voluntary. A respondent can stop at any time and can skip any question. The respondent gets no penalty for stopping or for skipping. The store owner can also withdraw at any time.

**Permissions**

The proponents will first get the written consent of the store owner. The consent covers three points:

- The owner agrees to take part in the study.
- The owner allows observation of store operations.
- The owner allows review of store records.
  The proponents will ask permission before they record audio in the interview, and they will use the recording only for the study. They will give the same study information to the family members, the customers, and the business owners in the evaluation. Each person gives consent before answering the questionnaire.

**Confidentiality and Anonymity**

The questionnaire is anonymous. The proponents will not print respondent names in the results. They will assign a code to each respondent, running from R01 to R30, and use only the code in tables, forms, and reports.

The proponents will keep consent forms separate from response forms. They will report group results only and will not report a result that can identify one person. Interview notes and the audio recording stay private and serve the study only.

**Access Control**

Only the proponents and the capstone adviser can access the raw research data. No other person can open the interview notes, the recording, or the raw responses.

The system uses access control by role. Supabase Auth manages accounts and passwords, and the system never stores a password in plain text. The system uses HTTPS for all connections, and the Gemini API key stays on the server only.

The system uses Row Level Security in the database, so each customer can access only their own records. Personal data is visible only to the account holder and the owner. The owner is the sole operator of the store. The store has no employees, so no other system role exists. Cloudflare Turnstile protects the login, registration, and password reset forms from bots.

**Data Minimization**

The proponents will collect only the data that the study and the system need. The questionnaire collects ratings only and does not collect names. The system collects only the data that a transaction needs, namely contact details, orders, service requests, quotations, and payments.

The proponents will not collect data for other purposes and will not sell personal data. They will not share personal data with outside parties without consent.

**Payment Proof and Uploaded Files**

Customers upload proof of payment as an image or a PDF file. The system stores these files in Supabase Storage only, in a private bucket, and does not give a public link to any file. Authorized users open a file through a short-lived signed link only.

The system accepts JPG, PNG, or PDF files up to 5 MB only. It checks the file type and the file size on the server before it saves each file.

**Chatbot Disclosure and Limits**

The chatbot uses Google Gemini 2.5 Flash. The system shows a notice inside the chatbot stating that Gemini processes the chat text. The notice tells users not to type sensitive personal data in the chat. Sensitive data includes passwords, bank details, and government ID numbers.

The chatbot gives general guidance only. It does not give a final price and does not promise a completion date. It refers price and inspection questions to the store owner. This limit follows FR-39 and FR-40 in Section 3.9.1 and avoids harm from a wrong automated answer.

**Retention and Disposal**

The proponents will store all study data in a secure place and keep the data only until the study is complete. They will then delete the audio recording and the personal information that they collected.

The proponents will delete test data after testing ends. Test data includes fake accounts and fake orders from the proponents' tests. They will keep only the coded responses, the computed scores, and the summary results. The proponents will store consent forms in a secure place until the school no longer needs them and will then destroy the forms.

**Compliance with the Data Privacy Act of 2012**

The proponents will follow the Data Privacy Act of 2012, formally known as Republic Act No. 10173. They will collect only the data that the study needs and will use the data only for the stated purpose.

A respondent can ask what data the proponents hold about them, can ask the proponents to correct wrong data, and can ask the proponents to delete their data. The proponents will honor each valid request.
