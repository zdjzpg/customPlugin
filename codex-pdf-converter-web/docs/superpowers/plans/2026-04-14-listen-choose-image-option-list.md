# Listen Choose Image Option List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the listen-choose-image question type from a comma-separated word field into an editable option list with image upload, word input, and a single correct answer selector.

**Architecture:** Add a focused editor component for the option-list UI so both builder screens can reuse the same configuration pattern. Update question defaults and normalization to support the new `choices + correctChoiceId` model while keeping backward compatibility for older `wordsText + answer` data, then update the student renderer and reporting logic to use choice ids instead of raw words.

**Tech Stack:** Vue 3, Ant Design Vue, Node test runner, shared question utilities in `src/utils/content.js`

---
