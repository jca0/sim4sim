import type { BodyNode } from "@/types/mjcf";

const formatNumbers = (arr: number[]): string =>
  arr.map((v) => Number.isFinite(v) ? +(+v).toFixed(6) : 0).join(" ");

const escapeAttr = (v: string): string => v.replace(/\"/g, "&quot;");

export function buildMjcfXml(nodes: BodyNode[], modelName = "scene"): string {
  // Texture and material definitions for ground plane
  const assets = `  <asset>
    <texture type="2d" name="groundplane" builtin="checker" mark="edge" rgb1="0.2 0.3 0.4" rgb2="0.1 0.2 0.3" markrgb="0.8 0.8 0.8" width="300" height="300"/>
    <material name="groundplane" texture="groundplane" texuniform="true" texrepeat="5 5"/>
  </asset>`;

  // Ground plane as a static geometry with material
  const groundPlane = `    <geom name="ground" type="plane" size="10 10 0.1" pos="0 0 0" material="groundplane"/>`;
  
  const bodies = nodes
    .map((n) => {
      const pos = formatNumbers(n.pos);
      const quat = formatNumbers(n.quat);
      const size = formatNumbers(n.geom.size);
      const rgba = n.geom.rgba ? ` rgba="${formatNumbers(n.geom.rgba)}"` : "";
      const group = n.geom.group !== undefined ? ` group="${n.geom.group}"` : "";
      const contype = n.geom.contype !== undefined ? ` contype="${n.geom.contype}"` : "";
      const conaffinity = n.geom.conaffinity !== undefined ? ` conaffinity="${n.geom.conaffinity}"` : "";
      const friction = n.geom.friction ? ` friction="${formatNumbers(n.geom.friction)}"` : "";
      return `    <body name="${escapeAttr(n.name)}" pos="${pos}" quat="${quat}">\n      <geom type="${n.geom.type}" size="${size}"${rgba}${group}${contype}${conaffinity}${friction}/>\n    </body>`;
    })
    .join("\n");

  const worldbodyContent = [groundPlane, bodies].filter(Boolean).join("\n");
  
  return `<?xml version="1.0"?>\n<mujoco model="${escapeAttr(modelName)}">\n  <compiler angle="degree" coordinate="local"/>\n${assets}\n  <worldbody>\n${worldbodyContent}\n  </worldbody>\n</mujoco>\n`;
}