#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const postsIndexPath = "src/data/posts-index.json";
const posts = JSON.parse(fs.readFileSync(postsIndexPath, "utf8"));
const knownSlugs = new Set(posts.map((post) => post.slug));

const renameTags = new Map([["Postgres", "PostgreSQL"]]);
const retiredTags = new Set(["Design Rag System", "Database"]);

const additions = new Map();
const removals = new Map();

function updateMap(map, tag, slugs) {
  for (const slug of slugs) {
    if (!knownSlugs.has(slug)) throw new Error(`Unknown post slug: ${slug}`);
    if (!map.has(slug)) map.set(slug, new Set());
    map.get(slug).add(tag);
  }
}

function add(tag, slugs) {
  updateMap(additions, tag, slugs);
}

function remove(tag, slugs) {
  updateMap(removals, tag, slugs);
}

add("Career", [
  "My-Motivation-for-Becoming-a-Developer-568e6a7774ab",
  "The-Art-and-Science-of-Technical-Hiring--A-Comprehensive-Guide-158ca954f2c7",
]);

add("ClickHouse", [
  "How-We-Rebuilt-a-Telecom-KPI-Platform-to-Handle-Billions-of-Records--From-JSON-Blobs-to-Flat--1a4eb6b27574",
  "A-Microservice-That-Teaches-Everything-Not-to-Do-e055f7480424",
]);

add("Docker", [
  "Architectural-Optimization-of-Shared-Sandbox-Deployments-in-GitLab-CI-CD-47ccce21fa9d",
  "Making-docker-for-llama3-RAG-system-a3943f972711",
  "Installing-Application-for-web-developer-After-installing-Ubuntu-20-04-LTS-e8114c21044c",
]);

add("Testing", [
  "How-do-you-write-tests-in-Nestjs--03149ebeb372",
  "Add-SonarQube-to-the-Golang-project-28da80b3ee95",
  "Successfully-Migrating-from-a-Monolith-to-Microservices-with-a-Technical-Debt-Approach-aa08d713deec",
]);

add("Data Engineering", [
  "How-an-AI-Prompt-Turned-a-Complex-Multi-Database-ETL-Project-Into-Hours-of-Work-bjw7e",
  "Real-Time-Data-Ingestion--Connecting-Distributed-Kafka-to-ClickHouse-in-Docker-1e29e0b0f665",
  "Building-a-Complete-Kafka---ClickHouse-Streaming-Stack-with-Docker-Compose-98cbfc4bbf0c",
  "Connecting-Kafka-to-ClickHouse-with-SSL--A-Complete-Integration-Guide-e5a0a5957de3",
  "Solving-the--NaN--Deadlock--Streaming-Kafka-to-ClickHouse-with-Data-Sanitization-530ff573762f",
  "Comprehensive-Overview-of-Microsoft-SQL-Server-Business-Intelligence--BI--Stack-62383118c5f8",
  "The-Best-Design-Pattern-for-Query-Based-Change-Data-Capture--Hybrid-Stateful-Polling-with-Offset--95856947ef99",
]);

add("GraphQL", [
  "Eliminating-Code-Duplication-in-Go-with-go-generate--A-Practical-Guide-13d40dfa6df1",
]);

add("Python", [
  "The--Phantom--403--Solving-Django-CSRF-Failures-in-Golang-Clients-83906f4770e8",
  "When-Authentication-Grows-Without-a-Plan--A-Hidden-Security-Risk-in-Legacy-Django-and-SPA-Systems-eeb172bc92a8",
  "Database-Migration-Mismatch--The--Hash-Client-Secret--Error-in-Django-OAuth---db8fc9a511c7",
  "Use-GPU-in-Tensorflow-on-Ubuntu-22-04-f033e59cf5cb",
  "Tensorflow-tutorial--Basic-operations-on-tensors-fca6c839ca08",
  "Read-data-from-JSON-and-normalize-then-write-into-excel-cb7c29d1268b",
]);

add("Kafka", [
  "My-solution-for-designing-a-resilient-system-in-an-event-driven-pipeline-d1396711d423",
  "How-We-Rebuilt-a-Telecom-KPI-Platform-to-Handle-Billions-of-Records--From-JSON-Blobs-to-Flat--1a4eb6b27574",
  "The-Hidden-Costs-of-Shared-Databases-in-Microservices-Architecture-bbdaecceacb3",
]);

