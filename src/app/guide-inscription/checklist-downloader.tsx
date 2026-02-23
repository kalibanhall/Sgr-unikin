"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, ChevronRight } from "lucide-react";

const programs = [
  {
    id: "inscription-these",
    label: "Inscription à la Thèse de Doctorat",
    description: "Checklist des documents requis pour l'inscription à la thèse de doctorat",
    file: "/checklists/checklist-inscription-these.pdf",
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-300",
    ringColor: "ring-blue-500",
  },
  {
    id: "soutenance-dea-des",
    label: "Soutenance DEA / DES",
    description: "Checklist des documents requis pour la soutenance de mémoire DEA ou DES",
    file: "/checklists/checklist-soutenance-dea-des.pdf",
    color: "from-emerald-500 to-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-300",
    ringColor: "ring-emerald-500",
  },
  {
    id: "soutenance-these",
    label: "Soutenance de Thèse de Doctorat",
    description: "Checklist des documents requis pour la soutenance de thèse de doctorat",
    file: "/checklists/checklist-soutenance-these.pdf",
    color: "from-violet-500 to-violet-600",
    bgColor: "bg-violet-50",
    borderColor: "border-violet-300",
    ringColor: "ring-violet-500",
  },
];

export default function ChecklistDownloader() {
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);

  const selected = programs.find((p) => p.id === selectedProgram);

  return (
    <Card className="mb-12">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-6 w-6 text-blue-600" />
          Télécharger la checklist de votre programme
        </CardTitle>
        <p className="text-gray-600 mt-1">
          Sélectionnez votre programme pour télécharger la checklist des documents requis.
        </p>
      </CardHeader>
      <CardContent>
        {/* Program selector */}
        <div className="space-y-3 mb-6">
          {programs.map((program) => (
            <button
              key={program.id}
              onClick={() => setSelectedProgram(program.id)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 ${
                selectedProgram === program.id
                  ? `${program.bgColor} ${program.borderColor} ring-2 ${program.ringColor}`
                  : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                  selectedProgram === program.id
                    ? `bg-linear-to-br ${program.color}`
                    : "bg-gray-100"
                }`}
              >
                <FileText
                  className={`h-6 w-6 ${
                    selectedProgram === program.id ? "text-white" : "text-gray-400"
                  }`}
                />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{program.label}</h3>
                <p className="text-sm text-gray-600">{program.description}</p>
              </div>
              <ChevronRight
                className={`h-5 w-5 shrink-0 transition-transform ${
                  selectedProgram === program.id
                    ? "text-gray-900 rotate-90"
                    : "text-gray-300"
                }`}
              />
            </button>
          ))}
        </div>

        {/* Download button */}
        {selected && (
          <div className={`${selected.bgColor} rounded-xl p-6 text-center animate-in fade-in duration-300`}>
            <p className="text-gray-700 mb-4 font-medium">
              Checklist pour : <span className="font-bold text-gray-900">{selected.label}</span>
            </p>
            <a
              href={selected.file}
              download
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="lg"
                className={`bg-linear-to-r ${selected.color} text-white hover:opacity-90 font-semibold px-8`}
              >
                <Download className="h-5 w-5 mr-2" />
                Télécharger la checklist (PDF)
              </Button>
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
