[CENTER]
# PROJECT REPORT
## UNIVERSE AI
### A Multi-Model AI Productivity Platform
### Prepared using the structure of the provided sample report

Prepared by: [Your Name]

Register Number: [Your Register Number]

Under the Guidance of: [Guide Name]

Department / Institution: [Your Department and Institution]

Month and Year: April 2026
[ENDCENTER]

[PAGEBREAK]

# DECLARATION

I hereby declare that the project report entitled "Universe AI - A Multi-Model AI Productivity Platform" is an original work prepared by me for academic and project documentation purposes. The report is based on the implementation present in my project workspace and has been reorganized from the provided sample document so that the content reflects my own software system rather than the sample application's features. The work presented in this report has not been copied as a complete report from any other project and may be used for submission after replacing the bracketed personal and institutional details.

Date: [Add Date]

Place: [Add Place]

Signature of the Candidate: ______________________

[PAGEBREAK]

# ACKNOWLEDGEMENT

I express my sincere gratitude to my guide, faculty members, friends, and everyone who supported the completion of this project. Their guidance, feedback, and encouragement helped me convert an initial idea into a working software platform with multiple integrated components.

I also acknowledge the contribution of the open-source communities and technology providers whose frameworks and services made this work possible. Modern tools such as Next.js, React, TypeScript, PostgreSQL, NextAuth, OpenRouter, Gemini, Razorpay, and Hugging Face-based services significantly accelerated development and helped shape the final system.

This report has been prepared as a clean project-specific version of the sample document provided, with the technical content rewritten to match the actual Universe AI codebase.

[PAGEBREAK]

# INDEX

1. Abstract
2. Chapter 1 - Introduction
3. Chapter 2 - Aim and Scope
4. Existing Systems
5. Proposed System
6. Chapter 3 - Concept and Methods
7. System Architecture
8. Multi-Model Orchestration
9. Connector and Tool Routing
10. Document Intelligence and RAG
11. Chapter 4 - Implementation
12. Tools Used
13. Results and Screenshots
14. Chapter 5 - Conclusion and Future Scope
15. References

[PAGEBREAK]

# ABSTRACT

Universe AI is a full-stack web application designed to unify multiple AI workflows inside a single platform. Instead of forcing users to switch between separate tools for chat, model comparison, document question answering, tool-assisted automation, and AI-driven project generation, the system provides a single environment where these functions are coordinated through a common interface. The platform supports direct interaction with multiple large language models, side-by-side comparison of answers, connector-driven tool execution, document ingestion for retrieval-augmented responses, and an agent workspace capable of generating project files.

The application is implemented using Next.js 16, React 19, TypeScript, Tailwind CSS, PostgreSQL, and NextAuth. Model access is handled through OpenRouter, OpenAI, and Gemini integrations. The document intelligence flow uses a Hugging Face-hosted PDF service and a retrieval pipeline that stores user document content for contextual querying. Additional modules support billing through Razorpay, shareable conversations, admin panels, and a connector registry for productivity and development tools.

The overall objective of the project is to improve productivity, reduce context switching, and provide a scalable architecture for AI-assisted work. By combining model orchestration, document retrieval, modular connectors, and a modern user experience, Universe AI demonstrates how a single web platform can support advanced AI interaction in a clear, extensible, and production-oriented manner.

[PAGEBREAK]

# CHAPTER 1 - INTRODUCTION

Artificial intelligence tools are now widely used for writing, coding, research, summarization, data lookup, automation, and decision support. However, many current workflows remain fragmented. A user may rely on one platform for general chat, another for document search, a separate tool for web research, another interface for code generation, and additional services for payments, connectors, or collaboration. This fragmentation increases task-switching cost, reduces productivity, and makes it difficult to preserve context across workflows.

Universe AI addresses this problem by bringing several AI-centric capabilities into one integrated application. The system allows users to chat with one or more AI models, compare outputs from multiple providers, route tool-oriented requests through connector logic, upload documents for retrieval-based answers, and use an AI agent to generate project files in an embedded workspace. The result is a platform that supports both conversational and task-driven interaction.

The project is implemented as a modern full-stack application using the Next.js App Router. It combines a client-side interaction layer, server-side APIs, authentication, persistent storage, connector management, and payment handling. The application is designed for extensibility, allowing new models, tools, connectors, and workflow modules to be added without redesigning the entire platform.

