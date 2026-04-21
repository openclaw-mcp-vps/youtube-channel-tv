import { format } from "date-fns";
import type { GuideItem } from "@/lib/schedule";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProgramGuideProps {
  items: GuideItem[];
}

export function ProgramGuide({ items }: ProgramGuideProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Program Guide</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2"
          >
            <div>
              <p className="text-sm font-medium text-slate-100">{item.title}</p>
              <p className="text-xs text-slate-400">
                {format(item.start, "h:mm a")} - {format(item.end, "h:mm a")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {index === 0 && <Badge variant="alert">Live</Badge>}
              {item.kind === "break" ? <Badge variant="muted">Break</Badge> : <Badge>Show</Badge>}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
