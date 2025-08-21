"use client";

import { useMjcfEditorStore } from "@/contexts/MjcfEditorStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Circle, Square, Cylinder, Pill } from "lucide-react";

export default function PrimitivePalette() {
  const addPrimitive = useMjcfEditorStore((s) => s.addPrimitive);
  
  const primitives = [
    { type: "sphere", label: "Sphere", icon: Circle },
    { type: "box", label: "Box", icon: Square },
    { type: "capsule", label: "Capsule", icon: Pill },
    { type: "cylinder", label: "Cylinder", icon: Cylinder }
  ] as const;

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Add Primitives</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">
        {primitives.map((primitive) => {
          const IconComponent = primitive.icon;
          return (
            <Button
              key={primitive.type}
              variant="outline"
              className="h-16 flex-col justify-center gap-1 text-xs cursor-pointer hover:scale-105 transition-transform"
              onClick={() => addPrimitive(primitive.type)}
            >
              <IconComponent className="h-5 w-5" />
              {primitive.label}
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}