From a software engineering perspective, Universe AI is not only a chat application. It is a modular AI productivity system that demonstrates orchestration across model providers, state persistence, tool routing, document ingestion, and agent-assisted generation. This broader objective makes it an appropriate academic and technical project for studying full-stack AI system design.

[PAGEBREAK]

# CHAPTER 2 - AIM AND SCOPE

## Aim

The primary aim of Universe AI is to design and develop a unified AI productivity platform that allows users to interact with multiple large language models, compare their outputs, execute tool-assisted tasks, upload documents for contextual querying, and generate project files through an AI agent. The system seeks to replace fragmented AI workflows with a single, coherent application.

## Scope

The scope of the project includes:

- Multi-model chat with selectable providers and best-mode or compare-mode interaction.
- Persistent storage of chats, messages, user details, billing metadata, and connector tokens.
- AI connector routing for selected external or simulated tools.
- Document upload and retrieval-augmented question answering.
- Agent workspace support for code and project generation.
- User authentication, subscription handling, sharing, and administrative monitoring.

The current project scope is centered on a web application. It supports scalable backend logic and can be extended to mobile wrappers or dedicated native clients in later phases.

## Existing Systems

Many existing systems offer only one part of the workflow. Standard chat products focus on single-model conversation. Document assistants may support file uploads but often lack model comparison or tool execution. Productivity assistants may connect to services such as email or project management tools, but they are not always integrated with a persistent multi-model chat environment. Coding assistants may generate files, yet they are usually isolated from billing, user management, and general-purpose conversation.

In addition, most existing AI products keep the user inside separate silos. Research happens in one interface, coding in another, model comparison somewhere else, and task automation in a different system. As a result, context is fragmented and users repeatedly restate the same problem across tools.

## Proposed System

The proposed system is a single platform that unifies these capabilities. Universe AI combines conversational AI, comparison of model outputs, document intelligence, tool routing, and AI agent support inside one authenticated web application. The platform stores chats in PostgreSQL, uses authenticated sessions through NextAuth, performs model calls through OpenRouter and Gemini integrations, and exposes a structured API layer through Next.js route handlers.

The proposed system also improves extensibility. New connectors, models, and workflow modules can be added through registries rather than by rewriting the complete application. This makes the platform suitable for academic demonstration as well as further production-grade expansion.

[PAGEBREAK]

# CHAPTER 3 - CONCEPT AND METHODS

## Problem Description

The main problem addressed by Universe AI is workflow fragmentation in modern AI usage. Users often need several tools to complete a single task. For example, a person may ask one model for explanation, another for comparison, upload a PDF into a separate system, use a third service to search the web, and then move to a coding assistant to generate implementation files. This fragmented process slows down problem solving and introduces unnecessary repetition.

There is also a technical challenge in coordinating multiple AI providers and tool systems inside one interface. The application must manage authentication, state, storage, tool routing, file ingestion, model timeouts, and user experience while keeping the flow understandable. Without a clear architecture, such a platform can quickly become inconsistent or unreliable.

## Proposed Solution

Universe AI solves this by using a modular full-stack architecture with separate responsibilities for UI, server routes, model access, connector registries, persistence, and document retrieval. The user interacts through a single application, but the system internally separates concerns into well-defined layers. Chat requests are authenticated, sanitized, optionally routed through tool logic, enriched with document context when needed, and then executed through one or more models based on the selected mode.

The application also introduces an agent workflow. In agent mode, the platform asks Gemini to return structured project data that can be rendered as a file workspace. This allows the same product to support both normal conversation and guided project generation.

## System Architecture

The architecture of Universe AI can be understood in six layers:

1. Presentation Layer: Built with Next.js, React, and Tailwind CSS. It includes the landing page, login page, chat interface, connector views, tool views, billing modal, and agent workspace.
2. Interaction Layer: Client components manage chat history, selected models, compare mode, connector toggles, upload state, and optimistic UI updates.
3. API Layer: Next.js route handlers process chat requests, uploads, payment operations, share actions, user status requests, and admin operations.
4. Intelligence Layer: OpenRouter, Gemini, and internal registries handle LLM responses, model comparison, tool detection, and agent generation.
5. Data Layer: PostgreSQL stores users, chats, messages, billing details, tools, and usage-related records.
6. External Service Layer: OpenRouter, Gemini APIs, Razorpay, and the Hugging Face PDF service extend the system beyond the local application.

