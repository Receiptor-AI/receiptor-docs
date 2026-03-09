#!/usr/bin/env node

import { access, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const DEFAULT_URL = "https://developer.api.receiptor.ai/v1/capabilities";
const SOURCE_URL = process.env.RECEIPTOR_CAPABILITIES_URL || DEFAULT_URL;

function escapePipes(input) {
  return String(input).replaceAll("|", "\\|");
}

function normalizeCapabilities(payload) {
  const direct = Array.isArray(payload?.capabilities) ? payload.capabilities : null;
  const nested = Array.isArray(payload?.data?.capabilities) ? payload.data.capabilities : null;
  const capabilities = direct || nested || [];

  return capabilities
    .map((cap) => {
      const slug = typeof cap?.slug === "string" ? cap.slug : "";
      const name = typeof cap?.name === "string" ? cap.name : slug;
      const description = typeof cap?.description === "string" ? cap.description : "";
      const permissions = Array.isArray(cap?.permissions)
        ? cap.permissions.filter((p) => typeof p === "string")
        : [];
      const inputSchema = cap?.inputSchema && typeof cap.inputSchema === "object" ? cap.inputSchema : {};

      return { slug, name, description, permissions, inputSchema };
    })
    .filter((cap) => cap.slug.length > 0 || cap.name.length > 0)
    .sort((a, b) => (a.slug || a.name).localeCompare(b.slug || b.name));
}

function toMdx(capabilities) {
  const generatedAt = new Date().toISOString();

  const tableRows = capabilities
    .map((cap) => {
      const perms = cap.permissions.length ? cap.permissions.join(", ") : "-";
      const id = cap.slug || cap.name;
      const slugCell = cap.slug ? `\`${escapePipes(cap.slug)}\`` : "-";
      return `| \`${escapePipes(id)}\` | ${slugCell} | ${escapePipes(cap.description || "-")} | \`${escapePipes(perms)}\` |`;
    })
    .join("\n");

  const sections = capabilities
    .map((cap) => {
      const perms = cap.permissions.length ? cap.permissions.map((p) => `- \`${p}\``).join("\n") : "- `none`";
      const id = cap.slug || cap.name;
      return [
        `### \`${id}\``,
        "",
        cap.description || "_No description provided._",
        "",
        "Permissions:",
        perms,
        "",
        "Input schema:",
        "```json",
        JSON.stringify(cap.inputSchema, null, 2),
        "```"
      ].join("\n");
    })
    .join("\n\n");

  return `---
title: Live Capabilities Catalog
description: Auto-generated capability list and input schemas from the live discovery endpoint.
---

This page is auto-generated from:

- \`${SOURCE_URL}\`

Last generated: \`${generatedAt}\`

## Capabilities

| Identifier | Slug | Description | Permissions |
| --- | --- | --- | --- |
${tableRows || "| _none_ | - | - | - |"}

## Schemas

${sections || "_No capabilities returned._"}
`;
}

async function main() {
  const outFile = path.resolve(process.cwd(), "api/capabilities/live-catalog.mdx");
  try {
    const response = await fetch(SOURCE_URL, {
      headers: {
        accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch capabilities from ${SOURCE_URL} (HTTP ${response.status})`);
    }

    const payload = await response.json();
    const capabilities = normalizeCapabilities(payload);
    const mdx = toMdx(capabilities);
    await writeFile(outFile, mdx, "utf8");

    console.log(`Wrote ${capabilities.length} capabilities to ${outFile}`);
    return;
  } catch (error) {
    try {
      await access(outFile);
      console.warn(
        `Warning: could not refresh capabilities from ${SOURCE_URL}. Keeping existing file at ${outFile}.`
      );
      return;
    } catch {
      const fallback = toMdx([]);
      await writeFile(outFile, fallback, "utf8");
      console.warn(
        `Warning: could not fetch capabilities from ${SOURCE_URL}. Wrote empty fallback catalog to ${outFile}.`
      );
      return;
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
