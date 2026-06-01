# Listen Choose Letter Drag UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current hard-list selection UI for `listen_choose_letter` with a playful student-side letter pool and drop-slot interaction.

**Architecture:** Keep the existing backend config and scoring model based on `selectedLetters`, but introduce slot-based assignment helpers in the store so the component can drag letters from a pool into one or two slots. Update only the question component, store event wiring, and shared CSS so the new interaction fits the existing PaperView flow.

**Tech Stack:** Vue 3, existing store actions in `src/store/examStore.js`, shared CSS in `src/styles.css`, Node test runner

---