This layered structure improves maintainability and allows the application to evolve without tightly coupling all features into a single file or route.

## Multi-Model Orchestration

One of the central ideas of Universe AI is that users should not be limited to a single model. The system allows model selection from supported providers and offers two major operating modes:

- Best mode: a single preferred model is used for a focused response.
- Compare mode: up to three selected models run in parallel and their outputs are displayed side by side.

This design allows users to evaluate quality, tone, correctness, and speed across providers without leaving the application. The orchestration logic also applies timeouts and limited retries, which improves reliability when external providers are slow or temporarily unavailable.

## Connector and Tool Routing

The project includes a connector registry that represents external tools and services such as GitHub, Gmail, Notion, Supabase, Slack, Google Drive, Vercel, Canva, PDF summarization, resume support, job search, and several other categories. The routing process combines deterministic keyword detection with a Gemini-based fallback selector, allowing the system to map user prompts to likely tools.

This module is important because it extends the platform beyond plain text generation. Instead of treating every request as a normal chat prompt, Universe AI can recognize when a user intends to perform a tool-oriented action and return a structured response from the corresponding tool pathway.

## Document Intelligence and RAG Pipeline

Universe AI supports document upload for PDF and text files. Uploaded content is processed through an external PDF extraction service, then stored in a retrieval pipeline so that later questions can be answered with document-aware context. The upload route also synchronizes extracted text into the user profile for resume-related operations.

This feature transforms the system from a generic chat platform into a contextual assistant. The user can ask questions grounded in uploaded material instead of receiving answers based only on general model knowledge.

## Data Storage and Authentication

The data layer uses PostgreSQL to persist users, accounts, sessions, chats, messages, connector settings, billing details, usage logs, and rate-limit information. Authentication is implemented with NextAuth using Google, GitHub, and Discord providers. This approach supports secure entry into the system while keeping chat history and billing metadata tied to the correct user account.

Persistent storage is essential for continuity. It allows chat restoration, project file persistence, admin monitoring, public sharing, and future analytics.

## Security and Reliability Considerations

The project includes input sanitization, authenticated route access for protected operations, encrypted storage for API keys, and server-side validation for payment plans. Model calls apply timeouts and route handlers check session identity before performing user-specific operations.

Although the application is functional, some modules are still prototype-grade by design. For example, the deployment route currently simulates deployment output rather than performing a full production deployment pipeline. This is an honest and useful design choice for a staged project because it preserves the interface contract while leaving room for future real-world integration.

[PAGEBREAK]

# CHAPTER 4 - IMPLEMENTATION

## Tools Used

### Next.js and React

Next.js 16 is used as the full-stack framework for routing, server rendering, API handlers, and application structure. React 19 powers the component-based UI and client-side interaction model. Together, they provide a strong base for scalable full-stack development.

### TypeScript and Tailwind CSS

TypeScript improves reliability by enforcing structured types across models, chats, connectors, tool results, and API payloads. Tailwind CSS is used to build a consistent interface quickly, supporting responsive layouts and modern styling without large custom stylesheet overhead.

### PostgreSQL and NextAuth

PostgreSQL stores long-lived application data such as users, sessions, chats, messages, tool tokens, billing details, and usage records. NextAuth manages secure sign-in and session handling using Google, GitHub, and Discord OAuth providers. The custom adapter logic maps the auth layer cleanly onto the database schema used in this project.

### OpenRouter, OpenAI, and Gemini

OpenRouter acts as the unified access point for several AI models, enabling the compare-mode experience and single-model execution flow. Gemini is used both as an available model and as a reasoning layer for agent and tool-selection tasks. OpenAI-compatible access patterns are used in the OpenRouter client implementation.

### Hugging Face PDF Service and RAG Support

The upload pipeline depends on a Hugging Face-hosted PDF extraction service. Extracted text is stored for retrieval-based question answering, which allows the chat route to append document context when the user is working in a document-assisted flow.

### Razorpay

Razorpay is integrated for subscription-related payments. The backend creates orders with plan-aware pricing and returns the payment order to the frontend. This supports premium access management and enables a production-oriented monetization pathway.

## Key Modules

