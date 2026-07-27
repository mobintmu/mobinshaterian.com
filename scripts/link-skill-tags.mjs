#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const skillTagPosts = {
  Gin: [
    "Gin-framework-in-Golang-c453436c8c07",
    "Add-Swagger-to-a-Golang-Gin-Project-0cad93295e0e",
    "Building-Modular-Product-Management-in-Go-with-SQLC--Uber-FX--and-Gin-bfb6dfaada6b",
  ],
  Echo: ["Simple-Golang-HTTP-server-fe7a88ef221e"],
  Protobuf: [
    "Introducing-Buf-for-Protobuf-06ebc98710c6",
    "Incredible-futures-of--buf-to-generate-Protobuf--GitHub-action-871f0d4f2339",
  ],
  "RESTful API": [
    "How-to-Write-Effective-Test-Files-in-Go-for-REST-APIs---577e01cdfe36",
    "Using-Restfull-API-of-Farsava-Deep-learning-Automatic-Speech-Recognition-to-convert-Persian-Speech--1ba75d232212",
  ],
  CQRS: [
    "My-experience-to-build-a-CQRS-system-with-microservices-architecture-in-a-financial-system-to--1deeead8db9d",
  ],
  "Clean Code": [
    "Building-a-Clean--Secure--and-Scalable-Go-Web-API--A-Layered-Architecture-Guide-ee3afe4aa58d",
    "Code-Refactoring--Eliminating-Duplication-with-Function-Injection-in-Go-0de231011296",
  ],
  SOLID: ["Factory-Design-Patterns-and-SOLID-Principles-in-Golang-6aa6a60cc543"],
  OOP: ["Factory-Design-Patterns-and-SOLID-Principles-in-Golang-6aa6a60cc543"],
  "Design Patterns": [
    "Factory-Design-Patterns-and-SOLID-Principles-in-Golang-6aa6a60cc543",
    "Mastering-State-Patterns-in-Golang--Overcoming-Conditional-Statement-Limitations-ffc32b9b71ee",
    "Toxic-mistake-to-use-the-Function-option-pattern-instead-of-the-Builder-pattern-5b363508ad73",
  ],
  PostgreSQL: [
    "PostgreSQL-Concurrency--Locking--and-Isolation-Levels-9fde2d582668",
    "PostgreSQL-Foreign-Data-Wrappers-for-Data-Federation-7043c561f218",
    "Mastering-the-Manual--A-Guide-to-Manually-Installing-PostgreSQL-JDBC-Drivers-in-DBeaver-ac5c1507c94b",
  ],
  Cassandra: [
    "Database-Deep-Dive--Exploring-Storage-Engines-and-Indexing-Strategies-LSM-Trees-vs--B-Trees-268ac1d24056",
    "System-Design--A-Comprehensive-Exploration-Based-on-Practical-Discussion-c55a288eda31",
  ],
  MySQL: [
    "Database-Deep-Dive--Exploring-Storage-Engines-and-Indexing-Strategies-LSM-Trees-vs--B-Trees-268ac1d24056",
  ],
  JetStream: ["Nats-Jet-Strem--Hello-World-d909099c88e4"],
  RabbitMQ: ["How-to-design-a-high-TPS-Inventory--Handle-10K-requests-per-second-92e3c765226d"],
  OpenTelemetry: [
    "Using-open-telemetry-in-Golang-ef282c236e77",
    "Exclude-Endpoints-with-Sample-Rate-in-OpenTelemetry-in-the-Golang-Language-969da599af82",
    "Tracking-system-request-with-Open-telemetry--sentry-and-Go-in-Golang-language-b77c9cc4fb5a",
  ],
  Prometheus: [
    "Configuration-Prometheus-for-Golang-language-with-Go-micro-framework-in-micro-service-architecture--f4c128ad836",
  ],
  Sentry: [
    "Tracking-system-request-with-Open-telemetry--sentry-and-Go-in-Golang-language-b77c9cc4fb5a",
  ],
  Swagger: [
    "Add-Swagger-to-a-Golang-Gin-Project-0cad93295e0e",
    "Make-swagger-from-your-HTTP-Rest-full-in-Golang-4dc9088f5292",
  ],
  "Docker Compose": [
    "Building-a-Complete-Kafka---ClickHouse-Streaming-Stack-with-Docker-Compose-98cbfc4bbf0c",
    "Docker-Compose-Setup-for-MongoDB--Redis--and-Minio-f364e79162ea",
    "Nestjs---PostgreSQL-database-with-docker-compose-and-Liquibase-faec0b09d944",
  ],
  MinIO: ["Docker-Compose-Setup-for-MongoDB--Redis--and-Minio-f364e79162ea"],
  "CI/CD": [
    "Architectural-Optimization-of-Shared-Sandbox-Deployments-in-GitLab-CI-CD-47ccce21fa9d",
    "Deploying-a-Lovable--TanStack-Start--App-with-GitHub-Actions---the-Real-Story-272he",
  ],
  TDD: [
    "How-write-a-Unit-test--Integration-test--and-Performance-test-for-the-Golang-language--a25ccef115f4",
  ],
  Unit: [
    "How-write-a-Unit-test--Integration-test--and-Performance-test-for-the-Golang-language--a25ccef115f4",
    "How-do-you-write-tests-in-Nestjs--03149ebeb372",
  ],
  Integration: [
    "How-write-a-Unit-test--Integration-test--and-Performance-test-for-the-Golang-language--a25ccef115f4",
    "Connecting-Kafka-to-ClickHouse-with-SSL--A-Complete-Integration-Guide-e5a0a5957de3",
  ],
};

const tagsBySlug = new Map();
for (const [tag, slugs] of Object.entries(skillTagPosts)) {
  for (const slug of slugs) {
    if (!tagsBySlug.has(slug)) tagsBySlug.set(slug, []);
    tagsBySlug.get(slug).push(tag);
  }
}

for (const [slug, addedTags] of tagsBySlug) {
  const sourcePath = path.join("src/data/posts", `${slug}.json`);
  if (!fs.existsSync(sourcePath)) throw new Error(`Unknown post slug: ${slug}`);

  const post = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  post.tags = [...new Set([...(post.tags || []), ...addedTags])];
  const json = JSON.stringify(post, null, 2);
  fs.writeFileSync(sourcePath, json);
  fs.writeFileSync(path.join("public/data/posts", `${slug}.json`), json);
}

for (const indexPath of ["src/data/posts-index.json", "public/data/posts-index.json"]) {
  const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  for (const post of index) {
    const addedTags = tagsBySlug.get(post.slug);
    if (addedTags) post.tags = [...new Set([...(post.tags || []), ...addedTags])];
  }
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
}

for (const searchPath of ["src/data/search-index.json", "public/data/search-index.json"]) {
  const index = JSON.parse(fs.readFileSync(searchPath, "utf8"));
  for (const post of index) {
    const addedTags = tagsBySlug.get(post.slug);
    if (addedTags) post.tags = [...new Set([...(post.tags || []), ...addedTags])];
  }
  fs.writeFileSync(searchPath, JSON.stringify(index));
}

console.log(
  `Linked ${Object.keys(skillTagPosts).length} skill tags to ${tagsBySlug.size} existing posts.`,
);
