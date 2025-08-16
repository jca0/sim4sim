import type { BodyNode } from "@/types/mjcf";

const formatNumbers = (arr: number[]): string =>
  arr.map((v) => Number.isFinite(v) ? +(+v).toFixed(6) : 0).join(" ");

const escapeAttr = (v: string): string => v.replace(/\"/g, "&quot;");

export function buildMjcfXml(nodes: BodyNode[], modelName = "scene"): string {
  const bodies = nodes
    .map((n) => {
      const pos = formatNumbers(n.pos);
      const quat = formatNumbers(n.quat);
      const size = formatNumbers(n.geom.size);
      const rgba = n.geom.rgba ? ` rgba="${formatNumbers(n.geom.rgba)}"` : "";
      return `  <body name="${escapeAttr(n.name)}" pos="${pos}" quat="${quat}">\n    <geom type="${n.geom.type}" size="${size}"${rgba}/>\n  </body>`;
    })
    .join("\n");

  return `<?xml version="1.0"?>\n<mujoco model="${escapeAttr(modelName)}">\n  <compiler angle="degree" coordinate="local"/>\n  <worldbody>\n${bodies}\n  </worldbody>\n</mujoco>\n`;
}