add("PHP", [
  "Install-CakePHP-application-on-server-with-the-traditional-way-on-Ubuntu-22-0-server-3228ae49c3c1",
  "Running-Zarinpal-Gateway-on-Laravel-framework-ac9d84674ec6",
  "Troubles-update-composer-in-Laravel-when-develop-in-docker-17e3abeef50d",
  "Installing-Application-for-web-developer-After-installing-Ubuntu-20-04-LTS-e8114c21044c",
  "Using-Restfull-API-of-Farsava-Deep-learning-Automatic-Speech-Recognition-to-convert-Persian-Speech--1ba75d232212",
]);

add("Redis", [
  "Environment-Configuration-in-Go--Managing-Dev--Test---Production-Environments-9b333c6d1868",
  "How-to-design-a-high-TPS-Inventory--Handle-10K-requests-per-second-92e3c765226d",
  "Improve-speed-of-Machine-Learning-API--Engine--from-3-requests-per-second-to-10000-requests-per--4d649d246a99",
  "Building-Modular-Go-Services-with-Uber-FX-and-SQLC-b8feb4b37721",
  "How-write-a-Unit-test--Integration-test--and-Performance-test-for-the-Golang-language--a25ccef115f4",
]);

add("PostgreSQL", [
  "How-I-Use-AI-to-Build-Production-Ready-GraphQL-Resources-Faster-baf5d5123477",
  "Environment-Configuration-in-Go--Managing-Dev--Test---Production-Environments-9b333c6d1868",
  "Integrating-Multiple-Databases--Inmon-vs--Kimball-and-a-Microservice-ETL-Solution-5e78abb77e28",
]);

add("DevOps", [
  "Getting-Started-with-Docker-files--A-Complete-Guide-d1d5b2d44d1b",
  "How-to-Fix--Cannot-Connect-to-Docker-Daemon--Error-on-Ubuntu-Linux-a2f25a79d786",
  "Building-a-Complete-Kafka---ClickHouse-Streaming-Stack-with-Docker-Compose-98cbfc4bbf0c",
  "Docker-Compose-Setup-for-MongoDB--Redis--and-Minio-f364e79162ea",
  "Best-Practices-for-Developing--Deploying--and-Managing-NestJS-Applications-cef0edc4681f",
  "Making-docker-for-llama3-RAG-system-a3943f972711",
]);

add("Laravel", ["PHP-fpm---I-hate-you-1d17bb8a577b"]);

add("MongoDB", [
  "Installing-Application-for-web-developer-After-installing-Ubuntu-20-04-LTS-e8114c21044c",
]);

add("Design Patterns", [
  "Refactoring-if-Strategies--Transforming-Legacy-Code-for-Modern-E-Commerce-Platforms-3be0717570b4",
  "The-Best-Design-Pattern-for-Query-Based-Change-Data-Capture--Hybrid-Stateful-Polling-with-Offset--95856947ef99",
]);

add("Docker Compose", [
  "Architectural-Optimization-of-Shared-Sandbox-Deployments-in-GitLab-CI-CD-47ccce21fa9d",
  "Adding-ClickHouse-to-a-Go-Project--A-Practical-Guide-Inspired-by-go-simple-5a4cfef93e41",
]);

add("Gin", [
  "Golang-Gin-Middleware-and-Health-Controller-fe53ce9d9754",
  "Serving-an-Offline-GraphQL-Playground-in-Go--Avoiding-the-Gin-Static-File-Pitfalls-dd907b2ab087",
  "Refactoring-a-Go-Web-Service-with-Uber-FX--From-Monolith-to-Modular-Elegance-2789a9ac8ec5",
  "Integrating-SQLC-and-GraphQL-in-Go--A-Practical-Example-with-Product-Filtering-4722e0a53179",
]);

add("Payments", [
  "Introduction-to-the-Parsian-Bank-Gateway-Implementation-in-NestJS-9077a5441b5a",
  "When-Your-Domain-Talks-to-Stripe--A-DDD-Cautionary-Tale-9b498a851a7d",
  "Running-Zarinpal-Gateway-on-Laravel-framework-ac9d84674ec6",
]);

