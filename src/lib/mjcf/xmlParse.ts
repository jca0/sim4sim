"use client";

import type { BodyNode, GeomType } from "@/types/mjcf";

function parseNumberArray(str: string | null | undefined): number[] {
  if (!str) return [];
  return str
    .trim()
    .split(/\s+/)
    .map((v) => {
      const n = parseFloat(v);
      return Number.isFinite(n) ? n : 0;
    });
}

function ensureUniqueNames(names: string[]): string[] {
  const seen = new Map<string, number>();
  return names.map((name) => {
    const base = name || "body";
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}_${count + 1}`;
  });
}

export function parseMjcfXml(xmlString: string): BodyNode[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, "application/xml");

  const parsererror = doc.querySelector("parsererror");
  if (parsererror) {
    throw new Error("XML parse error");
  }

  const bodyElements = Array.from(doc.querySelectorAll("mujoco > worldbody > body"));

  // Collect names first and ensure uniqueness
  const incomingNames = bodyElements.map((b) => (b.getAttribute("name") || "body").trim());
  const uniqueNames = ensureUniqueNames(incomingNames);

  const nodes: BodyNode[] = bodyElements.map((bodyEl, index) => {
    const uniqueName = uniqueNames[index];
    const pos = parseNumberArray(bodyEl.getAttribute("pos"));
    const quat = parseNumberArray(bodyEl.getAttribute("quat"));

    const geomEl = bodyEl.querySelector(":scope > geom");
    const typeAttr = (geomEl?.getAttribute("type") || "box").trim() as GeomType;
    const size = parseNumberArray(geomEl?.getAttribute("size"));
    const rgba = parseNumberArray(geomEl?.getAttribute("rgba"));
    const groupAttr = geomEl?.getAttribute("group");
    const contypeAttr = geomEl?.getAttribute("contype");
    const conaffinityAttr = geomEl?.getAttribute("conaffinity");
    const frictionArr = parseNumberArray(geomEl?.getAttribute("friction"));

    const node: BodyNode = {
      id: uniqueName,
      name: uniqueName,
      pos: [pos[0] ?? 0, pos[1] ?? 0, pos[2] ?? 0],
      quat: [quat[0] ?? 1, quat[1] ?? 0, quat[2] ?? 0, quat[3] ?? 0],
      geom: {
        type: ["sphere", "box", "capsule", "cylinder"].includes(typeAttr)
          ? typeAttr
          : "box",
        size: size.length ? size : [0.1, 0.1, 0.1],
        rgba: rgba.length === 4 ? [rgba[0], rgba[1], rgba[2], rgba[3]] : undefined,
        group: groupAttr !== null && groupAttr !== undefined ? parseInt(groupAttr) : undefined,
        contype: contypeAttr !== null && contypeAttr !== undefined ? parseInt(contypeAttr) : undefined,
        conaffinity: conaffinityAttr !== null && conaffinityAttr !== undefined ? parseInt(conaffinityAttr) : undefined,
        friction: frictionArr.length === 3 ? [frictionArr[0], frictionArr[1], frictionArr[2]] : undefined,
      },
    };
    return node;
  });

  return nodes;
}


