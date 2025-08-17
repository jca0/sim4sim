export type GeomType = "sphere" | "box" | "capsule" | "cylinder";

export type BodyNode = {
  id: string;
  name: string;
  pos: [number, number, number];
  quat: [number, number, number, number];
  geom: {
    type: GeomType;
    size: number[]; // sphere: [r], box: [sx, sy, sz], capsule/cylinder: [r, halfheight]
    rgba?: [number, number, number, number];
    group?: number;
    contype?: number;
    conaffinity?: number;
    friction?: [number, number, number];
  };
};