1. Landing and Access Layer: public-facing pages introduce the product and route users to login or the main application.
2. Chat Interface: the primary interaction surface for standard conversations, compare mode, and connector use.
3. Agent Workspace: an embedded generation panel where AI-created project files can be previewed and explored.
4. Tool Engine: handles deterministic and AI-assisted routing for tool-style user requests.
5. Upload and RAG Module: accepts PDF or text files, extracts content, stores retrieval data, and supports context-aware responses.
6. Billing Module: manages order creation and payment verification workflow.
7. Admin Module: provides support, error, and user management pages for internal administration.

## Functional Flow

The implementation flow is as follows:

1. A user signs in through an OAuth provider.
2. The user opens the main app and types a message.
3. The client sends chat state, selected models, connector state, and mode information to the chat route.
4. The server authenticates the request and checks whether tool routing should run first.
5. If tool routing applies, the system executes or simulates the relevant connector response.
6. If the request is a normal chat, the server optionally adds document context and sends the prompt to one or more models.
7. The result is saved in PostgreSQL and returned to the client.
8. If the request is in agent mode, Gemini returns structured project data that is rendered in the workspace.

## Database Design Summary

The database includes tables for:

- users
- accounts
- sessions
- chats
- messages
- usage_logs
- user_tools
- billing_details
- rate_limits

This schema supports user identity, chat persistence, premium features, tool connections, and operational tracking. The database initialization logic also includes compatibility checks to add missing columns when needed.

## Results and Screenshots

The following screenshots should be inserted into the final academic submission from the running application:

Figure 4.1 - Landing page of Universe AI
Figure 4.2 - Login page with OAuth options
Figure 4.3 - Main chat interface in best mode
Figure 4.4 - Compare mode showing responses from multiple models
Figure 4.5 - Connector or tool interaction view
Figure 4.6 - Agent workspace with generated project files
Figure 4.7 - Document upload and retrieval flow
Figure 4.8 - Pricing or Razorpay checkout flow
Figure 4.9 - Shared chat or admin dashboard page

If required, these screenshots can be added later using Word after opening the generated report document.

[PAGEBREAK]

# CHAPTER 5 - CONCLUSION AND FUTURE SCOPE

## Conclusion

Universe AI successfully demonstrates the design and implementation of a modern multi-model AI productivity platform. The project integrates conversational AI, model comparison, connector-driven tool support, document retrieval, an agent workspace, persistent storage, authentication, billing, and administration into a single coherent system. This makes the platform more capable than a basic chatbot and more practical than a set of disconnected utilities.

The project also shows how a modular architecture can simplify the management of complex AI workflows. By separating UI logic, route handlers, model execution, tool registries, database access, and external service integrations, the system remains extensible and easier to maintain. The resulting product is suitable as both a technical demonstration and a strong foundation for continued development.

## Future Scope

The project can be extended in several important directions:

1. Replace simulated deployment outputs with real GitHub and Vercel deployment automation.
2. Add streaming model responses for lower perceived latency during long generations.
3. Expand the real connector set and reduce reliance on simulated tool handlers.
4. Add role-based administration, audit trails, and richer operational analytics.
5. Improve document intelligence with richer chunk ranking, citations, and multi-file retrieval views.
6. Introduce mobile clients or hybrid wrappers for Android and iOS.
7. Add advanced team collaboration such as shared workspaces, comments, and approval flows.
8. Strengthen premium controls with subscription lifecycle dashboards and invoice history.

These improvements would make Universe AI more production-ready while preserving the modular architecture already established in the current implementation.

[PAGEBREAK]

# REFERENCES

1. Next.js Documentation - https://nextjs.org/docs
2. React Documentation - https://react.dev
3. Tailwind CSS Documentation - https://tailwindcss.com/docs
4. PostgreSQL Documentation - https://www.postgresql.org/docs
5. Auth.js Documentation - https://authjs.dev
6. NextAuth.js Documentation - https://next-auth.js.org
7. OpenRouter Documentation - https://openrouter.ai/docs
8. OpenRouter API Reference - https://openrouter.ai/docs/api/reference/overview
9. Google AI for Developers: Gemini API - https://ai.google.dev/docs
10. Gemini API Reference - https://ai.google.dev/docs/gemini_api_overview
11. Razorpay Orders API Documentation - https://razorpay.com/docs/api/orders/
12. Hugging Face Documentation - https://huggingface.co/docs
13. Chroma Documentation - https://docs.trychroma.com