add("AI", [
  "What-will-happen-if-a-big-tech-based-company-hires-a-senior-software-developer-using-LLM-and-AI-in--0e10e42d0229",
  "Implementation-Experience--Retrieval-Augmented-Generation--RAG--System-for-AI-powered-Customer--1268ac4b4f8b",
  "RAG-System---Knowledge-Graph--the-system-for-finding-the-best-answer-in-the-tickets-management--e2ae2692c7c6",
  "How-to-Make-Python-Telegram-Bot-for-Conversational-AI-370d8e2c82bf",
  "Making-docker-for-llama3-RAG-system-a3943f972711",
  "Build-a-RAG-with-llama-a24e88e1a399",
  "Design-daily-FAQ-maker-with-AI--25db05f8881e",
  "Leveraging-RAG-for-Continuously-Updated-FAQ-Datasets-to-Enhance-Client-Support-1d4dd8c9460a",
  "My-Experience-in-Using-RAG-and-Fine-Tuning-in-ChatGPT-3-5-3b9e584059ba",
  "Data-Driven-Approach-to-Building-an-Effective-Knowledge-Base-based-on-Artificial-Intelligence-ef3ef169f138",
  "How-to-Fine-tune-ChatGPT-305606a02605",
  "Get-Data-from-Fresh-Desk-with-API-Key-and-Write-Notes-with-Open-AI-5eee50365cbb",
  "Get-Data-from-medium-and-make-an-AI-model-e2eda73f62cb",
  "Open-AI-tutorial-bbd89b9bd242",
  "AI-Powered-Paraphrasing-for-SEO--Optimizing-Product-Descriptions-with-AvalAI-API-26caab0f1a23",
  "Harnessing-AI-Agents-to-Revolutionize-Pricing-Strategies-Through-Customer-Behavior-and--8ba2b1eb1520",
]);

add("RAG", [
  "Implementation-Experience--Retrieval-Augmented-Generation--RAG--System-for-AI-powered-Customer--1268ac4b4f8b",
  "RAG-System---Knowledge-Graph--the-system-for-finding-the-best-answer-in-the-tickets-management--e2ae2692c7c6",
  "Making-docker-for-llama3-RAG-system-a3943f972711",
  "Build-a-RAG-with-llama-a24e88e1a399",
  "Leveraging-RAG-for-Continuously-Updated-FAQ-Datasets-to-Enhance-Client-Support-1d4dd8c9460a",
  "My-Experience-in-Using-RAG-and-Fine-Tuning-in-ChatGPT-3-5-3b9e584059ba",
  "RAG-retrieval-augmented-generation-a93e1a3bf531",
]);

add("CI/CD", ["Atomic-Deployment-of-Go-Binaries-on-Ubuntu-with-Cron-dd7cf94cd8ab"]);

add("Clean Code", [
  "Eliminating-Code-Duplication-in-Go-with-go-generate--A-Practical-Guide-13d40dfa6df1",
  "Refactoring-a-Go-Web-Service-with-Uber-FX--From-Monolith-to-Modular-Elegance-2789a9ac8ec5",
  "Refactoring-if-Strategies--Transforming-Legacy-Code-for-Modern-E-Commerce-Platforms-3be0717570b4",
  "How-Domain-Boundary-Violations-Slowly-Destroy-Your-Codebase-9cef4b11f8f1",
]);

add("Integration", [
  "How-I-Use-AI-to-Build-Production-Ready-GraphQL-Resources-Faster-baf5d5123477",
  "Integrating-SQLC-and-GraphQL-in-Go--A-Practical-Example-with-Product-Filtering-4722e0a53179",
  "Integrating-Multiple-Databases--Inmon-vs--Kimball-and-a-Microservice-ETL-Solution-5e78abb77e28",
  "Keycloak---OpenFGA--A-Practical-Integration-Guide-a9ed984ee205",
]);

add("Kubernetes", [
  "Architectural-Optimization-of-Shared-Sandbox-Deployments-in-GitLab-CI-CD-47ccce21fa9d",
]);

add("Protobuf", ["Step-by-Step-Guide-to-Adding-gRPC-to-go-simple----628bc37143b7"]);

