"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, ClipboardCheck } from "lucide-react";
import { CHECKLIST_PDFS } from "@/lib/constants";

const checklists = [
  { ...CHECKLIST_PDFS.DOCTORAT.inscription, color: "blue" as const },
  { ...CHECKLIST_PDFS.DOCTORAT.soutenance, color: "emerald" as const },
  { ...CHECKLIST_PDFS.MASTER.soutenance, color: "amber" as const },
];

const colorMap = {
  blue: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", hover: "hover:bg-blue-100 hover:border-blue-300" },
  emerald: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", hover: "hover:bg-emerald-100 hover:border-emerald-300" },
  amber: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", hover: "hover:bg-amber-100 hover:border-amber-300" },
};

export default function ChecklistDownloader() {
  return (
    <Card className="mb-12 border-2 border-slate-200">
      <CardHeader className="bg-slate-100">
        <CardTitle className="flex items-center gap-3 text-slate-900">
          <ClipboardCheck className="h-6 w-6 text-slate-700" />
          Checklists des documents requis
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <p className="text-slate-600 mb-6">
          Téléchargez la checklist correspondant à votre type de demande pour connaître la liste complète des documents requis.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {checklists.map((checklist, index) => {
            const colors = colorMap[checklist.color];
            return (
              <a
                key={index}
                href={checklist.url}
                target="_blank"
                rel="noopener noreferrer"
                download
                className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 ${colors.bg} ${colors.border} ${colors.text} ${colors.hover} transition-all duration-200 shadow-sm hover:shadow-md`}
              >
                <Download className="h-8 w-8" />
                <span className="text-sm font-semibold text-center">{checklist.label}</span>
              </a>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
