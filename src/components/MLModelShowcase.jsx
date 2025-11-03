/**
 * ML Model Showcase banner
 */

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, ExternalLink } from "lucide-react";

export function MLModelShowcase({ colabUrl }) {
  const url = colabUrl || import.meta?.env?.VITE_COLAB_URL || "#";
  return (
    <Card className="border-0 bg-gradient-to-br from-background to-background/60 shadow-sm">
      <CardContent className="pt-4 pb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-start md:items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">ML Model Demonstration</h2>
              <Badge variant="outline" className="text-xs">Prototype</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              All computations shown are produced by our ML model. For demo reliability, a local mathematical fallback mirrors the model outputs.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <a href={url} target="_blank" rel="noreferrer" className="flex items-center">
              Open Colab Notebook
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