add("RESTful API", [
  "Building-a-Clean--Secure--and-Scalable-Go-Web-API--A-Layered-Architecture-Guide-ee3afe4aa58d",
  "Building-a-GraphQL-API-in-Go-with-Custom-Scalars-0b1a1b3e52f9",
  "Make-simple-CRUD-requests-with-NestJS-366f6cbfff6d",
  "Make-swagger-from-your-HTTP-Rest-full-in-Golang-4dc9088f5292",
]);

add("Swagger", [
  "Building-Modular-Product-Management-in-Go-with-SQLC--Uber-FX--and-Gin-bfb6dfaada6b",
  "Building-a-Clean--Secure--and-Scalable-Go-Web-API--A-Layered-Architecture-Guide-ee3afe4aa58d",
]);

add("Unit", [
  "How-to-Write-Effective-Test-Files-in-Go-for-REST-APIs---577e01cdfe36",
  "Run-test-case-in-Golnag-with--env-file-520616cbb54a",
]);

add("DDD", [
  "How-Domain-Boundary-Violations-Slowly-Destroy-Your-Codebase-9cef4b11f8f1",
  "The-Entity-You-Modeled-Isn-t-the-Entity-That-Persists-vtwge",
  "One-Door--Two-Mechanisms--When-Your-Domain-Model-Quietly-Forks-Itself-oewde",
]);

add("ETL", [
  "Integrating-Multiple-Databases--Inmon-vs--Kimball-and-a-Microservice-ETL-Solution-5e78abb77e28",
  "Comprehensive-Overview-of-Microsoft-SQL-Server-Business-Intelligence--BI--Stack-62383118c5f8",
  "The-Best-Design-Pattern-for-Query-Based-Change-Data-Capture--Hybrid-Stateful-Polling-with-Offset--95856947ef99",
]);

add("Productivity", [
  "Essential-VS-Code-Extensions-for-Go-Developers--My-Daily-Toolkit-5604c0bbaf85",
  "Best-List-of-Vscode-Plugin-as-Golang-developer-in-Backend-position-4c3c945a903c",
  "Improving-Team-Morale-and-Efficiency-in-Software-Development-Projects-d5f3da0b2137",
  "The-High-Cost-of-Toxicity--Why-Insults--Humiliation--and-Blame-Are-Killing-Your-Workplace-Culture-e3fe8e3645f7",
]);

const teamPosts = [
  "Breaking-the-Cycle-of-Workplace-Overwhelm--Strategies-for-Healthier--More-Productive-Teams-5a00f94922ee",
  "Workplace-Consumerism-Culture--A-Deep-Dive-into-Causes--Consequences--and-Solutions-e549d309a403",
  "The-High-Cost-of-Toxicity--Why-Insults--Humiliation--and-Blame-Are-Killing-Your-Workplace-Culture-e3fe8e3645f7",
  "Title--Setting-Boundaries-with-Clients--A-Guide-to-Professional-and-Effective-Communication-040db339cd83",
  "The-Human-Side-of-Bug-Fixing-in-Software-Development---Tell-me-you-re-good-enough-so-I-can-fix-the--d9510fb6dfce",
  "Improving-Team-Morale-and-Efficiency-in-Software-Development-Projects-d5f3da0b2137",
  "The-Art-and-Science-of-Technical-Hiring--A-Comprehensive-Guide-158ca954f2c7",
  "Breaking-Free-from-the--I-m-Good--You-re-Bad--Mindset--Transforming-Competitive-Culture-into--cc5a64a3bfc6",
  "The-Hidden-Challenges-of-System-Teams-in-Software-Companies--Balancing-People--Process--and--cfc16a6e1790",
  "Effect-of-Inflation-on-IT-company-culture-in-Iran-dd1a5ade1605",
];
add("Team Management", teamPosts);
add("Workplace Culture", teamPosts);

remove("Machine Learning", [
  "Rebuilding-the-Time-Machine--Designing-a-Dual-Purpose-Data-Versioning-System-for-Modern-Backends--c00ddf54bf53",
  "Architectural-Optimization-of-Shared-Sandbox-Deployments-in-GitLab-CI-CD-47ccce21fa9d",
  "Building-a-Safe--Parallel-WooCommerce-Crawler-in-Go-with-Colly-8786353b4b16",
  "Designing-a-Scalable-Poller-Dispatcher-Worker-Architecture-in-Go-eb5576116190",
  "Integrating-Multiple-Databases--Inmon-vs--Kimball-and-a-Microservice-ETL-Solution-5e78abb77e28",
  "The-Hidden-Costs-of-Shared-Databases-in-Microservices-Architecture-bbdaecceacb3",
  "Atomic-Deployment-of-Go-Binaries-on-Ubuntu-with-Cron-dd7cf94cd8ab",
  "The-Best-Design-Pattern-for-Query-Based-Change-Data-Capture--Hybrid-Stateful-Polling-with-Offset--95856947ef99",
  "Building-Modular-Go-Services-with-Uber-FX-and-SQLC-b8feb4b37721",
  "Workplace-Consumerism-Culture--A-Deep-Dive-into-Causes--Consequences--and-Solutions-e549d309a403",
  "MongoDB-and-GraphQL-in-the-Nestjs-08b0f6ff5c41",
  "NestJS--Data-Validation-and-Transformation-ce99115c760d",
  "I-have-seen-the-various-personalities-of-developers--based-on-the-DISC-personality-Test-288dfec6b3fa",
  "Best-List-of-Vscode-Plugin-as-Golang-developer-in-Backend-position-4c3c945a903c",
  "Installing-Application-for-Golang-developer-After-installing-Ubuntu-22-04-LTS-5d5570a78340",
  "PHP-fpm---I-hate-you-1d17bb8a577b",
  "Read-data-from-JSON-and-normalize-then-write-into-excel-cb7c29d1268b",
]);

remove("Testing", [
  "I-have-seen-the-various-personalities-of-developers--based-on-the-DISC-personality-Test-288dfec6b3fa",
]);

remove("Go", [
  "The-Hidden-Challenges-of-System-Teams-in-Software-Companies--Balancing-People--Process--and--cfc16a6e1790",
]);

remove("Linux", ["Nodejs-with-Smart-contract-for-beginner-version-0-4-17-59ee1d46aced"]);

remove("Microservices", [
  "Install-CakePHP-application-on-server-with-the-traditional-way-on-Ubuntu-22-0-server-3228ae49c3c1",
]);

remove("Architecture", [
  "Install-CakePHP-application-on-server-with-the-traditional-way-on-Ubuntu-22-0-server-3228ae49c3c1",
]);

function normalizeTags(post) {
  const removed = removals.get(post.slug) || new Set();
  const tags = (post.tags || [])
    .map((tag) => renameTags.get(tag) || tag)
    .filter((tag) => !retiredTags.has(tag) && !removed.has(tag));

  for (const tag of additions.get(post.slug) || []) tags.push(tag);
  return [...new Set(tags)];
}

const tagsBySlug = new Map();
for (const post of posts) {
  post.tags = normalizeTags(post);
  tagsBySlug.set(post.slug, post.tags);

  const sourcePath = path.join("src/data/posts", `${post.slug}.json`);
  if (!fs.existsSync(sourcePath)) throw new Error(`Missing post file: ${sourcePath}`);
  const fullPost = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  fullPost.tags = post.tags;
  const json = `${JSON.stringify(fullPost, null, 2)}\n`;
  fs.writeFileSync(sourcePath, json);
  fs.writeFileSync(path.join("public/data/posts", `${post.slug}.json`), json);
}

const formattedIndex = `${JSON.stringify(posts, null, 2)}\n`;
fs.writeFileSync("src/data/posts-index.json", formattedIndex);
fs.writeFileSync("public/data/posts-index.json", formattedIndex);

const searchIndex = JSON.parse(fs.readFileSync("src/data/search-index.json", "utf8"));
for (const post of searchIndex) {
  const tags = tagsBySlug.get(post.slug);
  if (!tags) throw new Error(`Search index has unknown slug: ${post.slug}`);
  post.tags = tags;
}
const compactSearchIndex = JSON.stringify(searchIndex);
fs.writeFileSync("src/data/search-index.json", compactSearchIndex);
fs.writeFileSync("public/data/search-index.json", compactSearchIndex);

const counts = {};
for (const post of posts) {
  for (const tag of post.tags) counts[tag] = (counts[tag] || 0) + 1;
}

console.log(
  Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag, count]) => `${tag}: ${count}`)
    .join("\n"),
);
